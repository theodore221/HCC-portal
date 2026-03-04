---
description: Run a design review on a component or page
argument-hint: "[file-path-or-url] [optional-css-selector]"
---

Use the design-reviewer agent to conduct a UI/UX design review.

## Target
$ARGUMENTS

## Instructions
Follow the tiered review strategy defined in your system prompt.
ALWAYS start at Pass 1 (code-only) and only escalate if needed.

- If a file path is provided: start with Pass 1 (code review only).
  Escalate to Pass 2 (DOM snapshot) or Pass 3 (targeted screenshot)
  only if you find issues that need visual verification.
- If a URL is provided: start with Pass 2 (DOM snapshot via
  browser_snapshot). Only escalate to Pass 3 (targeted screenshot)
  if the snapshot reveals layout or visual concerns.
- If a CSS selector is also provided (e.g. "#booking-form" or
  ".card-component"), scope all browser actions to that element only.
- If the user says "full review" or "all breakpoints", use Pass 4.

For each issue, include the specific file and line number if applicable,
and a concrete code suggestion for the fix.
