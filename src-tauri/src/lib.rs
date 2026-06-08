mod db;
mod features;

use std::sync::Mutex;

use db::DbState;
use tauri::Manager;
use features::daily_vault::{
    get_vault_status,
    get_last_exchange_rates,
    open_daily_vault,
    add_asset_transaction,
    close_daily_vault,
    get_daily_summary,
};
use features::inventory::{
    get_products,
    add_product,
    update_product,
    get_stock_items,
    purchase_stock,
    sell_stock_item,
    return_stock_item,
    get_categories,
    add_category,
    update_category,
    get_inventory_transactions,
    update_stock_item,
    delete_stock_item,
};
use features::sales_report::{
    get_sales_report,
};
use features::settings::{
    backup_database,
    restore_database,
};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()
                .map_err(|e| format!("Failed to resolve app data dir: {}", e))?;

            let conn = db::init_db(app_data_dir)?;

            app.manage(DbState {
                db: Mutex::new(conn),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_vault_status,
            get_last_exchange_rates,
            open_daily_vault,
            add_asset_transaction,
            close_daily_vault,
            get_daily_summary,
            get_products,
            add_product,
            update_product,
            get_stock_items,
            purchase_stock,
            sell_stock_item,
            return_stock_item,
            get_categories,
            add_category,
            update_category,
            get_inventory_transactions,
            get_sales_report,
            update_stock_item,
            delete_stock_item,
            backup_database,
            restore_database
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
