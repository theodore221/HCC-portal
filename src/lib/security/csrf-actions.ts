/**
 * CSRF Token Generation for Server Components
 *
 * Simple token generation without cookie management.
 * Next.js Server Actions already have built-in CSRF protection via origin checking.
 */

import crypto from 'crypto';
import { cookies } from 'next/headers';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a CSRF token
 */
function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('base64url');
}

/**
 * Get CSRF token from cookies (read-only)
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CSRF_COOKIE_NAME);
  return token?.value || null;
}

/**
 * Get or create CSRF token for Server Components
 *
 * This generates a token for embedding in forms.
 * Note: Next.js Server Actions already have built-in CSRF protection,
 * so this is mainly for traditional form submissions or extra security.
 */
export async function getOrCreateCSRFToken(): Promise<string> {
  // Check if token already exists in cookies
  const existingToken = await getCSRFToken();
  if (existingToken) {
    return existingToken;
  }

  // Generate a new token (don't try to set cookie here)
  // The cookie will be set when the token is validated in the Server Action
  return generateCSRFToken();
}
