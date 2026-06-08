use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::DbState;

// ==========================================
// Structs
// ==========================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesReportEntry {
    pub sale_date: String,
    pub product_name: String,
    pub barcode: String,
    pub category_code: String,
    pub karat: u32,
    pub weight_gram: f64,
    pub fine_gold_gram: f64,
    pub price_try: f64,
    pub payment_asset: Option<String>,
    pub counterparty: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthlySalesSummary {
    pub month: String,
    pub count: i64,
    pub total_fine_gold: f64,
    pub total_price_try: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategorySalesSummary {
    pub category_code: String,
    pub count: i64,
    pub total_fine_gold: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesReport {
    pub entries: Vec<SalesReportEntry>,
    pub monthly: Vec<MonthlySalesSummary>,
    pub by_category: Vec<CategorySalesSummary>,
    pub total_count: i64,
    pub total_fine_gold: f64,
    pub total_price_try: f64,
}

// ==========================================
// Tauri Commands
// ==========================================

#[tauri::command]
pub async fn get_sales_report(
    state: State<'_, DbState>,
    date_from: Option<String>,
    date_to: Option<String>,
) -> Result<SalesReport, String> {
    let conn = state.db.lock().map_err(|e| format!("Lock error: {}", e))?;

    // Build WHERE clause for date filtering
    let mut where_clauses = vec!["t.transaction_type = 'sale'".to_string()];
    let mut param_values: Vec<String> = Vec::new();

    if let Some(ref from) = date_from {
        if !from.trim().is_empty() {
            where_clauses.push(format!("t.vault_date >= ?{}", param_values.len() + 1));
            param_values.push(from.clone());
        }
    }
    if let Some(ref to) = date_to {
        if !to.trim().is_empty() {
            where_clauses.push(format!("t.vault_date <= ?{}", param_values.len() + 1));
            param_values.push(to.clone());
        }
    }

    let where_sql = where_clauses.join(" AND ");

    // 1. Fetch sale entries
    let entries_sql = format!(
        "SELECT t.vault_date, p.name, s.barcode, c.code, p.karat, t.weight_gram, t.fine_gold_gram, COALESCE(t.price_try, 0), t.payment_asset, t.counterparty
         FROM inventory_transactions t
         JOIN stock_items s ON t.stock_item_id = s.id
         JOIN products p ON s.product_id = p.id
         JOIN product_categories c ON p.category_id = c.id
         WHERE {}
         ORDER BY t.vault_date DESC, t.created_at DESC",
        where_sql
    );

    let mut entries = Vec::new();
    {
        let mut stmt = conn
            .prepare(&entries_sql)
            .map_err(|e| format!("Failed to prepare sales entries query: {}", e))?;

        let params_refs: Vec<&dyn rusqlite::types::ToSql> = param_values
            .iter()
            .map(|s| s as &dyn rusqlite::types::ToSql)
            .collect();

        let rows = stmt
            .query_map(rusqlite::params_from_iter(params_refs), |row| {
                Ok(SalesReportEntry {
                    sale_date: row.get(0)?,
                    product_name: row.get(1)?,
                    barcode: row.get(2)?,
                    category_code: row.get(3)?,
                    karat: row.get(4)?,
                    weight_gram: row.get(5)?,
                    fine_gold_gram: row.get(6)?,
                    price_try: row.get(7)?,
                    payment_asset: row.get(8)?,
                    counterparty: row.get(9)?,
                })
            })
            .map_err(|e| format!("Failed to query sales entries: {}", e))?;

        for row in rows {
            entries.push(row.map_err(|e| format!("Failed to read sales entry: {}", e))?);
        }
    }

    // 2. Monthly summary
    let monthly_sql = format!(
        "SELECT strftime('%Y-%m', t.vault_date) as month, COUNT(*), SUM(t.fine_gold_gram), SUM(COALESCE(t.price_try, 0))
         FROM inventory_transactions t
         WHERE {}
         GROUP BY month
         ORDER BY month ASC",
        where_sql
    );

    let mut monthly = Vec::new();
    {
        let mut stmt = conn
            .prepare(&monthly_sql)
            .map_err(|e| format!("Failed to prepare monthly summary query: {}", e))?;

        let params_refs: Vec<&dyn rusqlite::types::ToSql> = param_values
            .iter()
            .map(|s| s as &dyn rusqlite::types::ToSql)
            .collect();

        let rows = stmt
            .query_map(rusqlite::params_from_iter(params_refs), |row| {
                Ok(MonthlySalesSummary {
                    month: row.get(0)?,
                    count: row.get(1)?,
                    total_fine_gold: row.get(2)?,
                    total_price_try: row.get(3)?,
                })
            })
            .map_err(|e| format!("Failed to query monthly summary: {}", e))?;

        for row in rows {
            monthly.push(row.map_err(|e| format!("Failed to read monthly summary: {}", e))?);
        }
    }

    // 3. Category summary
    let category_sql = format!(
        "SELECT c.code, COUNT(*), SUM(t.fine_gold_gram)
         FROM inventory_transactions t
         JOIN stock_items s ON t.stock_item_id = s.id
         JOIN products p ON s.product_id = p.id
         JOIN product_categories c ON p.category_id = c.id
         WHERE {}
         GROUP BY c.code
         ORDER BY COUNT(*) DESC",
        where_sql
    );

    let mut by_category = Vec::new();
    {
        let mut stmt = conn
            .prepare(&category_sql)
            .map_err(|e| format!("Failed to prepare category summary query: {}", e))?;

        let params_refs: Vec<&dyn rusqlite::types::ToSql> = param_values
            .iter()
            .map(|s| s as &dyn rusqlite::types::ToSql)
            .collect();

        let rows = stmt
            .query_map(rusqlite::params_from_iter(params_refs), |row| {
                Ok(CategorySalesSummary {
                    category_code: row.get(0)?,
                    count: row.get(1)?,
                    total_fine_gold: row.get(2)?,
                })
            })
            .map_err(|e| format!("Failed to query category summary: {}", e))?;

        for row in rows {
            by_category.push(row.map_err(|e| format!("Failed to read category summary: {}", e))?);
        }
    }

    // 4. Totals
    let total_count = entries.len() as i64;
    let total_fine_gold: f64 = entries.iter().map(|e| e.fine_gold_gram).sum();
    let total_price_try: f64 = entries.iter().map(|e| e.price_try).sum();

    Ok(SalesReport {
        entries,
        monthly,
        by_category,
        total_count,
        total_fine_gold,
        total_price_try,
    })
}
