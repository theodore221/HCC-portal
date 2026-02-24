Run a tiered QA check on the current changes. Go through each tier in order and stop early if blocking issues are found.

## Tier 1 — Static Analysis (cheap, always run)

1. Run `npx tsc --noEmit` to check for TypeScript errors
2. Run `npm run lint` to check for linting issues
3. Report any errors found. If there are blocking type errors, stop here and fix them.

## Tier 2 — Unit Tests (cheap, always run)

4. Run `npm run test` to run Vitest tests
5. Report pass/fail results. If tests fail, stop here and investigate.

## Tier 3 — Browser Verification (token-expensive, only for UI changes)

Only proceed to this tier if:
- The changes involve UI components, pages, or styling
- Tiers 1 and 2 both passed
- The dev server is running (check with `lsof -i :3000` first, start with `npm run dev` if needed)

6. Use `/chrome` to open the affected page on localhost:3000
7. Use `read_page` to get element refs from the accessibility tree — **do NOT screenshot**
8. Verify:
   - The changed component renders correctly
   - Interactive elements (buttons, links, form inputs) are accessible and have proper refs
   - No console errors in the browser
9. If the change is a form or interactive flow, use `find` to locate key elements and interact using `ref` (not coordinates)

## Report

Summarise results:
- **Tier 1**: ✅/❌ TypeScript errors? Lint issues?
- **Tier 2**: ✅/❌ Tests passed? Which failed?
- **Tier 3**: ✅/❌/⏭️ (skipped if not UI) Browser render OK? Accessibility concerns?
