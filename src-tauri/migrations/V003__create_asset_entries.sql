CREATE TABLE asset_entries (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    vault_date      TEXT NOT NULL REFERENCES daily_vault(date),
    asset_type      TEXT NOT NULL CHECK(asset_type IN ('TRY', 'USD', 'EUR', 'FINE_GOLD', 'PRODUCT')),
    direction       TEXT NOT NULL CHECK(direction IN ('in', 'out')),
    amount          REAL NOT NULL,
    fine_gold_gram  REAL NOT NULL,
    description     TEXT,
    reference_id    TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_asset_entries_vault_date ON asset_entries(vault_date);
CREATE INDEX idx_asset_entries_asset_type ON asset_entries(asset_type);
