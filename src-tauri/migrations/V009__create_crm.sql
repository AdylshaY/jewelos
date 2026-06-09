-- V009: Add CRM tables and integrate with inventory transactions

-- 1. Create customers table
CREATE TABLE customers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    phone       TEXT,
    email       TEXT,
    address     TEXT,
    notes       TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_customers_active ON customers(is_active);

-- 2. Create customer_transactions table (Ledger entries)
CREATE TABLE customer_transactions (
    id                       INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id              INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vault_date               TEXT NOT NULL REFERENCES daily_vault(date),
    transaction_type         TEXT NOT NULL CHECK(transaction_type IN ('sale_debt', 'payment', 'deposit', 'withdrawal', 'adjustment')),
    direction                TEXT NOT NULL CHECK(direction IN ('debt', 'credit')),
    asset_type               TEXT NOT NULL CHECK(asset_type IN ('TRY', 'USD', 'EUR', 'FINE_GOLD')),
    amount                   REAL NOT NULL,
    fine_gold_gram           REAL NOT NULL,
    notes                    TEXT,
    inventory_transaction_id INTEGER REFERENCES inventory_transactions(id) ON DELETE SET NULL,
    created_at               TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_customer_tx_customer ON customer_transactions(customer_id);
CREATE INDEX idx_customer_tx_vault_date ON customer_transactions(vault_date);

-- 3. Add customer_id to inventory_transactions table
ALTER TABLE inventory_transactions ADD COLUMN customer_id INTEGER REFERENCES customers(id);
CREATE INDEX idx_inv_tx_customer ON inventory_transactions(customer_id);
