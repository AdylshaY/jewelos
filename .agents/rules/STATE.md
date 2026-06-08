---
trigger: model_decision
description: Read this file when planning new features, understanding project progress, checking active milestones, or determining current implementation priorities.
---

# JewelOS Project State

## Current Phase

Phase 1

Foundation and Inventory Module

## Completed

- Architecture established
- AI context structure established
- Technology stack selected
- Setup Tauri 2
- Setup React
- Setup Tailwind CSS v4
- Setup SQLite (rusqlite + rusqlite_migration)
- Build Daily Vault backend & UI
- Build Inventory / Stock Management Module backend & UI
- Build Sales Reports Module backend & UI
- Build Database Backup & Restore feature under System Settings (Yedekleme ve Geri Yükleme)
- Build Light Mode (Açık Tema) support with localStorage persistence and Recharts adaptation

## Active Goals

1. Polish and optimize Phase 1 modules (Daily Vault, Inventory, Sales Reports)
2. Gather user feedback for UX/UI refinements

## Current Focus

Refinement and UI/UX optimization

## Forbidden Areas

The following modules are not active:

- CRM
- Payroll
- HR
- Manufacturing

Do not create code for them.

## Database Snapshot

Active schema tables (managed via SQLite migrations):
- `daily_vault` (tracks vault status per day)
- `exchange_rates` (tracks asset currency exchange rates per vault date)
- `asset_entries` (tracks vault cash/gold balances)
- `product_categories` (product category lookup)
- `products` (product definition templates)
- `stock_items` (physical inventory items with barcodes and weights)
- `inventory_transactions` (purchase, sale, return, adjustment, transfer transactions)