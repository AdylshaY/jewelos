use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbState;

// ==========================================
// Structs
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductCategory {
    pub id: i64,
    pub code: String,
    pub sort_order: i32,
    pub is_active: bool,
}

/// Product catalog entry (template/definition).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: i64,
    pub name: String,
    pub category_id: i64,
    pub category_code: String,
    pub karat: u32,
    pub description: Option<String>,
    pub is_active: bool,
    pub stock_count: i64,
}

/// Individual physical piece in inventory.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockItem {
    pub id: i64,
    pub product_id: i64,
    pub product_name: String,
    pub category_code: String,
    pub barcode: String,
    pub karat: u32,
    pub weight_gram: f64,
    pub fine_gold_gram: f64,
    pub status: String,
    pub sold_date: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewProduct {
    pub name: String,
    pub category_id: i64,
    pub karat: u32,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewStockEntry {
    pub product_id: i64,
    pub weight_gram: f64,
    pub barcode: Option<String>,
    pub quantity: i32,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaleParams {
    pub stock_item_id: i64,
    pub vault_date: String,
    pub price: f64,
    pub payment_asset: String,
    pub customer_name: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StockFilters {
    pub status: Option<String>,
    pub category_id: Option<i64>,
    pub product_id: Option<i64>,
    pub search: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryTransaction {
    pub id: i64,
    pub stock_item_id: i64,
    pub product_name: String,
    pub product_barcode: String,
    pub vault_date: String,
    pub transaction_type: String,
    pub quantity: i32,
    pub weight_gram: f64,
    pub karat: u32,
    pub fine_gold_gram: f64,
    pub price_try: Option<f64>,
    pub payment_asset: Option<String>,
    pub counterparty: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
}

// ==========================================
// Helpers
// ==========================================

/// Convert karat to purity ratio.
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

/// Fetch exchange rates for a date to do asset conversions.
fn get_rates_for_date(conn: &Connection, date: &str) -> Result<(f64, f64, f64), String> {
    let mut stmt = conn
        .prepare("SELECT currency, buy_rate FROM exchange_rates WHERE rate_date = ?")
        .map_err(|e| format!("Failed to prepare rates statement: {}", e))?;

    let rows = stmt
        .query_map(params![date], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, f64>(1)?))
        })
        .map_err(|e| format!("Failed to query rates: {}", e))?;

    let mut usd_buy = 0.0;
    let mut eur_buy = 0.0;
    let mut gold_buy = 0.0;
    let mut count = 0;

    for row in rows {
        let (currency, buy) = row.map_err(|e| format!("Error reading rate row: {}", e))?;
        count += 1;
        match currency.as_str() {
            "USD" => usd_buy = buy,
            "EUR" => eur_buy = buy,
            "GOLD_GRAM_TRY" => gold_buy = buy,
            _ => {}
        }
    }

    if count == 0 {
        return Err(format!("Kur bilgileri bulunamadı. Lütfen önce {} tarihli kasayı açın.", date));
    }

    if gold_buy <= 0.0 {
        return Err("Altın alış kuru sıfırdan büyük olmalıdır.".to_string());
    }

    Ok((usd_buy, eur_buy, gold_buy))
}

/// Verify vault is open for a given date and return error if not.
fn verify_vault_open(conn: &Connection, date: &str) -> Result<(), String> {
    let vault_status: Option<String> = conn
        .query_row(
            "SELECT status FROM daily_vault WHERE date = ?",
            params![date],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| format!("Failed to query vault: {}", e))?;

    match vault_status {
        None => Err(format!("{} tarihi için henüz bir kasa açılmamış.", date)),
        Some(s) if s == "closed" => Err("Kapalı kasaya işlem yapılamaz.".to_string()),
        _ => Ok(()),
    }
}

// ==========================================
// Category Commands (unchanged)
// ==========================================

#[tauri::command]
pub async fn get_categories(state: State<'_, DbState>) -> Result<Vec<ProductCategory>, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let mut stmt = conn
        .prepare("SELECT id, code, sort_order, is_active FROM product_categories WHERE is_active = 1 ORDER BY sort_order ASC")
        .map_err(|e| format!("Failed to prepare categories statement: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            let is_active_int: i32 = row.get(3)?;
            Ok(ProductCategory {
                id: row.get(0)?,
                code: row.get(1)?,
                sort_order: row.get(2)?,
                is_active: is_active_int == 1,
            })
        })
        .map_err(|e| format!("Failed to query categories: {}", e))?;

    let mut categories = Vec::new();
    for row in rows {
        categories.push(row.map_err(|e| format!("Failed to read category row: {}", e))?);
    }

    Ok(categories)
}

#[tauri::command]
pub async fn add_category(
    state: State<'_, DbState>,
    code: String,
    sort_order: i32,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let code_trimmed = code.trim().to_lowercase();
    if code_trimmed.is_empty() {
        return Err("Kategori kodu boş olamaz.".to_string());
    }

    conn.execute(
        "INSERT INTO product_categories (code, sort_order) VALUES (?, ?)",
        params![code_trimmed, sort_order],
    )
    .map_err(|e| format!("Kategori eklenirken hata oluştu (Kategori kodu benzersiz olmalıdır): {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn update_category(
    state: State<'_, DbState>,
    id: i64,
    code: String,
    sort_order: i32,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let code_trimmed = code.trim().to_lowercase();
    if code_trimmed.is_empty() {
        return Err("Kategori kodu boş olamaz.".to_string());
    }

    conn.execute(
        "UPDATE product_categories SET code = ?, sort_order = ? WHERE id = ?",
        params![code_trimmed, sort_order, id],
    )
    .map_err(|e| format!("Kategori güncellenirken hata oluştu (Kategori adı benzersiz olmalıdır): {}", e))?;

    Ok(())
}

// ==========================================
// Product Catalog Commands
// ==========================================

#[tauri::command]
pub async fn get_products(
    state: State<'_, DbState>,
) -> Result<Vec<Product>, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let mut stmt = conn
        .prepare(
            "SELECT p.id, p.name, p.category_id, c.code, p.karat, p.description, p.is_active,
                    (SELECT COUNT(*) FROM stock_items s WHERE s.product_id = p.id AND s.status = 'in_stock') as stock_count
             FROM products p
             JOIN product_categories c ON p.category_id = c.id
             WHERE p.is_active = 1
             ORDER BY p.name ASC"
        )
        .map_err(|e| format!("Failed to prepare products query: {}", e))?;

    let rows = stmt
        .query_map([], |row| {
            let is_active_int: i32 = row.get(6)?;
            Ok(Product {
                id: row.get(0)?,
                name: row.get(1)?,
                category_id: row.get(2)?,
                category_code: row.get(3)?,
                karat: row.get(4)?,
                description: row.get(5)?,
                is_active: is_active_int == 1,
                stock_count: row.get(7)?,
            })
        })
        .map_err(|e| format!("Failed to fetch products: {}", e))?;

    let mut products = Vec::new();
    for row in rows {
        products.push(row.map_err(|e| format!("Failed to read product row: {}", e))?);
    }

    Ok(products)
}

#[tauri::command]
pub async fn add_product(
    state: State<'_, DbState>,
    product: NewProduct,
) -> Result<i64, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let name_trimmed = product.name.trim().to_string();
    if name_trimmed.is_empty() {
        return Err("Ürün adı boş olamaz.".to_string());
    }

    conn.execute(
        "INSERT INTO products (name, category_id, karat, description) VALUES (?, ?, ?, ?)",
        params![name_trimmed, product.category_id, product.karat, product.description],
    )
    .map_err(|e| format!("Ürün tanımı eklenirken hata oluştu: {}", e))?;

    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub async fn update_product(
    state: State<'_, DbState>,
    id: i64,
    name: String,
    description: Option<String>,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let name_trimmed = name.trim().to_string();
    if name_trimmed.is_empty() {
        return Err("Ürün adı boş olamaz.".to_string());
    }

    conn.execute(
        "UPDATE products SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?",
        params![name_trimmed, description, id],
    )
    .map_err(|e| format!("Ürün tanımı güncellenirken hata oluştu: {}", e))?;

    Ok(())
}

// ==========================================
// Stock Item Commands
// ==========================================

#[tauri::command]
pub async fn get_stock_items(
    state: State<'_, DbState>,
    filters: StockFilters,
) -> Result<Vec<StockItem>, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let mut query = String::from(
        "SELECT s.id, s.product_id, p.name, c.code, s.barcode, p.karat, s.weight_gram, s.fine_gold_gram, s.status, s.notes, s.created_at,
                (SELECT vault_date FROM inventory_transactions WHERE stock_item_id = s.id AND transaction_type = 'sale' LIMIT 1) as sold_date
         FROM stock_items s
         JOIN products p ON s.product_id = p.id
         JOIN product_categories c ON p.category_id = c.id
         WHERE 1=1"
    );

    let mut params_vec: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(status) = &filters.status {
        if status != "all" {
            query.push_str(" AND s.status = ?");
            params_vec.push(Box::new(status.clone()));
        }
    }

    if let Some(cat_id) = filters.category_id {
        query.push_str(" AND p.category_id = ?");
        params_vec.push(Box::new(cat_id));
    }

    if let Some(prod_id) = filters.product_id {
        query.push_str(" AND s.product_id = ?");
        params_vec.push(Box::new(prod_id));
    }

    if let Some(search) = &filters.search {
        if !search.trim().is_empty() {
            query.push_str(" AND (p.name LIKE ? OR s.barcode LIKE ?)");
            let like_term = format!("%{}%", search.trim());
            params_vec.push(Box::new(like_term.clone()));
            params_vec.push(Box::new(like_term));
        }
    }

    query.push_str(" ORDER BY s.created_at DESC");

    let mut stmt = conn
        .prepare(&query)
        .map_err(|e| format!("Failed to prepare stock items query: {}", e))?;

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec
        .iter()
        .map(|b| b.as_ref())
        .collect();

    let rows = stmt
        .query_map(rusqlite::params_from_iter(params_refs), |row| {
            Ok(StockItem {
                id: row.get(0)?,
                product_id: row.get(1)?,
                product_name: row.get(2)?,
                category_code: row.get(3)?,
                barcode: row.get(4)?,
                karat: row.get(5)?,
                weight_gram: row.get(6)?,
                fine_gold_gram: row.get(7)?,
                status: row.get(8)?,
                notes: row.get(9)?,
                created_at: row.get(10)?,
                sold_date: row.get(11)?,
            })
        })
        .map_err(|e| format!("Failed to fetch stock items: {}", e))?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row.map_err(|e| format!("Failed to read stock item row: {}", e))?);
    }

    Ok(items)
}

