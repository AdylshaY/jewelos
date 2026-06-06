---
trigger: always_on
---

# JewelOS Domain Rules

## Business Unit

The primary business unit is:

Fine Gold Gram (Has Altın)

Every financial value must eventually be convertible into Fine Gold Gram.

## Purity Conversion

24K = 1.000
22K = 0.916
21K = 0.875
18K = 0.750
14K = 0.585

Formula:

FineGoldGram =
Weight × PurityRatio

## Daily Vault

Each day has exactly one DailyVault record.

Primary Key:

YYYY-MM-DD

Example:

2026-06-06

## Assets

Supported asset types:

- TRY
- USD
- EUR
- Fine Gold Gram
- Jewelry Products

## Valuation

All assets must be convertible into Fine Gold Gram.

Reports and balances must always support Fine Gold Gram calculations.

## Inventory Philosophy

Inventory entries are immutable.

Corrections must generate adjustment records.

Never overwrite historical transactions.

## Future Modules

Not yet implemented:

- CRM
- HR
- Payroll
- Manufacturing
- Accounting

Do not generate code for these modules unless explicitly requested.