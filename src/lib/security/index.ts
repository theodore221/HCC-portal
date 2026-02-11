/**
 * Security Infrastructure
 *
 * Centralized security utilities for protecting public-facing endpoints.
 *
 * Includes:
 * - Rate limiting (Upstash Redis + in-memory fallback)
 * - Honeypot field validation (bot detection)
 * - CSRF protection (double-submit cookie pattern)
 * - Token hashing & validation (custom pricing, guest access)
 *
 * Usage in API routes:
 * ```ts
 * import { checkRateLimit, validateBotDetection, checkCSRF } from '@/lib/security';
 *
 * export async function POST(request: NextRequest) {
 *   // Rate limiting
 *   const rateLimitResult = await checkRateLimit(request, 'enquiry');
 *   if (rateLimitResult) return rateLimitResult;
 *
 *   // Bot detection
 *   const body = await request.json();
 *   const botCheck = validateBotDetection(body, 'website_url');
 *   if (!botCheck.valid) {
 *     return new Response('Invalid request', { status: 400 });
 *   }
 *
 *   // CSRF protection
 *   const csrfResult = await checkCSRF(request);
 *   if (csrfResult) return csrfResult;
 *
 *   // Continue with logic
 * }
 * ```
 */

// Rate Limiting
export {
  rateLimit,
  checkRateLimit,
  getRateLimitInfo,
  RATE_LIMITS,
  type RateLimitConfig,
  type RateLimitResult,
} from './rate-limit';

// Honeypot & Bot Detection
export {
  validateHoneypot,
  validateHoneypotFromFormData,
  validateHoneypotFromJSON,
  validateSubmissionTime,
  validateBotDetection,
  generateTimeToken,
  generateHoneypotFieldHTML,
  handleBotDetection,
  HoneypotField,
  HONEYPOT_FIELDS,
} from './honeypot';

// CSRF Protection (Server Actions)
export {
  getCSRFToken,
  getOrCreateCSRFToken,
} from './csrf-actions';

// CSRF Protection (Utilities)
export {
  generateCSRFToken,
  validateCSRFToken,
  checkCSRF,
  generateCSRFField,
  validateOrigin,
  validateCSRFComplete,
} from './csrf';

// Token Utilities
export {
  generateSecureToken,
  hashToken,
  verifyToken,
  generateCustomPricingToken,
  generateGuestToken,
  validateCustomPricingToken,
  validateGuestToken,
  generateReference,
  generateOTP,
  hashPassword,
  verifyPassword,
  generateAPIKey,
  maskToken,
  getTokenMetadata,
  isValidTokenFormat,
  calculateTokenEntropy,
} from './tokens';
