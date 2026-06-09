use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Customer {
    pub id: i64,
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
    pub balance_try: f64,
    pub balance_usd: f64,
    pub balance_eur: f64,
    pub balance_gold: f64,
    pub balance_consolidated_gold: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomerTransaction {
    pub id: i64,
    pub customer_id: i64,
    pub vault_date: String,
    pub transaction_type: String,
    pub direction: String,
    pub asset_type: String,
    pub amount: f64,
    pub fine_gold_gram: f64,
    pub notes: Option<String>,
    pub inventory_transaction_id: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomerDetails {
    pub customer: Customer,
    pub transactions: Vec<CustomerTransaction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewCustomer {
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewCustomerTransaction {
    pub customer_id: i64,
    pub vault_date: String,
    pub transaction_type: String, // 'payment', 'deposit', 'withdrawal', 'adjustment'
    pub direction: String,        // 'credit', 'debt'
    pub asset_type: String,       // 'TRY', 'USD', 'EUR', 'FINE_GOLD'
    pub amount: f64,
    pub notes: Option<String>,
    pub pay_from_vault: bool,
}

// Helpers
fn get_latest_rates(conn: &Connection) -> Result<(f64, f64, f64), String> {
    let latest_date: Option<String> = conn
        .query_row(
            "SELECT date FROM daily_vault ORDER BY date DESC LIMIT 1",
            [],
            |row| row.get(0)
        )
        .optional()
        .map_err(|e| format!("Failed to query latest vault: {}", e))?;
    
    let date = match latest_date {
        Some(d) => d,
        None => return Ok((0.0, 0.0, 0.0))
    };

    let mut stmt = conn
        .prepare("SELECT currency, buy_rate FROM exchange_rates WHERE rate_date = ?")
        .map_err(|e| format!("Prepare rates error: {}", e))?;
    
    let rows = stmt
        .query_map(params![date], |row| Ok((row.get::<_, String>(0)?, row.get::<_, f64>(1)?)))
        .map_err(|e| format!("Query rates error: {}", e))?;

    let mut usd_buy = 0.0;
    let mut eur_buy = 0.0;
    let mut gold_buy = 0.0;

    for row in rows {
        let (currency, buy) = row.map_err(|e| format!("Read rate error: {}", e))?;
        match currency.as_str() {
            "USD" => usd_buy = buy,
            "EUR" => eur_buy = buy,
            "GOLD_GRAM_TRY" => gold_buy = buy,
            _ => {}
        }
    }

    Ok((usd_buy, eur_buy, gold_buy))
}

// Tauri Commands

#[tauri::command]
pub async fn get_customers(state: State<'_, DbState>) -> Result<Vec<Customer>, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let (usd_buy, eur_buy, gold_buy) = get_latest_rates(&conn)?;

    let mut stmt = conn
        .prepare("SELECT id, name, phone, email, address, notes, is_active, created_at, updated_at FROM customers WHERE is_active = 1 ORDER BY name ASC")
        .map_err(|e| format!("Prepare error: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            let is_active_int: i32 = row.get(6)?;
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, Option<String>>(5)?,
                is_active_int == 1,
                row.get::<_, String>(7)?,
                row.get::<_, String>(8)?,
            ))
        })
        .map_err(|e| format!("Query error: {}", e))?;

    let mut list = Vec::new();
    for row in rows {
        let (id, name, phone, email, address, notes, is_active, created_at, updated_at) = row.map_err(|e| format!("Row error: {}", e))?;
        
        let mut bal_try = 0.0;
        let mut bal_usd = 0.0;
        let mut bal_eur = 0.0;
        let mut bal_gold = 0.0;

        let mut bal_stmt = conn
            .prepare("SELECT asset_type, SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END) FROM customer_transactions WHERE customer_id = ? GROUP BY asset_type")
            .map_err(|e| format!("Prepare bal error: {}", e))?;
        
        let bal_rows = bal_stmt
            .query_map(params![id], |r| Ok((r.get::<_, String>(0)?, r.get::<_, f64>(1)?)))
            .map_err(|e| format!("Query bal error: {}", e))?;

        for br in bal_rows {
            let (asset, val) = br.map_err(|e| format!("Read bal error: {}", e))?;
            match asset.as_str() {
                "TRY" => bal_try = val,
                "USD" => bal_usd = val,
                "EUR" => bal_eur = val,
                "FINE_GOLD" => bal_gold = val,
                _ => {}
            }
        }

        let mut bal_consolidated = bal_gold;
        if gold_buy > 0.0 {
            bal_consolidated += bal_try / gold_buy;
            bal_consolidated += (bal_usd * usd_buy) / gold_buy;
            bal_consolidated += (bal_eur * eur_buy) / gold_buy;
        }

        list.push(Customer {
            id,
            name,
            phone,
            email,
            address,
            notes,
            is_active,
            created_at,
            updated_at,
            balance_try: bal_try,
            balance_usd: bal_usd,
            balance_eur: bal_eur,
            balance_gold: bal_gold,
            balance_consolidated_gold: bal_consolidated,
        });
    }

    Ok(list)
}

#[tauri::command]
pub async fn get_customer_details(
    state: State<'_, DbState>,
    id: i64,
) -> Result<CustomerDetails, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let (usd_buy, eur_buy, gold_buy) = get_latest_rates(&conn)?;

    let customer_profile: Option<(String, Option<String>, Option<String>, Option<String>, Option<String>, bool, String, String)> = conn
        .query_row(
            "SELECT name, phone, email, address, notes, is_active, created_at, updated_at FROM customers WHERE id = ?",
            params![id],
            |row| {
                let is_active_int: i32 = row.get(5)?;
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    is_active_int == 1,
                    row.get(6)?,
                    row.get(7)?,
                ))
            }
        )
        .optional()
        .map_err(|e| format!("Query customer profile error: {}", e))?;

    let (name, phone, email, address, notes, is_active, created_at, updated_at) = match customer_profile {
        Some(p) => p,
        None => return Err("Müşteri bulunamadı.".to_string()),
    };

    let mut bal_try = 0.0;
    let mut bal_usd = 0.0;
    let mut bal_eur = 0.0;
    let mut bal_gold = 0.0;

    let mut bal_stmt = conn
        .prepare("SELECT asset_type, SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END) FROM customer_transactions WHERE customer_id = ? GROUP BY asset_type")
        .map_err(|e| format!("Prepare bal error: {}", e))?;
    
    let bal_rows = bal_stmt
        .query_map(params![id], |r| Ok((r.get::<_, String>(0)?, r.get::<_, f64>(1)?)))
        .map_err(|e| format!("Query bal error: {}", e))?;

    for br in bal_rows {
        let (asset, val) = br.map_err(|e| format!("Read bal error: {}", e))?;
        match asset.as_str() {
            "TRY" => bal_try = val,
            "USD" => bal_usd = val,
            "EUR" => bal_eur = val,
            "FINE_GOLD" => bal_gold = val,
            _ => {}
        }
    }

    let mut bal_consolidated = bal_gold;
    if gold_buy > 0.0 {
        bal_consolidated += bal_try / gold_buy;
        bal_consolidated += (bal_usd * usd_buy) / gold_buy;
        bal_consolidated += (bal_eur * eur_buy) / gold_buy;
    }

    let customer = Customer {
        id,
        name,
        phone,
        email,
        address,
        notes,
        is_active,
        created_at,
        updated_at,
        balance_try: bal_try,
        balance_usd: bal_usd,
        balance_eur: bal_eur,
        balance_gold: bal_gold,
        balance_consolidated_gold: bal_consolidated,
    };

    let mut stmt = conn
        .prepare(
            "SELECT id, customer_id, vault_date, transaction_type, direction, asset_type, amount, fine_gold_gram, notes, inventory_transaction_id, created_at 
             FROM customer_transactions 
             WHERE customer_id = ? 
             ORDER BY created_at DESC"
        )
        .map_err(|e| format!("Prepare transactions query error: {}", e))?;

    let rows = stmt
        .query_map(params![id], |row| {
            Ok(CustomerTransaction {
                id: row.get(0)?,
                customer_id: row.get(1)?,
                vault_date: row.get(2)?,
                transaction_type: row.get(3)?,
                direction: row.get(4)?,
                asset_type: row.get(5)?,
                amount: row.get(6)?,
                fine_gold_gram: row.get(7)?,
                notes: row.get(8)?,
                inventory_transaction_id: row.get(9)?,
                created_at: row.get(10)?,
            })
        })
        .map_err(|e| format!("Query transactions error: {}", e))?;

    let mut transactions = Vec::new();
    for r in rows {
        transactions.push(r.map_err(|e| format!("Read transaction row error: {}", e))?);
    }

    Ok(CustomerDetails { customer, transactions })
}

