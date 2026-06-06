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
            get_daily_summary
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
