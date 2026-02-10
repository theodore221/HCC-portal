/**
 * CSRF Protection Utilities
 *
 * Implements double-submit cookie pattern for CSRF protection.
 * Next.js server actions have built-in CSRF protection via Origin header checking,
 * but this provides additional protection for custom API routes.
 *
 * Pattern:
 * 1. Generate token on page load
 * 2. Store in httpOnly cookie
 * 3. Include token in form as hidden field or header
 * 4. Validate on submission that cookie and form token match
 */

import { cookies } from 'next/headers';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token
 *
 * @returns Random token (URL-safe base64)
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('base64url');
}

/**
 * Set CSRF token in cookie (server-side)
 *
 * Call this when rendering a page with a form
 *
 * @returns The generated token
 */
export async function setCSRFToken(): Promise<string> {
  const token = generateCSRFToken();
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });

  return token;
}

/**
 * Get CSRF token from cookies (server-side)
 *
 * @returns Token or null if not found
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CSRF_COOKIE_NAME);
  return token?.value || null;
}

/**
 * Validate CSRF token from request
 *
 * Checks that token in cookie matches token in header or body
 *
 * @param request - Next.js request object
 * @returns Validation result
 */
export async function validateCSRFToken(
  request: Request
): Promise<{ valid: boolean; message?: string }> {
  // Get token from cookie
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!cookieToken) {
    return {
      valid: false,
      message: 'CSRF token missing from cookies',
    };
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  // If not in header, try to get from body (for FormData)
  let bodyToken: string | null = null;

  if (!headerToken) {
    try {
      const contentType = request.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const body = await request.json();
        bodyToken = body._csrf;
      } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        bodyToken = formData.get('_csrf') as string;
      }
    } catch (error) {
      return {
        valid: false,
        message: 'Failed to parse request body for CSRF token',
      };
    }
  }

  const submittedToken = headerToken || bodyToken;

  if (!submittedToken) {
    return {
      valid: false,
      message: 'CSRF token missing from request',
    };
  }

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(cookieToken, submittedToken)) {
    return {
      valid: false,
      message: 'CSRF token mismatch',
    };
  }

  return { valid: true };
}

/**
 * Timing-safe string comparison
 *
 * Prevents timing attacks by ensuring comparison takes constant time
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * CSRF validation middleware for API routes
 *
 * Usage:
 * ```ts
 * export async function POST(request: Request) {
 *   const csrfResult = await checkCSRF(request);
 *   if (csrfResult) return csrfResult; // 403 response
 *
 *   // Continue with handler logic
 * }
 * ```
 */
export async function checkCSRF(request: Request): Promise<Response | null> {
  const result = await validateCSRFToken(request);

  if (!result.valid) {
    return new Response(
      JSON.stringify({
        error: 'CSRF validation failed',
        message: result.message || 'Invalid CSRF token',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return null; // CSRF validation passed
}

/**
 * Get CSRF token for client-side use
 *
 * Call this in a server component or API route to get the token
 * for embedding in forms or sending in headers
 *
 * If no token exists, generates one
 *
 * @returns CSRF token
 */
export async function getOrCreateCSRFToken(): Promise<string> {
  let token = await getCSRFToken();

  if (!token) {
    token = await setCSRFToken();
  }

  return token;
}

/**
 * Generate CSRF hidden field HTML
 *
 * Usage in forms:
 * ```tsx
 * const csrfToken = await getOrCreateCSRFToken();
 * <input type="hidden" name="_csrf" value={csrfToken} />
 * ```
 */
export function generateCSRFField(token: string): string {
  return `<input type="hidden" name="_csrf" value="${token}" />`;
}

/**
 * CSRF Field for Client Components
 *
 * Since this is a server-side file, create the component directly in your form:
 * ```tsx
 * <input type="hidden" name="_csrf" value={csrfToken} />
 * ```
 *
 * Or use generateCSRFField() to get HTML string for dangerouslySetInnerHTML
 */

/**
 * Rotate CSRF token (after form submission)
 *
 * Good practice to generate new token after each use
 */
export async function rotateCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_COOKIE_NAME);
  return await setCSRFToken();
}

/**
 * Verify Origin header (additional protection)
 *
 * Checks that request originates from the same domain
 * This is what Next.js server actions use for CSRF protection
 *
 * @param request - Next.js request object
 * @returns True if origin is valid
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin || !host) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}

/**
 * Combined CSRF validation (token + origin)
 *
 * Most secure - validates both token and origin
 *
 * @param request - Next.js request object
 * @returns Validation result
 */
export async function validateCSRFComplete(
  request: Request
): Promise<{ valid: boolean; message?: string }> {
  // Check origin first (cheaper operation)
  if (!validateOrigin(request)) {
    return {
      valid: false,
      message: 'Invalid origin',
    };
  }

  // Then check token
  return await validateCSRFToken(request);
}
