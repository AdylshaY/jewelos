CREATE TABLE exchange_rates (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    rate_date   TEXT NOT NULL,
    currency    TEXT NOT NULL CHECK(currency IN ('USD', 'EUR', 'GOLD_GRAM_TRY')),
    buy_rate    REAL NOT NULL,
    sell_rate   REAL NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(rate_date, currency)
);

CREATE INDEX idx_exchange_rates_date ON exchange_rates(rate_date);
