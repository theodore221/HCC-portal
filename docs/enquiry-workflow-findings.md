# Enquiry Workflow — Findings & Gap Analysis

Deep-dive findings from code review of the enquiry system. Captured 2026-02-25.

---

## 1. Status Pipeline

The enquiry `status` column uses a 6-value enum. Below is the full lifecycle:

```
new ──► under_review ──► quoted ──► ready_to_book ──► converted
                                                          │
                         any ──────────────────────────► closed
```

| Status | Meaning | Who sets it |
|--------|---------|-------------|
| `new` | Freshly submitted, not yet reviewed | System (on create) |
| `under_review` | Admin has opened and is reviewing | Admin action |
| `quoted` | A quote/price estimate has been communicated | Admin action |
| `ready_to_book` | Admin has deemed it ready; awaiting customer action | Admin action |
| `converted` | Customer has proceeded to a full booking | System (on conversion) |
| `closed` | Enquiry declined, expired, or withdrawn | Admin action |

### Transition Rules (current code — no enforcement)
- Any status can be set to any other status. There is no guard logic enforcing valid transitions.
- `converted` is set automatically when the admin uses the "Convert to Booking" flow.
- `closed` can be set from any state.

### User Decision: Remove `ready_to_book`
The `ready_to_book` status is to be **removed** from the pipeline. It adds ambiguity (is the customer notified? what triggers the booking link?) without clear value. Conversion is already handled by the admin directly triggering the magic link.

---

## 2. Quote Workflow Gaps

### Current State
- The `enquiry_quotes` table stores quote amounts and notes.
- Quote creation and editing is **admin-only** — no customer-facing view, PDF, or email.
- No "quote accepted" mechanism exists.

### Gaps
1. **No customer notification** — when a quote is created or updated, no email is sent.
2. **No customer-facing document** — customers cannot view their quote; they receive verbal/manual communication.
3. **No acceptance workflow** — the system has no way to record customer acceptance of a quoted price.
4. **Quote ↔ booking price link** — when converting an enquiry to a booking, the quoted price is not automatically carried into `booking_price_snapshots`.

### Recommended Future Work
- Send an email to `customer_email` when a quote is created/updated (use the Resend + React Email stack).
- Build a customer-facing quote view page (public URL with token).
- Add an "accepted" boolean + timestamp to `enquiry_quotes`.
- On conversion, check for an accepted quote and seed the booking price snapshot from it.

---

## 3. No Duplicate Detection

### Current State
The enquiry form accepts any `customer_email` with no deduplication check. A customer can submit multiple enquiries with the same email.

### Impact
- Admins manually reconcile duplicates.
- No "you already have an open enquiry" message shown to returning customers.

### Recommended Future Work
- Before inserting: check for an existing `new` or `under_review` enquiry with the same `customer_email`.
- If found: show a message ("You already have an open enquiry — reference #EQ-XXXX. Check your email for updates.").
- Optionally: link the new enquiry as a duplicate reference.

---

## 4. Security Gaps

### 4a. Rate Limiting — Defined but Unwired
`src/lib/security/rate-limit.ts` exports `RATE_LIMITS.enquiry` and `checkRateLimit()`.
The enquiry route handler (`src/app/(public)/enquiry/actions.ts` or API route) does **not** call `checkRateLimit()`.
An attacker can submit unlimited enquiries — flooding the admin inbox and potentially the Resend email quota.

**Fix**: Add `await checkRateLimit(request, 'enquiry')` at the top of the enquiry submission handler.

### 4b. CSRF Token — Not Validated
The enquiry form receives a CSRF token from the server via `getOrCreateCSRFToken()` and includes it as `_csrf` in the form submission. However, the server action does **not** call `validateCSRFToken()` or `checkCSRF()` to verify it.

**Fix**: Add CSRF validation in the submit action:
```ts
const csrfValid = await validateCSRFToken(rawData._csrf);
if (!csrfValid) return { success: false, error: 'Invalid request' };
```

### 4c. `submitted_from_ip` — Never Populated
The `enquiries` table has a `submitted_from_ip` column for audit purposes. It is never set — the insert always omits it.

**Fix**: Extract the IP from the request headers in the server action:
```ts
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
```

---

## 5. No Admin Notification on New Enquiry

### Current State
When a new enquiry is submitted:
- The customer receives a confirmation email (if `sendEnquiryConfirmationEmail` is wired).
- Admins receive **no notification**.

### Impact
Admins must manually check the admin portal for new enquiries. High-volume periods risk enquiries being missed.

### Recommended Future Work
- Send a notification email to a configured `ADMIN_NOTIFICATION_EMAIL` env var on each new enquiry.
- Or: integrate with a Slack/webhook notification.
- Consider adding a real-time badge to the admin sidebar using Supabase Realtime.

---

## 6. Missing `loading.tsx` for `/enquiry` Route

The `/enquiry` route group does not have a `loading.tsx` file. Per project conventions, every async route should have a loading skeleton with the HCC logo.

**Fix**: Create `src/app/(public)/enquiry/loading.tsx` with an HCC logo + skeleton.

---

## 7. Summary of Recommended Changes (Priority Order)

| Priority | Issue | Effort |
|----------|-------|--------|
| P1 | Wire up rate limiting on enquiry submission | Small |
| P1 | Validate CSRF token in enquiry action | Small |
| P2 | Populate `submitted_from_ip` | Small |
| P2 | Admin notification email on new enquiry | Medium |
| P2 | Remove `ready_to_book` status | Small (migration + UI update) |
| P2 | Add `loading.tsx` for `/enquiry` route | Small |
| P3 | Duplicate enquiry detection | Medium |
| P3 | Customer-facing quote view + email | Large |
| P3 | Quote acceptance workflow | Large |
| P4 | Quote → booking price snapshot link on conversion | Medium |
