---
trigger: model_decision
description: Read this file when investigating errors, crashes, unexpected behavior, failing tests, regressions, or production issues.
---

# Bug Fix Workflow

Before fixing:

1. Reproduce bug
2. Find root cause
3. Explain root cause
4. Implement minimal fix

Avoid large rewrites.

Prefer surgical fixes.

## Verification

Only perform code checks (compilation, tests, lint). Do NOT perform browser/UI checks manually or with browser subagents.