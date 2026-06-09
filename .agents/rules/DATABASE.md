---
trigger: model_decision
description: Read this file when working with SQLite, migrations, schema design, queries, backups, restores, database connections, or persistence logic.
---

# Database Standards

Engine:

SQLite

## Location

Windows:

AppData/Roaming/JewelOS/jewelos.db

macOS:

Application Support/JewelOS/jewelos.db

## Integrity

Daily entries must belong to DailyVault.

Never create orphan records.

## Migrations

Before schema change:

1. Create migration
2. Explain migration
3. Explain rollback

Never modify schema directly.

## Safety

Connections must be short-lived.

Avoid long database locks.

## Backup Restore

Restore flow:

1. Lock the active connection Mutex.
2. Swap the active connection with a temporary in-memory connection (closes all file descriptors to `jewelos.db`).
3. Delete active DB files (`jewelos.db`, WAL, and SHM) and copy/replace the database file with the backup.
4. Reopen the database connection (running all pending migrations automatically via `init_db`).
5. Swap the new connection back and reload the frontend (`window.location.reload()`) to refresh React state.

## Database Schema Snapshot

### `daily_vault`
* `date` (TEXT, PK) - YYYY-MM-DD
* `status` (TEXT) - 'open' | 'closed'
* `notes` (TEXT)
* `created_at` (TEXT)
* `updated_at` (TEXT)

### `exchange_rates`
* `id` (INTEGER, PK AUTOINCREMENT)
* `rate_date` (TEXT)
* `currency` (TEXT) - 'USD' | 'EUR' | 'GOLD_GRAM_TRY'
* `buy_rate` (REAL)
* `sell_rate` (REAL)
* `created_at` (TEXT)
* `updated_at` (TEXT)
* *Unique Constraint:* (`rate_date`, `currency`)

### `asset_entries`
* `id` (INTEGER, PK AUTOINCREMENT)
* `vault_date` (TEXT, FK -> `daily_vault(date)`)
* `asset_type` (TEXT) - 'TRY' | 'USD' | 'EUR' | 'FINE_GOLD' | 'PRODUCT'
* `direction` (TEXT) - 'in' | 'out'
* `amount` (REAL)
* `fine_gold_gram` (REAL)
* `description` (TEXT)
* `reference_id` (TEXT)
* `created_at` (TEXT)

### `product_categories`
* `id` (INTEGER, PK AUTOINCREMENT)
* `code` (TEXT, UNIQUE) - e.g., 'ring', 'necklace', 'bracelet', 'earring', 'other'
* `sort_order` (INTEGER)
* `is_active` (INTEGER) - 0 | 1
* `created_at` (TEXT)

### `products`
* `id` (INTEGER, PK AUTOINCREMENT)
* `name` (TEXT)
* `category_id` (INTEGER, FK -> `product_categories(id)`)
* `karat` (INTEGER) - 14 | 18 | 21 | 22 | 24
* `description` (TEXT)
* `is_active` (INTEGER) - 0 | 1
* `created_at` (TEXT)
* `updated_at` (TEXT)

### `stock_items`
* `id` (INTEGER, PK AUTOINCREMENT)
* `product_id` (INTEGER, FK -> `products(id)`)
* `barcode` (TEXT, UNIQUE)
* `weight_gram` (REAL)
* `fine_gold_gram` (REAL)
* `status` (TEXT) - 'in_stock' | 'sold' | 'returned'
* `notes` (TEXT)
* `created_at` (TEXT)
* `updated_at` (TEXT)

### `inventory_transactions`
* `id` (INTEGER, PK AUTOINCREMENT)
* `stock_item_id` (INTEGER, FK -> `stock_items(id)`)
* `vault_date` (TEXT, FK -> `daily_vault(date)`)
* `transaction_type` (TEXT) - 'purchase' | 'sale' | 'return' | 'adjustment' | 'transfer'
* `quantity` (INTEGER) - default 1
* `weight_gram` (REAL)
* `karat` (INTEGER)
* `fine_gold_gram` (REAL)
* `price_try` (REAL)
* `payment_asset` (TEXT) - 'TRY' | 'USD' | 'EUR' | 'FINE_GOLD'
* `counterparty` (TEXT)
* `notes` (TEXT)
* `created_at` (TEXT)

### `system_settings`
* `key` (TEXT, PK)
* `value` (TEXT)