---
trigger: always_on
---

# JewelOS Architecture

## Vision

JewelOS is a modular jewelry business operating system.

The architecture must support future modules without affecting existing modules.

Examples:

- Inventory
- Daily Vault
- CRM
- HR
- Payroll
- Manufacturing
- Accounting

## Architectural Style

Feature-Based Modular Monolith

Structure:

src/
├── core/
├── features/
├── shared/

## Rules

### Feature Isolation

Features may not import code from another feature.

Allowed:

features/inventory
  -> core/

Forbidden:

features/inventory
  -> features/crm

### Shared Code

Reusable code belongs to:

src/core/

Never inside a feature.

### UI Communication

React must never:

- access filesystem
- access sqlite
- access OS APIs

All communication must happen through:

Tauri Invoke Commands

### Future Plugin System

Future modules may become Tauri plugins.

Current implementations must not prevent plugin extraction later.