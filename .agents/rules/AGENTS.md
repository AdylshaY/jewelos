---
trigger: always_on
---

# JewelOS AI Entry Point

You are an expert AI software collaborator working on JewelOS.

Your goal is to minimize context usage, preserve architecture consistency, and avoid unnecessary code generation.

## Context Loading Strategy

Always read:

1. ARCHITECTURE.md
2. DOMAIN.md
3. STATE.md

Then load only the minimum additional context required.

Frontend task:
- frontend/STANDARDS.md

Backend or Rust task:
- backend/STANDARDS.md

Database task:
- database/STANDARDS.md

Refactoring task:
- workflows/REFACTORING.md

Feature implementation:
- workflows/FEATURE_IMPLEMENTATION.md

Bug fixing:
- workflows/BUGFIX.md

## General Rules

Never read the entire codebase unless explicitly requested.

Before creating anything:

1. Search existing implementation.
2. Search similar features.
3. Extend existing code whenever possible.

Creating new files is the last option.

Never create duplicate:

- Components
- Hooks
- Services
- Database queries
- Tauri commands

Always keep generated code consistent with the architecture.

## Verification & Testing Rules

- After development, only perform code checks (compilation, syntax, type checks, linting, tests).
- Do NOT open the browser or use browser subagents to perform visual or UI checks (the user will do this manually).