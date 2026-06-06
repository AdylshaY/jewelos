use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductCategory {
    pub id: i64,
    pub code: String, // "ring", "necklace", etc.
    pub sort_order: i32,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: i64,
    pub barcode: String,
    pub name: String,
    pub category_id: i64,
    pub category_code: String,
    pub karat: u32,
    pub weight_gram: f64,
    pub fine_gold_gram: f64,
    pub status: String, // "in_stock", "sold", "returned"
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InventoryTransaction {
    pub id: i64,
    pub product_id: i64,
    pub product_name: String,
    pub product_barcode: String,
    pub vault_date: String,
    pub transaction_type: String, // "purchase", "sale", "return", "adjustment", "transfer"
    pub quantity: i32,
    pub weight_gram: f64,
    pub karat: u32,
    pub fine_gold_gram: f64,
    pub price_try: Option<f64>,
    pub counterparty: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewProduct {
    pub barcode: Option<String>,
    pub name: String,
    pub category_id: i64,
    pub karat: u32,
    pub weight_gram: f64,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaleParams {
    pub product_id: i64,
    pub vault_date: String,
    pub price: f64,
    pub payment_asset: String, // "TRY", "USD", "EUR", "FINE_GOLD"
    pub customer_name: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductFilters {
    pub status: Option<String>,
    pub category_id: Option<i64>,
    pub search: Option<String>,
}

/// Helper function to convert karat to purity ratio.
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

/// Fetch USD/EUR/GOLD rates for a date to do asset_entries conversion.
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

// ==========================================
// Tauri Commands
// ==========================================

#[tauri::command]
pub async fn get_products(
    state: State<'_, DbState>,
    filters: ProductFilters,
) -> Result<Vec<Product>, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let mut query = String::from(
        "SELECT p.id, p.barcode, p.name, p.category_id, c.code, p.karat, p.weight_gram, p.status, p.notes, p.created_at 
         FROM products p
         JOIN product_categories c ON p.category_id = c.id
         WHERE 1=1"
    );

    let mut params_vec: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(status) = &filters.status {
        if status != "all" {
            query.push_str(" AND p.status = ?");
            params_vec.push(Box::new(status.clone()));
        }
    }

    if let Some(cat_id) = filters.category_id {
        query.push_str(" AND p.category_id = ?");
        params_vec.push(Box::new(cat_id));
    }

    if let Some(search) = &filters.search {
        if !search.trim().is_empty() {
            query.push_str(" AND (p.name LIKE ? OR p.barcode LIKE ?)");
            let like_term = format!("%{}%", search.trim());
            params_vec.push(Box::new(like_term.clone()));
            params_vec.push(Box::new(like_term));
        }
    }

    query.push_str(" ORDER BY p.created_at DESC");

    let mut stmt = conn
        .prepare(&query)
        .map_err(|e| format!("Failed to prepare products query: {}", e))?;

    // Convert Vec<Box<dyn ToSql>> to a slice of references
    let params_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec
        .iter()
        .map(|b| b.as_ref())
        .collect();

    let rows = stmt
        .query_map(rusqlite::params_from_iter(params_refs), |row| {
            let karat: u32 = row.get(5)?;
            let weight_gram: f64 = row.get(6)?;
            let fine_gold_gram = weight_gram * purity_ratio(karat);

            Ok(Product {
                id: row.get(0)?,
                barcode: row.get(1)?,
                name: row.get(2)?,
                category_id: row.get(3)?,
                category_code: row.get(4)?,
                karat,
                weight_gram,
                fine_gold_gram,
                status: row.get(7)?,
                notes: row.get(8)?,
                created_at: row.get(9)?,
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
pub async fn purchase_product(
    state: State<'_, DbState>,
    vault_date: String,
    product: NewProduct,
    pay_from_vault: bool,
    vault_price: Option<f64>,
    vault_asset: Option<String>,
) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    // 1. Verify vault exists and is open
    let vault_status: Option<String> = conn
        .query_row(
            "SELECT status FROM daily_vault WHERE date = ?",
            params![vault_date],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| format!("Failed to query vault: {}", e))?;

    let status = match vault_status {
        Some(s) => s,
        None => return Err(format!("{} tarihi için henüz bir kasa açılmamış.", vault_date)),
    };

    if status == "closed" {
        return Err("Kapalı kasaya ürün girişi yapılamaz.".to_string());
    }

    // Start transaction
    let tx = conn
        .transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    // 2. Determine barcode
    let barcode = match &product.barcode {
        Some(b) if !b.trim().is_empty() => b.trim().to_string(),
        _ => {
            // Auto generate based on product count
            let count: i64 = tx
                .query_row("SELECT COUNT(*) FROM products", [], |row| row.get(0))
                .map_err(|e| format!("Failed to count products for barcode: {}", e))?;
            format!("JW-{:06}", count + 1)
        }
    };

    // 3. Insert Product
    tx.execute(
        "INSERT INTO products (barcode, name, category_id, karat, weight_gram, status, notes) 
         VALUES (?, ?, ?, ?, ?, 'in_stock', ?)",
        params![
            barcode,
            product.name.trim(),
            product.category_id,
            product.karat,
            product.weight_gram,
            product.notes
        ],
    )
    .map_err(|e| format!("Ürün eklenirken veritabanı hatası (Barkod benzersiz olmalıdır): {}", e))?;

    let product_id: i64 = tx.last_insert_rowid();

    // 4. Create Inventory Transaction
    let fine_gold = product.weight_gram * purity_ratio(product.karat);
    tx.execute(
        "INSERT INTO inventory_transactions (product_id, vault_date, transaction_type, quantity, weight_gram, karat, fine_gold_gram, price_try, notes) 
         VALUES (?, ?, 'purchase', 1, ?, ?, ?, ?, ?)",
        params![
            product_id,
            vault_date,
            product.weight_gram,
            product.karat,
            fine_gold,
            vault_price,
            product.notes
        ],
    )
    .map_err(|e| format!("Envanter hareketi oluşturulurken hata: {}", e))?;

    // 5. Cash payment flow if toggled
    if pay_from_vault {
        let price = vault_price.ok_or("Ödeme miktarı boş bırakılamaz.")?;
        let asset = vault_asset.ok_or("Ödeme yapılacak kasa para birimi seçilmelidir.")?;

        if price <= 0.0 {
            return Err("Ödeme tutarı sıfırdan büyük olmalıdır.".to_string());
        }

        // Fetch rates for converting to fine gold
        let (usd_buy, eur_buy, gold_buy) = get_rates_for_date(&tx, &vault_date)?;

        let asset_fine_gold = match asset.as_str() {
            "FINE_GOLD" => price,
            "TRY" => price / gold_buy,
            "USD" => (price * usd_buy) / gold_buy,
            "EUR" => (price * eur_buy) / gold_buy,
            _ => return Err(format!("Geçersiz varlık türü: {}", asset)),
        };

        let description = format!("Ürün Alımı: {} (Barkod: {})", product.name.trim(), barcode);

        tx.execute(
            "INSERT INTO asset_entries (vault_date, asset_type, direction, amount, fine_gold_gram, description) 
             VALUES (?, ?, 'out', ?, ?, ?)",
            params![
                vault_date,
                asset,
                price,
                asset_fine_gold,
                description
            ],
        )
        .map_err(|e| format!("Kasa ödeme kaydı eklenirken hata: {}", e))?;
    }

    tx.commit()
        .map_err(|e| format!("Failed to commit product purchase transaction: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn sell_product(
    state: State<'_, DbState>,
    params: SaleParams,
) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    // 1. Verify vault is open
    let vault_status: Option<String> = conn
        .query_row(
            "SELECT status FROM daily_vault WHERE date = ?",
            params![params.vault_date],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| format!("Failed to query vault status: {}", e))?;

    let status = match vault_status {
        Some(s) => s,
        None => return Err(format!("{} tarihi için henüz bir kasa açılmamış.", params.vault_date)),
    };

    if status == "closed" {
        return Err("Kapalı kasaya ürün satışı yapılamaz.".to_string());
    }

    // Start transaction
    let tx = conn
        .transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    // 2. Retrieve product info and lock
    let product: Option<(String, u32, f64, String)> = tx
        .query_row(
            "SELECT name, karat, weight_gram, status FROM products WHERE id = ?",
            params![params.product_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .optional()
        .map_err(|e| format!("Ürün sorgulanamadı: {}", e))?;

    let (name, karat, weight_gram, prod_status) = match product {
        Some(p) => p,
        None => return Err("Ürün bulunamadı.".to_string()),
    };

    if prod_status != "in_stock" {
        return Err("Sadece stoktaki ürünler satılabilir.".to_string());
    }

    // 3. Update product status
    tx.execute(
        "UPDATE products SET status = 'sold', updated_at = datetime('now') WHERE id = ?",
        params![params.product_id],
    )
    .map_err(|e| format!("Ürün durumu güncellenemedi: {}", e))?;

    // 4. Create inventory transaction
    let fine_gold = weight_gram * purity_ratio(karat);
    tx.execute(
        "INSERT INTO inventory_transactions (product_id, vault_date, transaction_type, quantity, weight_gram, karat, fine_gold_gram, price_try, counterparty, notes) 
         VALUES (?, ?, 'sale', 1, ?, ?, ?, ?, ?, ?)",
        params![
            params.product_id,
            params.vault_date,
            weight_gram,
            karat,
            fine_gold,
            params.price,
            params.customer_name,
            params.notes
        ],
    )
    .map_err(|e| format!("Envanter satış hareketi yazılamadı: {}", e))?;

    // 5. Create cash entry in the vault
    if params.price <= 0.0 {
        return Err("Satış fiyatı sıfırdan büyük olmalıdır.".to_string());
    }

    // Retrieve rates
    let (usd_buy, eur_buy, gold_buy) = get_rates_for_date(&tx, &params.vault_date)?;

    let asset_fine_gold = match params.payment_asset.as_str() {
        "FINE_GOLD" => params.price,
        "TRY" => params.price / gold_buy,
        "USD" => (params.price * usd_buy) / gold_buy,
        "EUR" => (params.price * eur_buy) / gold_buy,
        _ => return Err(format!("Geçersiz ödeme varlığı: {}", params.payment_asset)),
    };

    let description = format!("Ürün Satışı: {} (Müşteri: {})", name, params.customer_name.clone().unwrap_or_else(|| "-".to_string()));

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
        .map_err(|e| format!("Failed to commit product sale: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn return_product(
    state: State<'_, DbState>,
    product_id: i64,
    vault_date: String,
    refund_amount: f64,
    refund_asset: String,
    notes: Option<String>,
) -> Result<(), String> {
    let mut conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    // 1. Verify vault is open
    let vault_status: Option<String> = conn
        .query_row(
            "SELECT status FROM daily_vault WHERE date = ?",
            params![vault_date],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| format!("Failed to query vault status: {}", e))?;

    let status = match vault_status {
        Some(s) => s,
        None => return Err(format!("{} tarihi için henüz bir kasa açılmamış.", vault_date)),
    };

    if status == "closed" {
        return Err("Kapalı kasada ürün iadesi alınamaz.".to_string());
    }

    // Start transaction
    let tx = conn
        .transaction()
        .map_err(|e| format!("Failed to start transaction: {}", e))?;

    // 2. Fetch product info
    let product: Option<(String, u32, f64, String)> = tx
        .query_row(
            "SELECT name, karat, weight_gram, status FROM products WHERE id = ?",
            params![product_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .optional()
        .map_err(|e| format!("Ürün sorgulanamadı: {}", e))?;

    let (name, karat, weight_gram, prod_status) = match product {
        Some(p) => p,
        None => return Err("Ürün bulunamadı.".to_string()),
    };

    if prod_status != "sold" {
        return Err("Sadece satılmış ürünler iade alınabilir.".to_string());
    }

    // 3. Update product status
    tx.execute(
        "UPDATE products SET status = 'returned', updated_at = datetime('now') WHERE id = ?",
        params![product_id],
    )
    .map_err(|e| format!("Ürün durumu güncellenemedi: {}", e))?;

    // 4. Create inventory transaction
    let fine_gold = weight_gram * purity_ratio(karat);
    tx.execute(
        "INSERT INTO inventory_transactions (product_id, vault_date, transaction_type, quantity, weight_gram, karat, fine_gold_gram, price_try, notes) 
         VALUES (?, ?, 'return', 1, ?, ?, ?, ?, ?)",
        params![
            product_id,
            vault_date,
            weight_gram,
            karat,
            fine_gold,
            refund_amount,
            notes
        ],
    )
    .map_err(|e| format!("Envanter iade hareketi yazılamadı: {}", e))?;

    // 5. Create refund out entry in the vault
    if refund_amount < 0.0 {
        return Err("İade tutarı sıfır veya pozitif olmalıdır.".to_string());
    }

    if refund_amount > 0.0 {
        // Retrieve rates
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
            params![
                vault_date,
                refund_asset,
                refund_amount,
                asset_fine_gold,
                description
            ],
        )
        .map_err(|e| format!("Kasa iade geri ödeme kaydı eklenirken hata: {}", e))?;
    }

    tx.commit()
        .map_err(|e| format!("Failed to commit product return: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_inventory_transactions(
    state: State<'_, DbState>,
    product_id: Option<i64>,
) -> Result<Vec<InventoryTransaction>, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    let mut query = String::from(
        "SELECT t.id, t.product_id, p.name, p.barcode, t.vault_date, t.transaction_type, t.quantity, t.weight_gram, t.karat, t.fine_gold_gram, t.price_try, t.counterparty, t.notes, t.created_at 
         FROM inventory_transactions t
         JOIN products p ON t.product_id = p.id"
    );

    let mut params_vec = Vec::new();
    if let Some(pid) = product_id {
        query.push_str(" WHERE t.product_id = ?");
        params_vec.push(pid);
    }

    query.push_str(" ORDER BY t.created_at DESC");

    let mut stmt = conn
        .prepare(&query)
        .map_err(|e| format!("Failed to prepare inventory transactions query: {}", e))?;

    let rows = stmt
        .query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
            Ok(InventoryTransaction {
                id: row.get(0)?,
                product_id: row.get(1)?,
                product_name: row.get(2)?,
                product_barcode: row.get(3)?,
                vault_date: row.get(4)?,
                transaction_type: row.get(5)?,
                quantity: row.get(6)?,
                weight_gram: row.get(7)?,
                karat: row.get(8)?,
                fine_gold_gram: row.get(9)?,
                price_try: row.get(10)?,
                counterparty: row.get(11)?,
                notes: row.get(12)?,
                created_at: row.get(13)?,
            })
        })
        .map_err(|e| format!("Failed to query inventory transactions: {}", e))?;

    let mut list = Vec::new();
    for row in rows {
        list.push(row.map_err(|e| format!("Failed to read inventory transaction row: {}", e))?);
    }

    Ok(list)
}
