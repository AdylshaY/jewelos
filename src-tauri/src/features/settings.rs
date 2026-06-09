use std::fs;
use tauri::{AppHandle, State, Manager};
use rusqlite::Connection;
use crate::db::DbState;
use rfd::FileDialog;

#[tauri::command]
pub async fn backup_database(
    state: State<'_, DbState>,
    app_handle: AppHandle,
) -> Result<String, String> {
    // 1. Resolve backup destination using native file dialog on the main thread
    let (tx, rx) = std::sync::mpsc::channel();
    app_handle.run_on_main_thread(move || {
        let file_path = FileDialog::new()
            .set_title("Yedek Dosyasını Kaydet")
            .set_file_name("jewelos_backup.db")
            .add_filter("SQLite Database", &["db", "sqlite"])
            .save_file();
        let _ = tx.send(file_path);
    }).map_err(|e| format!("Main thread dispatch error: {}", e))?;

    let file_path = rx.recv().map_err(|e| format!("Channel receive error: {}", e))?;

    let dest_path = match file_path {
        Some(path) => path,
        None => return Err("Backup cancelled".to_string()),
    };

    // 2. Lock the database connection
    let conn = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;

    // 3. Perform the SQLite online backup
    conn.backup(rusqlite::DatabaseName::Main, &dest_path, None)
        .map_err(|e| format!("Backup execution failed: {}", e))?;

    Ok(dest_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn restore_database(
    state: State<'_, DbState>,
    app_handle: AppHandle,
) -> Result<String, String> {
    // 1. Resolve backup file using native file dialog on the main thread
    let (tx, rx) = std::sync::mpsc::channel();
    let app_handle_clone = app_handle.clone();
    app_handle.run_on_main_thread(move || {
        let file_path = FileDialog::new()
            .set_title("Yedek Dosyasını Seç")
            .add_filter("SQLite Database", &["db", "sqlite"])
            .pick_file();
        let _ = tx.send(file_path);
    }).map_err(|e| format!("Main thread dispatch error: {}", e))?;

    let file_path = rx.recv().map_err(|e| format!("Channel receive error: {}", e))?;

    let src_path = match file_path {
        Some(path) => path,
        None => return Err("Restore cancelled".to_string()),
    };

    // 2. Get database path and WAL/SHM file paths
    let app_data_dir = app_handle_clone.path().app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;
    let db_path = app_data_dir.join("jewelos.db");
    let wal_path = app_data_dir.join("jewelos.db-wal");
    let shm_path = app_data_dir.join("jewelos.db-shm");

    // 3. Lock the database and swap connection with an in-memory connection
    // to close the active file handles to jewelos.db
    {
        let mut conn_guard = state.db.lock().map_err(|e| format!("Database lock error: {}", e))?;
        
        let temp_conn = Connection::open_in_memory()
            .map_err(|e| format!("Failed to create temporary database: {}", e))?;
        
        let old_conn = std::mem::replace(&mut *conn_guard, temp_conn);
        drop(old_conn); // This drops the active connection, closing all file descriptors to jewelos.db

        // 4. Delete existing DB files to prevent WAL file conflicts and state inconsistency
        let _ = fs::remove_file(&db_path);
        let _ = fs::remove_file(&wal_path);
        let _ = fs::remove_file(&shm_path);

        // 5. Copy restore file to destination
        fs::copy(&src_path, &db_path)
            .map_err(|e| format!("Failed to copy backup file to destination: {}", e))?;

        // 6. Reinitialize connection (which runs migrations and enables WAL mode)
        let new_conn = crate::db::init_db(app_data_dir)?;

        // 7. Swap the initialized connection back
        let temp_conn_dropped = std::mem::replace(&mut *conn_guard, new_conn);
        drop(temp_conn_dropped);
    }

    Ok(src_path.to_string_lossy().to_string())
}

// --- Admin PIN Management & Settings Helpers ---

use sha2::{Sha256, Digest};

fn hash_pin(pin: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(pin.as_bytes());
    let result = hasher.finalize();
    format!("{:x}", result)
}

fn get_setting(conn: &Connection, key: &str) -> Result<Option<String>, String> {
    let mut stmt = conn
        .prepare("SELECT value FROM system_settings WHERE key = ?1")
        .map_err(|e| format!("Ayarlar sorgulanamadı: {}", e))?;
    let mut rows = stmt
        .query(rusqlite::params![key])
        .map_err(|e| format!("Ayar sorgu hatası: {}", e))?;
    
    if let Some(row) = rows.next().map_err(|e| format!("Ayar satırı alınamadı: {}", e))? {
        let value: String = row.get(0).map_err(|e| format!("Ayar değeri okunamadı: {}", e))?;
        Ok(Some(value))
    } else {
        Ok(None)
    }
}

fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    conn.execute(
        "INSERT OR REPLACE INTO system_settings (key, value) VALUES (?1, ?2)",
        rusqlite::params![key, value],
    )
    .map_err(|e| format!("Ayar kaydedilemedi: {}", e))?;
    Ok(())
}

fn delete_setting(conn: &Connection, key: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM system_settings WHERE key = ?1",
        rusqlite::params![key],
    )
    .map_err(|e| format!("Ayar silinemedi: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn is_admin_pin_set(state: State<'_, DbState>) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|e| format!("Veritabanı kilit hatası: {}", e))?;
    let pin_opt = get_setting(&conn, "admin_pin")?;
    Ok(pin_opt.is_some())
}

#[tauri::command]
pub async fn set_admin_pin(
    state: State<'_, DbState>,
    current_pin: Option<String>,
    new_pin: String,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Veritabanı kilit hatası: {}", e))?;
    
    let existing_pin_opt = get_setting(&conn, "admin_pin")?;
    if let Some(existing_hash) = existing_pin_opt {
        let current = current_pin.ok_or_else(|| "Mevcut PIN kodu girilmelidir.".to_string())?;
        let current_hash = hash_pin(&current);
        if current_hash != existing_hash {
            return Err("Mevcut yönetici PIN kodu hatalı.".to_string());
        }
    }
    
    if new_pin.trim().len() < 4 {
        return Err("Yeni PIN kodu en az 4 karakter olmalıdır.".to_string());
    }
    let new_hash = hash_pin(&new_pin);
    set_setting(&conn, "admin_pin", &new_hash)?;
    
    Ok(())
}

#[tauri::command]
pub async fn verify_admin_pin(state: State<'_, DbState>, pin: String) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|e| format!("Veritabanı kilit hatası: {}", e))?;
    let existing_pin_opt = get_setting(&conn, "admin_pin")?;
    
    match existing_pin_opt {
        Some(existing_hash) => {
            let input_hash = hash_pin(&pin);
            Ok(input_hash == existing_hash)
        }
        None => {
            Ok(true)
        }
    }
}

#[tauri::command]
pub async fn remove_admin_pin(state: State<'_, DbState>, current_pin: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| format!("Veritabanı kilit hatası: {}", e))?;
    let existing_pin_opt = get_setting(&conn, "admin_pin")?;
    
    if let Some(existing_hash) = existing_pin_opt {
        let current_hash = hash_pin(&current_pin);
        if current_hash != existing_hash {
            return Err("Mevcut yönetici PIN kodu hatalı.".to_string());
        }
        delete_setting(&conn, "admin_pin")?;
        Ok(())
    } else {
        Err("Sistemde zaten kayıtlı bir PIN kodu bulunmamaktadır.".to_string())
    }
}
