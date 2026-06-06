CREATE TABLE inventory_transactions (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id        INTEGER NOT NULL REFERENCES products(id),
    vault_date        TEXT NOT NULL REFERENCES daily_vault(date),
    transaction_type  TEXT NOT NULL CHECK(transaction_type IN ('purchase', 'sale', 'return', 'adjustment', 'transfer')),
    quantity          INTEGER NOT NULL DEFAULT 1,
    weight_gram       REAL NOT NULL,
    karat             INTEGER NOT NULL,
    fine_gold_gram    REAL NOT NULL,
    price_try         REAL,
    counterparty      TEXT,
    notes             TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_inv_tx_product ON inventory_transactions(product_id);
CREATE INDEX idx_inv_tx_vault_date ON inventory_transactions(vault_date);
CREATE INDEX idx_inv_tx_type ON inventory_transactions(transaction_type);
