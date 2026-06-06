use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExchangeRatesSummary {
    pub usd_buy: f64,
    pub usd_sell: f64,
    pub eur_buy: f64,
    pub eur_sell: f64,
    pub gold_buy: f64,
    pub gold_sell: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultStatus {
    pub date: String,
    pub status: String, // "open", "closed"
    pub notes: Option<String>,
    pub rates: Option<ExchangeRatesSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpeningBalances {
    pub try_amount: f64,
    pub usd_amount: f64,
    pub eur_amount: f64,
    pub gold_amount: f64,
    pub product_amount: f64, // in fine gold grams
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewExchangeRates {
    pub usd_buy: f64,
    pub usd_sell: f64,
    pub eur_buy: f64,
    pub eur_sell: f64,
    pub gold_buy: f64,
    pub gold_sell: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewAssetEntry {
    pub vault_date: String,
    pub asset_type: String, // "TRY", "USD", "EUR", "FINE_GOLD", "PRODUCT"
    pub direction: String,  // "in", "out"
    pub amount: f64,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetEntrySummary {
    pub id: i64,
    pub asset_type: String,
    pub direction: String,
    pub amount: f64,
    pub fine_gold_gram: f64,
    pub description: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetBalance {
    pub asset_type: String,
    pub opening_balance: f64,
    pub in_amount: f64,
    pub out_amount: f64,
    pub closing_balance: f64,
    pub fine_gold_value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailySummary {
    pub date: String,
    pub status: String,
    pub rates: Option<ExchangeRatesSummary>,
    pub balances: Vec<AssetBalance>,
    pub transactions: Vec<AssetEntrySummary>,
    pub total_fine_gold: f64,
}

/// Helper function to convert karat to purity ratio.
#[allow(dead_code)]
fn purity_ratio(karat: u32) -> f64 {
    match karat {
        24 => 1.000,
        22 => 0.916,
        21 => 0.875,
        18 => 0.750,
        14 => 0.585,
        _ => 0.0,
    }
}

/// Get the active exchange rates for a specific date.
fn get_rates_for_date(conn: &Connection, date: &str) -> Result<Option<ExchangeRatesSummary>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT currency, buy_rate, sell_rate 
             FROM exchange_rates 
             WHERE rate_date = ?"
        )
        .map_err(|e| format!("Failed to prepare rates statement: {}", e))?;

    let rows = stmt
        .query_map(params![date], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, f64>(1)?,
                row.get::<_, f64>(2)?,
            ))
        })
        .map_err(|e| format!("Failed to query rates: {}", e))?;

    let mut usd_buy = 0.0;
    let mut usd_sell = 0.0;
    let mut eur_buy = 0.0;
    let mut eur_sell = 0.0;
    let mut gold_buy = 0.0;
    let mut gold_sell = 0.0;
    let mut found = false;

    for row_res in rows {
        let (currency, buy, sell) = row_res.map_err(|e| format!("Error reading rate row: {}", e))?;
        found = true;
        match currency.as_str() {
            "USD" => {
                usd_buy = buy;
                usd_sell = sell;
            }
            "EUR" => {
                eur_buy = buy;
                eur_sell = sell;
            }
            "GOLD_GRAM_TRY" => {
                gold_buy = buy;
                gold_sell = sell;
            }
            _ => {}
        }
    }

    if found {
        Ok(Some(ExchangeRatesSummary {
            usd_buy,
            usd_sell,
            eur_buy,
            eur_sell,
            gold_buy,
            gold_sell,
        }))
    } else {
        Ok(None)
    }
}

/// Calculate the fine gold equivalent for an asset amount based on rates.
fn calculate_fine_gold(
    asset_type: &str,
    amount: f64,
    rates: &ExchangeRatesSummary,
) -> Result<f64, String> {
    if rates.gold_buy <= 0.0 {
        return Err("Gold buy rate must be greater than zero for valuation".to_string());
    }

    match asset_type {
        "FINE_GOLD" | "PRODUCT" => Ok(amount),
        "TRY" => Ok(amount / rates.gold_buy),
        "USD" => Ok((amount * rates.usd_buy) / rates.gold_buy),
        "EUR" => Ok((amount * rates.eur_buy) / rates.gold_buy),
        _ => Err(format!("Invalid asset type: {}", asset_type)),
    }
}

// ==========================================
// Tauri Commands
// ==========================================

#[tauri::command]
pub async fn get_vault_status(
    state: State<'_, DbState>,
    date: String,
) -> Result<Option<VaultStatus>, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let vault: Option<(String, Option<String>)> = conn
        .query_row(
            "SELECT status, notes FROM daily_vault WHERE date = ?",
            params![date],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|e| format!("Failed to query daily_vault: {}", e))?;

    match vault {
        Some((status, notes)) => {
            let rates = get_rates_for_date(&conn, &date)?;
            Ok(Some(VaultStatus {
                date,
                status,
                notes,
                rates,
            }))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn get_last_exchange_rates(
    state: State<'_, DbState>,
) -> Result<Option<ExchangeRatesSummary>, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    // Find the latest rate_date
    let latest_date: Option<String> = conn
        .query_row(
            "SELECT rate_date FROM exchange_rates ORDER BY rate_date DESC LIMIT 1",
            [],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| format!("Failed to query latest rate date: {}", e))?;

    match latest_date {
        Some(date) => get_rates_for_date(&conn, &date),
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn open_daily_vault(
    state: State<'_, DbState>,
    date: String,
    rates: NewExchangeRates,
    opening_balances: Option<OpeningBalances>,
) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    // Ensure vault is not already created for this date
    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM daily_vault WHERE date = ?)",
            params![date],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to check vault existence: {}", e))?;

    if exists {
        return Err(format!("Daily vault already exists for date {}", date));
    }

    // Start transaction
    let tx = conn
        .transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    // 1. Insert daily vault record
    tx.execute(
        "INSERT INTO daily_vault (date, status) VALUES (?, 'open')",
        params![date],
    )
    .map_err(|e| format!("Failed to insert daily vault: {}", e))?;

    // 2. Insert exchange rates
    tx.execute(
        "INSERT INTO exchange_rates (rate_date, currency, buy_rate, sell_rate) VALUES (?, 'USD', ?, ?)",
        params![date, rates.usd_buy, rates.usd_sell],
    )
    .map_err(|e| format!("Failed to insert USD rates: {}", e))?;

    tx.execute(
        "INSERT INTO exchange_rates (rate_date, currency, buy_rate, sell_rate) VALUES (?, 'EUR', ?, ?)",
        params![date, rates.eur_buy, rates.eur_sell],
    )
    .map_err(|e| format!("Failed to insert EUR rates: {}", e))?;

    tx.execute(
        "INSERT INTO exchange_rates (rate_date, currency, buy_rate, sell_rate) VALUES (?, 'GOLD_GRAM_TRY', ?, ?)",
        params![date, rates.gold_buy, rates.gold_sell],
    )
    .map_err(|e| format!("Failed to insert gold rates: {}", e))?;

    // 3. Insert opening balances if it is the first vault and balances are provided
    if let Some(balances) = opening_balances {
        // Double check if this is indeed the first vault (count of vaults before this date)
        let count: i64 = tx
            .query_row(
                "SELECT COUNT(*) FROM daily_vault WHERE date < ?",
                params![date],
                |row| row.get(0),
            )
            .map_err(|e| format!("Failed to verify first vault status: {}", e))?;

        if count == 0 {
            let rates_summary = ExchangeRatesSummary {
                usd_buy: rates.usd_buy,
                usd_sell: rates.usd_sell,
                eur_buy: rates.eur_buy,
                eur_sell: rates.eur_sell,
                gold_buy: rates.gold_buy,
                gold_sell: rates.gold_sell,
            };

            let entries = vec![
                ("TRY", balances.try_amount),
                ("USD", balances.usd_amount),
                ("EUR", balances.eur_amount),
                ("FINE_GOLD", balances.gold_amount),
                ("PRODUCT", balances.product_amount),
            ];

            for (asset_type, amount) in entries {
                if amount > 0.0 {
                    let fine_gold = calculate_fine_gold(asset_type, amount, &rates_summary)?;
                    tx.execute(
                        "INSERT INTO asset_entries (vault_date, asset_type, direction, amount, fine_gold_gram, description) 
                         VALUES (?, ?, 'in', ?, ?, 'Açılış Bakiyesi')",
                        params![date, asset_type, amount, fine_gold],
                    )
                    .map_err(|e| format!("Failed to insert opening balance for {}: {}", asset_type, e))?;
                }
            }
        }
    }

    tx.commit()
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn add_asset_transaction(
    state: State<'_, DbState>,
    entry: NewAssetEntry,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    // 1. Verify vault exists and is open
    let vault_status: Option<String> = conn
        .query_row(
            "SELECT status FROM daily_vault WHERE date = ?",
            params![entry.vault_date],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| format!("Failed to query vault status: {}", e))?;

    let status = match vault_status {
        Some(s) => s,
        None => return Err(format!("Daily vault does not exist for date {}", entry.vault_date)),
    };

    if status == "closed" {
        return Err("Cannot add transaction to a closed vault".to_string());
    }

    // 2. Retrieve exchange rates for the date
    let rates = get_rates_for_date(&conn, &entry.vault_date)?
        .ok_or_else(|| format!("Exchange rates not found for date {}", entry.vault_date))?;

    // 3. Calculate fine gold gram
    let fine_gold = calculate_fine_gold(&entry.asset_type, entry.amount, &rates)?;

    // 4. Insert transaction
    conn.execute(
        "INSERT INTO asset_entries (vault_date, asset_type, direction, amount, fine_gold_gram, description) 
         VALUES (?, ?, ?, ?, ?, ?)",
        params![
            entry.vault_date,
            entry.asset_type,
            entry.direction,
            entry.amount,
            fine_gold,
            entry.description
        ],
    )
    .map_err(|e| format!("Failed to insert asset transaction: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn close_daily_vault(
    state: State<'_, DbState>,
    date: String,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    // Verify vault is currently open
    let vault_status: Option<String> = conn
        .query_row(
            "SELECT status FROM daily_vault WHERE date = ?",
            params![date],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| format!("Failed to query vault status: {}", e))?;

    let status = match vault_status {
        Some(s) => s,
        None => return Err(format!("Daily vault does not exist for date {}", date)),
    };

    if status == "closed" {
        return Err("Daily vault is already closed".to_string());
    }

    // Update status to closed
    conn.execute(
        "UPDATE daily_vault SET status = 'closed', updated_at = datetime('now') WHERE date = ?",
        params![date],
    )
    .map_err(|e| format!("Failed to close daily vault: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_daily_summary(
    state: State<'_, DbState>,
    date: String,
) -> Result<DailySummary, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    // 1. Get vault status
    let vault: Option<String> = conn
        .query_row(
            "SELECT status FROM daily_vault WHERE date = ?",
            params![date],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| format!("Failed to query daily_vault: {}", e))?;

    let status = match vault {
        Some(s) => s,
        None => return Err(format!("Daily vault does not exist for date {}", date)),
    };

    // 2. Get exchange rates
    let rates = get_rates_for_date(&conn, &date)?;
    let rates_ref = rates.as_ref().ok_or_else(|| format!("Exchange rates not found for date {}", date))?;

    // 3. Query all transactions for the day
    let mut stmt = conn
        .prepare(
            "SELECT id, asset_type, direction, amount, fine_gold_gram, description, created_at 
             FROM asset_entries 
             WHERE vault_date = ?
             ORDER BY created_at ASC"
        )
        .map_err(|e| format!("Failed to prepare transaction statement: {}", e))?;

    let tx_rows = stmt
        .query_map(params![date], |row| {
            Ok(AssetEntrySummary {
                id: row.get(0)?,
                asset_type: row.get(1)?,
                direction: row.get(2)?,
                amount: row.get(3)?,
                fine_gold_gram: row.get(4)?,
                description: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| format!("Failed to query day's transactions: {}", e))?;

    let mut transactions = Vec::new();
    for row in tx_rows {
        transactions.push(row.map_err(|e| format!("Error parsing transaction row: {}", e))?);
    }

    // 4. Calculate balances for each asset type
    let asset_types = vec!["TRY", "USD", "EUR", "FINE_GOLD", "PRODUCT"];
    let mut balances = Vec::new();
    let mut total_fine_gold = 0.0;

    for asset_type in asset_types {
        // A. Opening balance: cumulative sum before this date
        let opening_balance: f64 = conn
            .query_row(
                "SELECT COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END), 0.0) 
                 FROM asset_entries 
                 WHERE asset_type = ? AND vault_date < ?",
                params![asset_type, date],
                |row| row.get(0),
            )
            .map_err(|e| format!("Failed to calculate opening balance for {}: {}", asset_type, e))?;

        // Adjust opening balance for PRODUCT based on inventory_transactions before this date
        let mut adjusted_opening = opening_balance;
        if asset_type == "PRODUCT" {
            let inv_before: f64 = conn
                .query_row(
                    "SELECT COALESCE(SUM(
                        CASE 
                            WHEN transaction_type IN ('purchase', 'return') THEN fine_gold_gram 
                            WHEN transaction_type IN ('sale', 'transfer') THEN -fine_gold_gram
                            ELSE 0.0 
                        END
                     ), 0.0)
                     FROM inventory_transactions
                     WHERE vault_date < ?",
                    params![date],
                    |row| row.get(0),
                )
                .map_err(|e| format!("Failed to query historical inventory transactions: {}", e))?;
            adjusted_opening += inv_before;
        }

        // B. In amount and Out amount on this day
        let (in_amount, out_amount): (f64, f64) = conn
            .query_row(
                "SELECT 
                    COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE 0.0 END), 0.0),
                    COALESCE(SUM(CASE WHEN direction = 'out' THEN amount ELSE 0.0 END), 0.0)
                 FROM asset_entries 
                 WHERE asset_type = ? AND vault_date = ?",
                params![asset_type, date],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .map_err(|e| format!("Failed to calculate day's transaction flows for {}: {}", asset_type, e))?;

        // Adjust day flows for PRODUCT based on inventory_transactions on this date
        let mut adjusted_in = in_amount;
        let mut adjusted_out = out_amount;
        if asset_type == "PRODUCT" {
            let (inv_in, inv_out): (f64, f64) = conn
                .query_row(
                    "SELECT 
                        COALESCE(SUM(CASE WHEN transaction_type IN ('purchase', 'return') THEN fine_gold_gram ELSE 0.0 END), 0.0),
                        COALESCE(SUM(CASE WHEN transaction_type IN ('sale', 'transfer') THEN fine_gold_gram ELSE 0.0 END), 0.0)
                     FROM inventory_transactions
                     WHERE vault_date = ?",
                    params![date],
                    |row| Ok((row.get(0)?, row.get(1)?)),
                )
                .map_err(|e| format!("Failed to query day's inventory transactions: {}", e))?;
            adjusted_in += inv_in;
            adjusted_out += inv_out;
        }

        // C. Closing balance
        let closing_balance = adjusted_opening + adjusted_in - adjusted_out;

        // D. Valuation in fine gold gram
        let fine_gold_value = calculate_fine_gold(asset_type, closing_balance, rates_ref)?;
        total_fine_gold += fine_gold_value;

        balances.push(AssetBalance {
            asset_type: asset_type.to_string(),
            opening_balance: adjusted_opening,
            in_amount: adjusted_in,
            out_amount: adjusted_out,
            closing_balance,
            fine_gold_value,
        });
    }

    Ok(DailySummary {
        date,
        status,
        rates,
        balances,
        transactions,
        total_fine_gold,
    })
}
