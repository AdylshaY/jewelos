-- Migration: V010__add_category_to_asset_entries
-- Add category column to asset_entries table to track transaction groupings (fatura, kira, yemek, maas, etc.)

ALTER TABLE asset_entries ADD COLUMN category TEXT;
