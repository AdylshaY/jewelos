CREATE TABLE daily_vault (
    date        TEXT PRIMARY KEY,
    status      TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed')),
    notes       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
