# Security Infrastructure

Comprehensive security utilities for protecting the HCC Portal from abuse, bots, and attacks.

## Overview

The security infrastructure implements **defense-in-depth** with multiple layers:

1. **Rate Limiting** - Prevents brute force and spam
2. **Honeypot Fields** - Detects automated bot submissions
3. **Time-based Validation** - Rejects submissions that are too fast
4. **CSRF Protection** - Prevents cross-site request forgery
5. **Token Security** - Secure generation, hashing, and validation

## Architecture

```
security/
├── rate-limit.ts    # Rate limiting (Upstash + in-memory)
├── honeypot.ts      # Bot detection via honeypot fields
├── csrf.ts          # CSRF token management
├── tokens.ts        # Secure token generation & validation
├── index.ts         # Public API exports
└── README.md        # This file
```

## Rate Limiting

### Configuration

Rate limits per endpoint (from spec):

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/enquiry` | 5 requests | 15 minutes |
| `/api/booking` | 3 requests | 15 minutes |
| `/api/pricing/calculate` | 20 requests | 1 minute |
| `/api/booking/custom/[token]` | 5 requests | 15 minutes |
| `/api/portal` | 10 requests | 1 minute |

### Usage

```ts
import { checkRateLimit } from '@/lib/security';

export async function POST(request: NextRequest) {
  const rateLimitResult = await checkRateLimit(request, 'enquiry');
  if (rateLimitResult) return rateLimitResult; // 429 response

  // Continue with handler
}
```

### Infrastructure

- **Production**: Uses Upstash Redis for distributed rate limiting
- **Development/Fallback**: In-memory Map-based rate limiting
- **Algorithm**: Sliding window with automatic cleanup

### Environment Variables

```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

If not configured, automatically falls back to in-memory.

## Bot Detection

### Honeypot Fields

Hidden form fields that bots auto-fill but legitimate users never see.

**Field Names** (randomize periodically):
- Enquiry form: `website_url`
- Booking form: `email_confirm`
- Contact form: `phone_backup`

**Implementation**:

```tsx
import { HoneypotField, HONEYPOT_FIELDS } from '@/lib/security';

// In form component
<form>
  <HoneypotField name={HONEYPOT_FIELDS.enquiry} />
  {/* Other fields */}
</form>
```

**Validation**:

```ts
import { validateBotDetection } from '@/lib/security';

const body = await request.json();
const botCheck = validateBotDetection(body, 'website_url');

if (!botCheck.valid) {
  return new Response('Invalid request', { status: 400 });
}
```

### Time-based Validation

Rejects submissions made in under 3 seconds (too fast for humans).

**Implementation**:

```tsx
import { generateTimeToken } from '@/lib/security';

// On page load
const timeToken = generateTimeToken();

<form>
  <input type="hidden" name="_form_time" value={timeToken} />
  {/* Other fields */}
</form>
```

**Validation** (automatic via `validateBotDetection`):

```ts
const botCheck = validateBotDetection(body, 'website_url', '_form_time');
```

## CSRF Protection

### Double-Submit Cookie Pattern

1. Generate token on page load
2. Store in httpOnly cookie
3. Include token in form/header
4. Validate on submission

**Server Component** (page load):

```tsx
import { getOrCreateCSRFToken, CSRFField } from '@/lib/security';

export default async function EnquiryPage() {
  const csrfToken = await getOrCreateCSRFToken();

  return (
    <form>
      <CSRFField token={csrfToken} />
      {/* Other fields */}
    </form>
  );
}
```

**API Route** (validation):

```ts
import { checkCSRF } from '@/lib/security';

export async function POST(request: Request) {
  const csrfResult = await checkCSRF(request);
  if (csrfResult) return csrfResult; // 403 response

  // Continue with handler
}
```

### Origin Validation

Additional protection - validates request origin matches host:

