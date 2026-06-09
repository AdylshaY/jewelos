-- Migration: Create system_settings table
CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
