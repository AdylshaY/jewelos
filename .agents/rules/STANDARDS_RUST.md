---
trigger: model_decision
description: Read this file when creating, modifying, refactoring, or reviewing Rust, Tauri commands, services, plugins, async operations, filesystem access, or backend logic.
---

# Backend Standards

Stack:

Rust
Tauri 2

## Error Handling

Never use:

unwrap()
expect()

Return:

Result<T, String>

instead.

## Async Rules

Heavy operations must be async.

Examples:

- Database queries
- Backup operations
- Update checks

## Tauri Commands

Commands should be:

- small
- focused
- testable

Business logic belongs in services.

Not inside commands.

## Plugin Readiness

Code should remain extractable.

Avoid hard-coding future modules.