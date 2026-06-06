CREATE TABLE product_categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT NOT NULL UNIQUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO product_categories (code, sort_order) VALUES
    ('ring', 1),
    ('necklace', 2),
    ('bracelet', 3),
    ('earring', 4),
    ('other', 5);
