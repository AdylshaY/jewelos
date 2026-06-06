---
trigger: model_decision
description: Read this file when creating, modifying, refactoring, or reviewing React, TypeScript, Tailwind, hooks, components, forms, tables, dialogs, or frontend state management.
---

# Frontend Standards

Stack:

React
TypeScript
Tailwind

## Component Rules

Maximum:

250 lines per component

Split large views into:

- tables
- forms
- dialogs
- cards

## Business Logic

Never place calculations inside UI components.

Move calculations to:

hooks/

Examples:

- Gold conversion
- Currency conversion
- Valuation logic

## State Management

Feature-scoped state only.

Global state may contain:

- Settings
- Theme
- Plugin configuration

Nothing else.

## UI Goals

Fast scanning.

Jewelry store operators should identify:

- vault balance
- gold balance
- cash balance

within seconds.

## Reuse First

Before creating:

- component
- hook
- modal

Search existing implementations.