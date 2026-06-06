---
trigger: model_decision
description: Read this file when working with SQLite, migrations, schema design, queries, backups, restores, database connections, or persistence logic.
---

# Database Standards

Engine:

SQLite

## Location

Windows:

AppData/Roaming/JewelOS/jewelos.db

macOS:

Application Support/JewelOS/jewelos.db

## Integrity

Daily entries must belong to DailyVault.

Never create orphan records.

## Migrations

Before schema change:

1. Create migration
2. Explain migration
3. Explain rollback

Never modify schema directly.

## Safety

Connections must be short-lived.

Avoid long database locks.

## Backup Restore

Restore flow:

1. Close connections
2. Replace database file
3. Relaunch application