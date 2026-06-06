CREATE TABLE products (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode       TEXT UNIQUE,
    name          TEXT NOT NULL,
    category_id   INTEGER NOT NULL REFERENCES product_categories(id),
    karat         INTEGER NOT NULL CHECK(karat IN (14, 18, 21, 22, 24)),
    weight_gram   REAL NOT NULL,
    status        TEXT NOT NULL DEFAULT 'in_stock' CHECK(status IN ('in_stock', 'sold', 'returned')),
    notes         TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category_id);
