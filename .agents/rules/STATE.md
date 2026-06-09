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
- Build Daily Vault backend & UI (including reconciliation, asset swapping, and vault closure)
- Build Inventory / Stock Management Module backend & UI (with category lookup and stock tables)
- Build Sales Reports Module backend & UI
- Build Database Backup & Restore feature under System Settings (Yedekleme ve Geri Yükleme)
- Build Light Mode (Açık Tema) support with localStorage persistence and Recharts adaptation
- Build Secure Admin PIN Management (SHA-256 secure hashing, recovery key generation, verification, and reset)
- Build Onboarding Wizard for first-time application configuration
- Build Developer-only Database Reset feature (only enabled in debug assertions)
- Build Collapsible Sidebar navigation layout with localStorage state persistence
- Build dynamic Expense/Revenue transaction categorization (Kira, Fatura, Yemek, Maaş vb.)
- Restructure Sales Reports into "Raporlar & Analiz" with sub-tabs for Sales Analysis and Vault Gider/Gelir Analizi (Pie & Bar charts, detail tables)
- Fix database query column name mismatches in CRM feature
- Replace default Tauri app icons and browser favicon with a custom luxury JewelOS emblem

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

## Future Goals / Backlog

- **Offline Licensing & Copy Protection System (Modül Bazlı Çevrimdışı Lisanslama):**
  - Implement hardware node-locking in Rust backend (Anakart UUID + CPU ID).
  - Use asymmetric cryptography (Ed25519) to verify license signatures locally.
  - Store license key in `system_settings` table.
  - Support modular access flags (e.g. `kasa_defteri`, `stok_yonetimi`, `crm_musteri`) to dynamically enable/disable feature routes and Sidebar menus.
  - Add Activation/Licensing screen to settings.

## Database Snapshot

Active schema tables (managed via SQLite migrations):
- `daily_vault` (tracks vault status per day)
- `exchange_rates` (tracks asset currency exchange rates per vault date)
- `asset_entries` (tracks vault cash/gold balances and categories)
- `product_categories` (product category lookup)
- `products` (product definition templates)
- `stock_items` (physical inventory items with barcodes and weights)
- `inventory_transactions` (purchase, sale, return, adjustment, transfer transactions)
- `system_settings` (stores application configuration key-value settings, e.g., admin PIN hash, onboarding completion flag)