---
description: "Run a code quality review on files, components, or the full codebase"
argument-hint: "[file-path-or-glob] [optional: full]"
---

Use the code-quality-reviewer agent to review code for smells, DRY violations,
complexity, naming, and maintainability issues.

## Target
$ARGUMENTS

## Instructions

If a file path is provided, review that file and its closely related files
(imports, tests, parent components).

If a glob pattern is provided (e.g. `src/app/bookings/**`), review all matching
files but prioritise the largest and most complex ones.

If no argument is given, review files changed since the last commit:
`git diff HEAD~1 --name-only -- '*.ts' '*.tsx'`

If `full` is specified, do a full codebase scan — map the structure, find the
largest files, grep for smell patterns, and sample representative components.

For each issue, include the file path and line number, what's wrong, why it
matters, and a concrete code fix.
