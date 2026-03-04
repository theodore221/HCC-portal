---
description: "Generate a clean commit message from staged or recent changes"
argument-hint: "[optional: --all for unstaged too]"
---

Write a clean, conventional commit message for the current changes.

## Instructions

1. Check what's staged: `git diff --cached --stat`
2. If nothing is staged, check unstaged: `git diff --stat`
3. If `--all` is passed in the arguments, include all changes (staged + unstaged)
4. Read the actual diff: `git diff --cached` (or `git diff` if nothing staged)
5. Write ONE commit message following the rules below

## Commit Message Format

```
<type>(<scope>): <short summary>

<body — optional, only if the change is non-obvious>
```

### Type (pick ONE):
- `feat` — new feature or capability
- `fix` — bug fix
- `refactor` — code change that neither fixes a bug nor adds a feature
- `style` — formatting, whitespace, missing semicolons (no logic change)
- `docs` — documentation only
- `chore` — build config, dependencies, tooling
- `perf` — performance improvement
- `test` — adding or fixing tests

### Scope:
The area of the codebase affected. Use the most specific relevant scope:
- Component name: `BookingForm`, `PricingTable`
- Feature area: `bookings`, `auth`, `admin`, `pricing`
- Infrastructure: `db`, `rls`, `migration`, `config`
- If multiple areas, use the primary one

### Short summary rules:
- Lowercase, no period at the end
- Imperative mood ("add" not "added" or "adds")
- Under 50 characters ideally, 72 max
- Describe WHAT changed, not HOW

### Body rules (only when needed):
- Wrap at 72 characters
- Explain WHY the change was made if not obvious from the summary
- Skip the body for trivial changes (typo fixes, simple renames, formatting)

## Examples of GOOD commit messages:
- `feat(bookings): add date range validation to enquiry form`
- `fix(auth): handle expired OTP token gracefully`
- `refactor(pricing): extract rate calculation into shared utility`
- `chore(deps): bump next to 14.2.1`
- `docs(readme): update local dev setup instructions`

## Examples of BAD commit messages (never write these):
- `update files` — says nothing
- `fix bug` — which bug?
- `WIP` — not a real commit message
- `feat(bookings): Add new date range validation logic to the enquiry form component to ensure users cannot select past dates` — way too long
- `Fixed the thing that was broken in the booking form where dates weren't working right` — not imperative, too vague, no type

## Output

Print ONLY the commit message. No explanation, no alternatives, no preamble.
If the diff is large and covers multiple distinct concerns, note that it should
probably be split into separate commits — then write the message for the whole
thing anyway.
