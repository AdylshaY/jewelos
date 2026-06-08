-- V007: Restructure inventory to Product Catalog + Stock Items model
-- Phase 1 has no production data, so we drop and recreate.

-- 1. Drop old tables (FK order matters)
DROP TABLE IF EXISTS inventory_transactions;
DROP TABLE IF EXISTS products;

-- 2. Product Catalog (template/definition)
CREATE TABLE products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES product_categories(id),
    karat       INTEGER NOT NULL CHECK(karat IN (14, 18, 21, 22, 24)),
    description TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);

-- 3. Stock Items (individual physical pieces)
CREATE TABLE stock_items (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id     INTEGER NOT NULL REFERENCES products(id),
    barcode        TEXT UNIQUE,
    weight_gram    REAL NOT NULL,
    fine_gold_gram REAL NOT NULL,
    status         TEXT NOT NULL DEFAULT 'in_stock'
                   CHECK(status IN ('in_stock', 'sold', 'returned')),
    notes          TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_stock_items_product ON stock_items(product_id);
CREATE INDEX idx_stock_items_barcode ON stock_items(barcode);
CREATE INDEX idx_stock_items_status ON stock_items(status);

-- 4. Inventory Transactions (now references stock_items)
CREATE TABLE inventory_transactions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_item_id    INTEGER NOT NULL REFERENCES stock_items(id),
    vault_date       TEXT NOT NULL REFERENCES daily_vault(date),
    transaction_type TEXT NOT NULL
                     CHECK(transaction_type IN ('purchase', 'sale', 'return', 'adjustment', 'transfer')),
    quantity         INTEGER NOT NULL DEFAULT 1,
    weight_gram      REAL NOT NULL,
    karat            INTEGER NOT NULL,
    fine_gold_gram   REAL NOT NULL,
    price_try        REAL,
    payment_asset    TEXT CHECK(payment_asset IN ('TRY', 'USD', 'EUR', 'FINE_GOLD')),
    counterparty     TEXT,
    notes            TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_inv_tx_stock_item ON inventory_transactions(stock_item_id);
CREATE INDEX idx_inv_tx_vault_date ON inventory_transactions(vault_date);
CREATE INDEX idx_inv_tx_type ON inventory_transactions(transaction_type);
