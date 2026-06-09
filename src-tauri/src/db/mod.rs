use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use rusqlite::Connection;
use rusqlite_migration::{Migrations, M};

/// Managed database state shared across Tauri commands.
pub struct DbState {
    #[allow(dead_code)]
    pub db: Mutex<Connection>,
}

/// All migration steps, embedded at compile time.
/// Each M::up() corresponds to a migration SQL file.
const MIGRATIONS: [M<'static>; 9] = [
    M::up(include_str!("../../migrations/V001__create_daily_vault.sql")),
    M::up(include_str!("../../migrations/V002__create_exchange_rates.sql")),
    M::up(include_str!("../../migrations/V003__create_asset_entries.sql")),
    M::up(include_str!("../../migrations/V004__create_product_categories.sql")),
    M::up(include_str!("../../migrations/V005__create_products.sql")),
    M::up(include_str!("../../migrations/V006__create_inventory_transactions.sql")),
    M::up(include_str!("../../migrations/V007__restructure_inventory.sql")),
    M::up(include_str!("../../migrations/V008__create_system_settings.sql")),
    M::up(include_str!("../../migrations/V009__create_crm.sql")),
];

/// Initialize the SQLite database.
///
/// - Creates the app data directory if it doesn't exist
/// - Opens (or creates) `jewelos.db`
/// - Enables WAL mode for better concurrent read performance
/// - Enables foreign key enforcement
/// - Runs all pending migrations
pub fn init_db(app_data_dir: PathBuf) -> Result<Connection, String> {
    // Ensure the app data directory exists
    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;

    let db_path = app_data_dir.join("jewelos.db");

    let mut conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Enable WAL mode for better performance
    conn.pragma_update(None, "journal_mode", "WAL")
        .map_err(|e| format!("Failed to set WAL mode: {}", e))?;

    // Enable foreign key enforcement
    conn.pragma_update(None, "foreign_keys", "ON")
        .map_err(|e| format!("Failed to enable foreign keys: {}", e))?;

    // Run pending migrations
    let migrations = Migrations::new(MIGRATIONS.to_vec());
    migrations.to_latest(&mut conn)
        .map_err(|e| format!("Failed to run migrations: {}", e))?;

    println!("Database initialized at: {:?}", db_path);

    Ok(conn)
}