#[tauri::command]
pub async fn add_customer(
    state: State<'_, DbState>,
    customer: NewCustomer,
) -> Result<i64, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let name_trimmed = customer.name.trim().to_string();
    if name_trimmed.is_empty() {
        return Err("Müşteri adı boş olamaz.".to_string());
    }

    conn.execute(
        "INSERT INTO customers (name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?)",
        params![name_trimmed, customer.phone, customer.email, customer.address, customer.notes],
    )
    .map_err(|e| format!("Müşteri eklenirken hata: {}", e))?;

    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub async fn update_customer(
    state: State<'_, DbState>,
    id: i64,
    customer: NewCustomer,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let name_trimmed = customer.name.trim().to_string();
    if name_trimmed.is_empty() {
        return Err("Müşteri adı boş olamaz.".to_string());
    }

    conn.execute(
        "UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, notes = ?, updated_at = datetime('now') WHERE id = ?",
        params![name_trimmed, customer.phone, customer.email, customer.address, customer.notes, id],
    )
    .map_err(|e| format!("Müşteri güncellenirken hata: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn delete_customer(
    state: State<'_, DbState>,
    id: i64,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    conn.execute(
        "UPDATE customers SET is_active = 0, updated_at = datetime('now') WHERE id = ?",
        params![id],
    )
    .map_err(|e| format!("Müşteri silinirken hata: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn add_customer_transaction(
    state: State<'_, DbState>,
    tx_param: NewCustomerTransaction,
) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let vault_status: Option<String> = conn
        .query_row(
            "SELECT status FROM daily_vault WHERE date = ?",
            params![tx_param.vault_date],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| format!("Failed to query vault: {}", e))?;

    match vault_status {
        None => return Err(format!("{} tarihi için henüz bir kasa açılmamış.", tx_param.vault_date)),
        Some(s) if s == "closed" => return Err("Kapalı kasaya işlem yapılamaz.".to_string()),
        _ => {}
    }

    if tx_param.amount <= 0.0 {
        return Err("Tutar sıfırdan büyük olmalıdır.".to_string());
    }

    let (usd_buy, eur_buy, gold_buy) = {
        let mut stmt = conn
            .prepare("SELECT currency, buy_rate FROM exchange_rates WHERE rate_date = ?")
            .map_err(|e| format!("Prepare rates error: {}", e))?;
        
        let rows = stmt
            .query_map(params![tx_param.vault_date], |row| Ok((row.get::<_, String>(0)?, row.get::<_, f64>(1)?)))
            .map_err(|e| format!("Query rates error: {}", e))?;

        let mut usd_buy = 0.0;
        let mut eur_buy = 0.0;
        let mut gold_buy = 0.0;

        for row in rows {
            let (currency, buy) = row.map_err(|e| format!("Read rate error: {}", e))?;
            match currency.as_str() {
                "USD" => usd_buy = buy,
                "EUR" => eur_buy = buy,
                "GOLD_GRAM_TRY" => gold_buy = buy,
                _ => {}
            }
        }
        (usd_buy, eur_buy, gold_buy)
    };

    let asset_fine_gold = match tx_param.asset_type.as_str() {
        "FINE_GOLD" => tx_param.amount,
        "TRY" => {
            if gold_buy <= 0.0 {
                return Err("Altın alış kuru tanımlanmamış. İşlem yapılamıyor.".to_string());
            }
            tx_param.amount / gold_buy
        }
        "USD" => {
            if gold_buy <= 0.0 {
                return Err("Altın alış kuru tanımlanmamış. İşlem yapılamıyor.".to_string());
            }
            (tx_param.amount * usd_buy) / gold_buy
        }
        "EUR" => {
            if gold_buy <= 0.0 {
                return Err("Altın alış kuru tanımlanmamış. İşlem yapılamıyor.".to_string());
            }
            (tx_param.amount * eur_buy) / gold_buy
        }
        _ => return Err(format!("Geçersiz varlık türü: {}", tx_param.asset_type)),
    };

    let sql_tx = conn
        .transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    let customer_name: String = sql_tx
        .query_row(
            "SELECT name FROM customers WHERE id = ?",
            params![tx_param.customer_id],
            |row| row.get(0)
        )
        .map_err(|e| format!("Müşteri sorgulanırken hata: {}", e))?;

    sql_tx.execute(
        "INSERT INTO customer_transactions (customer_id, vault_date, transaction_type, direction, asset_type, amount, fine_gold_gram, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            tx_param.customer_id,
            tx_param.vault_date,
            tx_param.transaction_type,
            tx_param.direction,
            tx_param.asset_type,
            tx_param.amount,
            asset_fine_gold,
            tx_param.notes
        ]
    )
    .map_err(|e| format!("Müşteri cari hareketi eklenirken hata: {}", e))?;

    if tx_param.pay_from_vault {
        let vault_direction = match tx_param.direction.as_str() {
            "credit" => "in", // Customer pays us -> Cash enters vault
            "debt" => "out",  // Customer withdraws -> Cash leaves vault
            _ => return Err("Geçersiz işlem yönü.".to_string())
        };

        let type_label = match tx_param.transaction_type.as_str() {
            "payment" => "Cari Hesap Ödemesi",
            "deposit" => "Müşteri Emanet Alımı",
            "withdrawal" => "Müşteri Emanet Teslimi",
            "adjustment" => "Cari Hesap Düzeltme",
            _ => "Cari Hesap Hareketi"
        };

        let vault_description = format!(
            "Müşteri: {} - {} ({})",
            customer_name,
            type_label,
            tx_param.notes.clone().unwrap_or_else(|| "-".to_string())
        );

        sql_tx.execute(
            "INSERT INTO asset_entries (vault_date, asset_type, direction, amount, fine_gold_gram, description)
             VALUES (?, ?, ?, ?, ?, ?)",
            params![
                tx_param.vault_date,
                tx_param.asset_type,
                vault_direction,
                tx_param.amount,
                asset_fine_gold,
                vault_description
            ]
        )
        .map_err(|e| format!("Kasa nakit hareketi kaydedilirken hata: {}", e))?;
    }

    sql_tx.commit()
        .map_err(|e| format!("Failed to commit CRM transaction: {}", e))?;

    Ok(())
}