```ts
import { validateOrigin } from '@/lib/security';

if (!validateOrigin(request)) {
  return new Response('Invalid origin', { status: 403 });
}
```

## Token Security

### Custom Pricing Tokens

**Generation**:

```ts
import { generateCustomPricingToken, hashToken } from '@/lib/security';

const { token, hash, expires_at } = generateCustomPricingToken();

// Store hash in database (NOT the token)
await supabase.from('bookings').update({
  custom_pricing_token_hash: hash,
  custom_pricing_token_expires_at: expires_at,
});

// Send token to customer via email
const link = `${BASE_URL}/booking/custom/${token}`;
```

**Validation**:

```ts
import { validateCustomPricingToken } from '@/lib/security';

const result = validateCustomPricingToken(
  token,
  storedHash,
  expiresAt,
  bookingStatus
);

if (!result.valid) {
  return new Response(`Token ${result.reason}`, { status: 400 });
}
```

### Guest Access Tokens (OTP)

**Generation**:

```ts
import { generateGuestToken } from '@/lib/security';

const { token, hash } = generateGuestToken();

// Store hash in profiles.guest_token
await supabase.from('profiles').update({
  guest_token: hash,
});

// Send token to customer via email
const link = `${BASE_URL}/portal?token=${token}`;
```

**Validation**:

```ts
import { validateGuestToken } from '@/lib/security';

if (!validateGuestToken(token, storedHash)) {
  return new Response('Invalid token', { status: 401 });
}
```

## Complete API Route Example

```ts
import { NextRequest } from 'next/server';
import {
  checkRateLimit,
  validateBotDetection,
  checkCSRF,
} from '@/lib/security';

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const rateLimitResult = await checkRateLimit(request, 'enquiry');
  if (rateLimitResult) return rateLimitResult;

  // 2. Parse body
  const body = await request.json();

  // 3. Bot detection (honeypot + time)
  const botCheck = validateBotDetection(body, 'website_url');
  if (!botCheck.valid) {
    console.warn('Bot detected:', botCheck.reason);
    return new Response('Invalid request', { status: 400 });
  }

  // 4. CSRF protection
  const csrfResult = await checkCSRF(request);
  if (csrfResult) return csrfResult;

  // 5. Continue with business logic
  // ...
}
```

## Security Best Practices

### ✅ Do

- Always validate tokens server-side
- Use timing-safe comparison for token validation
- Store hashed tokens, never plaintext
- Rotate CSRF tokens after use
- Log security events (rate limit hits, bot detection)
- Use HTTPS in production
- Set httpOnly, secure, sameSite cookies

### ❌ Don't

- Don't perform pricing calculations client-side
- Don't skip rate limiting on "low-risk" endpoints
- Don't use predictable token generation
- Don't reveal security mechanisms in error messages
- Don't trust client-provided timestamps
- Don't reuse tokens across sessions

## Testing

### Rate Limiting

```bash
# Test rate limit
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/enquiry \
    -H "Content-Type: application/json" \
    -d '{"customer_email":"test@example.com"}'
done
# 6th request should return 429
```

### Bot Detection

```bash
# Trigger honeypot
curl -X POST http://localhost:3000/api/enquiry \
  -H "Content-Type: application/json" \
  -d '{"customer_email":"test@example.com","website_url":"https://spam.com"}'
# Should return 400
```

## Monitoring

Recommended logging for security events:

- Rate limit hits (IP, endpoint, timestamp)
- Bot detections (reason, IP, user-agent)
- CSRF failures (IP, origin, timestamp)
- Token validation failures (type, reason)

## Future Enhancements

- [ ] Progressive CAPTCHA (Cloudflare Turnstile)
- [ ] IP-based reputation scoring
- [ ] Anomaly detection (sudden traffic spikes)
- [ ] Distributed rate limiting with Redis Cluster
- [ ] Webhook for security events
- [ ] Admin dashboard for security metrics

## Support

For security issues or questions, refer to the main specification document or contact the development team.