#[tauri::command]
pub async fn purchase_stock(
    state: State<'_, DbState>,
    vault_date: String,
    entry: NewStockEntry,
    pay_from_vault: bool,
    vault_price: Option<f64>,
    vault_asset: Option<String>,
) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    verify_vault_open(&conn, &vault_date)?;

    if entry.quantity < 1 {
        return Err("Adet en az 1 olmalıdır.".to_string());
    }

    // Verify product exists
    let product_info: Option<(String, u32)> = conn
        .query_row(
            "SELECT name, karat FROM products WHERE id = ? AND is_active = 1",
            params![entry.product_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|e| format!("Ürün sorgulanamadı: {}", e))?;

    let (product_name, karat) = match product_info {
        Some(info) => info,
        None => return Err("Ürün tanımı bulunamadı veya aktif değil.".to_string()),
    };

    let fine_gold = entry.weight_gram * purity_ratio(karat);

    let tx = conn
        .transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    // Get current stock item count for barcode generation
    let base_count: i64 = tx
        .query_row("SELECT COUNT(*) FROM stock_items", [], |row| row.get(0))
        .map_err(|e| format!("Failed to count stock items: {}", e))?;

    for i in 0..entry.quantity {
        // Determine barcode
        let barcode = if entry.quantity == 1 {
            match &entry.barcode {
                Some(b) if !b.trim().is_empty() => b.trim().to_string(),
                _ => format!("JW-{:06}", base_count + 1 + i as i64),
            }
        } else {
            format!("JW-{:06}", base_count + 1 + i as i64)
        };

        // Insert stock item
        tx.execute(
            "INSERT INTO stock_items (product_id, barcode, weight_gram, fine_gold_gram, status, notes)
             VALUES (?, ?, ?, ?, 'in_stock', ?)",
            params![entry.product_id, barcode, entry.weight_gram, fine_gold, entry.notes],
        )
        .map_err(|e| format!("Stok kalemi eklenirken hata (Barkod benzersiz olmalıdır): {}", e))?;

        let stock_item_id = tx.last_insert_rowid();

        // Create purchase transaction
        tx.execute(
            "INSERT INTO inventory_transactions (stock_item_id, vault_date, transaction_type, quantity, weight_gram, karat, fine_gold_gram, price_try, payment_asset, notes)
             VALUES (?, ?, 'purchase', 1, ?, ?, ?, ?, ?, ?)",
            params![
                stock_item_id,
                vault_date,
                entry.weight_gram,
                karat,
                fine_gold,
                vault_price,
                vault_asset,
                entry.notes
            ],
        )
        .map_err(|e| format!("Envanter hareketi oluşturulurken hata: {}", e))?;
    }

    // Cash payment flow (single entry for total)
    if pay_from_vault {
        let price = vault_price.ok_or("Ödeme miktarı boş bırakılamaz.")?;
        let asset = vault_asset.as_ref().ok_or("Ödeme yapılacak kasa para birimi seçilmelidir.")?;

        if price <= 0.0 {
            return Err("Ödeme tutarı sıfırdan büyük olmalıdır.".to_string());
        }

        let total_price = price * entry.quantity as f64;

        let (usd_buy, eur_buy, gold_buy) = get_rates_for_date(&tx, &vault_date)?;

        let asset_fine_gold = match asset.as_str() {
            "FINE_GOLD" => total_price,
            "TRY" => total_price / gold_buy,
            "USD" => (total_price * usd_buy) / gold_buy,
            "EUR" => (total_price * eur_buy) / gold_buy,
            _ => return Err(format!("Geçersiz varlık türü: {}", asset)),
        };

        let description = format!(
            "Ürün Alımı: {} × {} adet",
            product_name, entry.quantity
        );

        tx.execute(
            "INSERT INTO asset_entries (vault_date, asset_type, direction, amount, fine_gold_gram, description)
             VALUES (?, ?, 'out', ?, ?, ?)",
            params![vault_date, asset, total_price, asset_fine_gold, description],
        )
        .map_err(|e| format!("Kasa ödeme kaydı eklenirken hata: {}", e))?;
    }

    tx.commit()
        .map_err(|e| format!("Failed to commit stock purchase: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn sell_stock_item(
    state: State<'_, DbState>,
    params: SaleParams,
) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    verify_vault_open(&conn, &params.vault_date)?;

    let tx = conn
        .transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    // Fetch stock item info
    let item: Option<(i64, String, u32, f64, String)> = tx
        .query_row(
            "SELECT s.id, p.name, p.karat, s.weight_gram, s.status
             FROM stock_items s
             JOIN products p ON s.product_id = p.id
             WHERE s.id = ?",
            params![params.stock_item_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)),
        )
        .optional()
        .map_err(|e| format!("Stok kalemi sorgulanamadı: {}", e))?;

    let (_id, name, karat, weight_gram, item_status) = match item {
        Some(i) => i,
        None => return Err("Stok kalemi bulunamadı.".to_string()),
    };

    if item_status != "in_stock" {
        return Err("Sadece stoktaki kalemler satılabilir.".to_string());
    }

    // Update stock item status
    tx.execute(
        "UPDATE stock_items SET status = 'sold', updated_at = datetime('now') WHERE id = ?",
        params![params.stock_item_id],
    )
    .map_err(|e| format!("Stok kalemi durumu güncellenemedi: {}", e))?;

    // Create sale transaction
    let fine_gold = weight_gram * purity_ratio(karat);
    tx.execute(
        "INSERT INTO inventory_transactions (stock_item_id, vault_date, transaction_type, quantity, weight_gram, karat, fine_gold_gram, price_try, payment_asset, counterparty, notes)
         VALUES (?, ?, 'sale', 1, ?, ?, ?, ?, ?, ?, ?)",
        params![
            params.stock_item_id,
            params.vault_date,
            weight_gram,
            karat,
            fine_gold,
            params.price,
            params.payment_asset,
            params.customer_name,
            params.notes
        ],
    )
    .map_err(|e| format!("Envanter satış hareketi yazılamadı: {}", e))?;

    // Create vault cash entry
    if params.price <= 0.0 {
        return Err("Satış fiyatı sıfırdan büyük olmalıdır.".to_string());
    }

    let (usd_buy, eur_buy, gold_buy) = get_rates_for_date(&tx, &params.vault_date)?;

    let asset_fine_gold = match params.payment_asset.as_str() {
        "FINE_GOLD" => params.price,
        "TRY" => params.price / gold_buy,
        "USD" => (params.price * usd_buy) / gold_buy,
        "EUR" => (params.price * eur_buy) / gold_buy,
        _ => return Err(format!("Geçersiz ödeme varlığı: {}", params.payment_asset)),
    };

    let description = format!(
        "Ürün Satışı: {} (Müşteri: {})",
        name,
        params.customer_name.clone().unwrap_or_else(|| "-".to_string())
    );

    tx.execute(
        "INSERT INTO asset_entries (vault_date, asset_type, direction, amount, fine_gold_gram, description)
         VALUES (?, ?, 'in', ?, ?, ?)",
        params![
            params.vault_date,
            params.payment_asset,
            params.price,
            asset_fine_gold,
            description
        ],
    )
    .map_err(|e| format!("Kasa nakit giriş kaydı eklenirken hata: {}", e))?;

    tx.commit()
        .map_err(|e| format!("Failed to commit stock sale: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn return_stock_item(
    state: State<'_, DbState>,
    stock_item_id: i64,
    vault_date: String,
    refund_amount: f64,
    refund_asset: String,
    notes: Option<String>,
) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    verify_vault_open(&conn, &vault_date)?;

    let tx = conn
        .transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    // Fetch stock item info
    let item: Option<(String, u32, f64, String)> = tx
        .query_row(
            "SELECT p.name, p.karat, s.weight_gram, s.status
             FROM stock_items s
             JOIN products p ON s.product_id = p.id
             WHERE s.id = ?",
            params![stock_item_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .optional()
        .map_err(|e| format!("Stok kalemi sorgulanamadı: {}", e))?;

    let (name, karat, weight_gram, item_status) = match item {
        Some(i) => i,
        None => return Err("Stok kalemi bulunamadı.".to_string()),
    };

    if item_status != "sold" {
        return Err("Sadece satılmış kalemler iade alınabilir.".to_string());
    }

    // Update stock item status
    tx.execute(
        "UPDATE stock_items SET status = 'returned', updated_at = datetime('now') WHERE id = ?",
        params![stock_item_id],
    )
    .map_err(|e| format!("Stok kalemi durumu güncellenemedi: {}", e))?;

    // Create return transaction
    let fine_gold = weight_gram * purity_ratio(karat);
    tx.execute(
        "INSERT INTO inventory_transactions (stock_item_id, vault_date, transaction_type, quantity, weight_gram, karat, fine_gold_gram, price_try, payment_asset, notes)
         VALUES (?, ?, 'return', 1, ?, ?, ?, ?, ?, ?)",
        params![
            stock_item_id,
            vault_date,
            weight_gram,
            karat,
            fine_gold,
            refund_amount,
            refund_asset,
            notes
        ],
    )
    .map_err(|e| format!("Envanter iade hareketi yazılamadı: {}", e))?;

    // Create refund vault entry
    if refund_amount < 0.0 {
        return Err("İade tutarı sıfır veya pozitif olmalıdır.".to_string());
    }

    if refund_amount > 0.0 {
        let (usd_buy, eur_buy, gold_buy) = get_rates_for_date(&tx, &vault_date)?;

        let asset_fine_gold = match refund_asset.as_str() {
            "FINE_GOLD" => refund_amount,
            "TRY" => refund_amount / gold_buy,
            "USD" => (refund_amount * usd_buy) / gold_buy,
            "EUR" => (refund_amount * eur_buy) / gold_buy,
            _ => return Err(format!("Geçersiz iade ödeme varlığı: {}", refund_asset)),
        };

        let description = format!("Ürün İadesi Geri Ödemesi: {} (İade)", name);

        tx.execute(
            "INSERT INTO asset_entries (vault_date, asset_type, direction, amount, fine_gold_gram, description)
             VALUES (?, ?, 'out', ?, ?, ?)",
            params![vault_date, refund_asset, refund_amount, asset_fine_gold, description],
        )
        .map_err(|e| format!("Kasa iade geri ödeme kaydı eklenirken hata: {}", e))?;
    }

    tx.commit()
        .map_err(|e| format!("Failed to commit stock return: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_inventory_transactions(
    state: State<'_, DbState>,
    stock_item_id: Option<i64>,
) -> Result<Vec<InventoryTransaction>, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let mut query = String::from(
        "SELECT t.id, t.stock_item_id, p.name, s.barcode, t.vault_date, t.transaction_type, t.quantity, t.weight_gram, t.karat, t.fine_gold_gram, t.price_try, t.payment_asset, t.counterparty, t.notes, t.created_at
         FROM inventory_transactions t
         JOIN stock_items s ON t.stock_item_id = s.id
         JOIN products p ON s.product_id = p.id"
    );

    let mut params_vec = Vec::new();
    if let Some(sid) = stock_item_id {
        query.push_str(" WHERE t.stock_item_id = ?");
        params_vec.push(sid);
    }

    query.push_str(" ORDER BY t.created_at DESC");

    let mut stmt = conn
        .prepare(&query)
        .map_err(|e| format!("Failed to prepare inventory transactions query: {}", e))?;

    let rows = stmt
        .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
            Ok(InventoryTransaction {
                id: row.get(0)?,
                stock_item_id: row.get(1)?,
                product_name: row.get(2)?,
                product_barcode: row.get(3)?,
                vault_date: row.get(4)?,
                transaction_type: row.get(5)?,
                quantity: row.get(6)?,
                weight_gram: row.get(7)?,
                karat: row.get(8)?,
                fine_gold_gram: row.get(9)?,
                price_try: row.get(10)?,
                payment_asset: row.get(11)?,
                counterparty: row.get(12)?,
                notes: row.get(13)?,
                created_at: row.get(14)?,
            })
        })
        .map_err(|e| format!("Failed to query inventory transactions: {}", e))?;

    let mut list = Vec::new();
    for row in rows {
        list.push(row.map_err(|e| format!("Failed to read inventory transaction row: {}", e))?);
    }

    Ok(list)
}

#[tauri::command]
pub async fn delete_stock_item(
    state: State<'_, DbState>,
    stock_item_id: i64,
    vault_date: String,
) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    verify_vault_open(&conn, &vault_date)?;

    let tx = conn
        .transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    // Verify item exists and is in_stock
    let item_status: String = tx
        .query_row(
            "SELECT status FROM stock_items WHERE id = ?",
            params![stock_item_id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Stok kalemi bulunamadı veya silinemez: {}", e))?;

    if item_status != "in_stock" {
        return Err("Sadece stokta olan ürünler silinebilir.".to_string());
    }

    // Delete inventory transactions for this stock item
    tx.execute(
        "DELETE FROM inventory_transactions WHERE stock_item_id = ?",
        params![stock_item_id],
    )
    .map_err(|e| format!("Envanter hareketleri silinemedi: {}", e))?;

    // Delete the stock item
    tx.execute(
        "DELETE FROM stock_items WHERE id = ?",
        params![stock_item_id],
    )
    .map_err(|e| format!("Stok kalemi silinemedi: {}", e))?;

    tx.commit()
        .map_err(|e| format!("Failed to commit delete transaction: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn update_stock_item(
    state: State<'_, DbState>,
    stock_item_id: i64,
    weight_gram: f64,
    barcode: String,
    notes: Option<String>,
    vault_date: String,
) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    verify_vault_open(&conn, &vault_date)?;

    if weight_gram <= 0.0 {
        return Err("Ağırlık sıfırdan büyük olmalıdır.".to_string());
    }

    let barcode_trimmed = barcode.trim().to_string();
    if barcode_trimmed.is_empty() {
        return Err("Barkod boş olamaz.".to_string());
    }

    let tx = conn
        .transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    // 1. Fetch current stock item details (to get karat and previous weight)
    let current_info: Option<(u32, f64)> = tx
        .query_row(
            "SELECT p.karat, s.weight_gram
             FROM stock_items s
             JOIN products p ON s.product_id = p.id
             WHERE s.id = ?",
            params![stock_item_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|e| format!("Stok kalemi sorgulanamadı: {}", e))?;

    let (karat, old_weight) = match current_info {
        Some(info) => info,
        None => return Err("Güncellenecek stok kalemi bulunamadı.".to_string()),
    };

    let purity = purity_ratio(karat);
    let new_fine_gold = weight_gram * purity;
    let old_fine_gold = old_weight * purity;

    let diff_weight = weight_gram - old_weight;
    let diff_fine_gold = new_fine_gold - old_fine_gold;

    // 2. Update stock item
    tx.execute(
        "UPDATE stock_items 
         SET barcode = ?, weight_gram = ?, fine_gold_gram = ?, notes = ?, updated_at = datetime('now')
         WHERE id = ?",
        params![barcode_trimmed, weight_gram, new_fine_gold, notes, stock_item_id],
    )
    .map_err(|e| format!("Stok kalemi güncellenirken hata (Barkod benzersiz olmalıdır): {}", e))?;

    // 3. If weight changed, insert an adjustment record in inventory_transactions
    if diff_weight.abs() > 0.0001 {
        tx.execute(
            "INSERT INTO inventory_transactions (stock_item_id, vault_date, transaction_type, quantity, weight_gram, karat, fine_gold_gram, notes)
             VALUES (?, ?, 'adjustment', 0, ?, ?, ?, ?)",
            params![
                stock_item_id,
                vault_date,
                diff_weight,
                karat,
                diff_fine_gold,
                format!("Ağırlık düzeltmesi ({}g -> {}g)", old_weight, weight_gram)
            ],
        )
        .map_err(|e| format!("Envanter düzeltme hareketi kaydedilemedi: {}", e))?;
    }

    tx.commit()
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;

    Ok(())
}
