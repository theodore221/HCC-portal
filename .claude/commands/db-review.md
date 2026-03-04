---
description: "Review a database migration, schema change, or SQL query"
argument-hint: "[migration-file] [optional: full|security|performance]"
---

Use the supabase-reviewer agent to review database changes.

## Target
$ARGUMENTS

## Instructions

If a migration file path is provided, review that file. If no file is given, find
the most recent migrations with `ls -la infra/supabase/migration/ | tail -5` and
review those.

Depth flags:
- (default) — Pass 1 code review, escalate to Pass 2 if RLS or schema concerns
- `security` — Escalate to Pass 4 (full RLS + auth audit)
- `performance` — Escalate to Pass 3 (EXPLAIN ANALYSE, index review)
- `full` — Run all passes
