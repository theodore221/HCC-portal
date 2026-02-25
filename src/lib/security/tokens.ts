/**
 * Token Hashing & Validation Utilities
 *
 * Secure token generation, hashing, and validation for:
 * - Custom pricing tokens
 * - Guest access tokens (OTP magic links)
 * - Password reset tokens (future)
 *
 * Security principles:
 * - Never store tokens in plaintext
 * - Use SHA-256 for hashing
 * - Use cryptographically secure random generation
 * - Use timing-safe comparison to prevent timing attacks
 */

import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token
 *
 * @param length - Length in bytes (default: 32)
 * @returns URL-safe base64 encoded token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Hash a token using SHA-256
 *
 * This is what gets stored in the database
 *
 * @param token - Plain token string
 * @returns Hex-encoded hash
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify a token against its hash
 *
 * Uses timing-safe comparison to prevent timing attacks
 *
 * @param token - Plain token string to verify
 * @param hash - Stored hash to compare against
 * @returns True if token matches hash
 */
export function verifyToken(token: string, hash: string): boolean {
  const tokenHash = hashToken(token);

  // Constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(tokenHash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  } catch {
    // Lengths don't match - return false
    return false;
  }
}

/**
 * Generate a custom pricing token with metadata
 *
 * @returns Object with token and hash
 */
export function generateCustomPricingToken(): {
  token: string;
  hash: string;
  expires_at: Date;
} {
  const token = generateSecureToken(32);
  const hash = hashToken(token);
  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + 30); // 30 days from now

  return {
    token,
    hash,
    expires_at,
  };
}

/**
 * Generate a guest access token (OTP magic link)
 *
 * @returns Object with token and hash
 */
export function generateGuestToken(): {
  token: string;
  hash: string;
} {
  const token = crypto.randomUUID(); // UUID v4
  const hash = hashToken(token);

  return {
    token,
    hash,
  };
}

/**
 * Validate custom pricing token
 *
 * Checks:
 * 1. Token matches hash
 * 2. Token not expired
 * 3. Booking status is 'awaiting_customer_details'
 *
 * @param token - Token from URL
 * @param storedHash - Hash from database
 * @param expiresAt - Expiry timestamp from database
 * @param bookingStatus - Current booking status
 * @returns Validation result
 */
export function validateCustomPricingToken(
  token: string,
  storedHash: string,
  expiresAt: Date | string,
  bookingStatus: string
): {
  valid: boolean;
  reason?: 'invalid_token' | 'expired' | 'already_used' | 'invalid_status';
} {
  // Check if token matches hash
  if (!verifyToken(token, storedHash)) {
    return {
      valid: false,
      reason: 'invalid_token',
    };
  }

  // Check if expired
  const expiryDate = new Date(expiresAt);
  if (expiryDate < new Date()) {
    return {
      valid: false,
      reason: 'expired',
    };
  }

  // Check booking status
  if (bookingStatus !== 'AwaitingDetails') {
    return {
      valid: false,
      reason: 'already_used',
    };
  }

  return { valid: true };
}

/**
 * Validate guest access token
 *
 * @param token - Token from URL/cookie
 * @param storedHash - Hash from database
 * @returns True if valid
 */
export function validateGuestToken(token: string, storedHash: string): boolean {
  return verifyToken(token, storedHash);
}

/**
 * Generate a short, human-readable reference code
 *
 * Used for enquiry references, booking references, etc.
 * Format: XXX-YYYY-ZZZZ (e.g., ENQ-2026-0001)
 *
 * @param prefix - Prefix (e.g., 'ENQ', 'BKG')
 * @param sequence - Sequence number
 * @returns Formatted reference
 */
export function generateReference(prefix: string, sequence: number): string {
  const year = new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(4, '0');
  return `${prefix}-${year}-${paddedSequence}`;
}

/**
 * Generate a one-time password (numeric)
 *
 * Useful for SMS or email verification
 *
 * @param length - Number of digits (default: 6)
 * @returns Numeric OTP
 */
export function generateOTP(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const otp = Math.floor(min + crypto.randomInt(0, max - min + 1));
  return otp.toString();
}

/**
 * Hash a password using bcrypt
 *
 * Note: For admin passwords only. Customers don't have passwords.
 *
 * @param password - Plain password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 *
 * @param password - Plain password
 * @param hash - Stored hash
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const bcrypt = await import('bcrypt');
  return bcrypt.compare(password, hash);
}

/**
 * Generate API key (for future integrations)
 *
 * @param prefix - Prefix for identification (e.g., 'hcc_live', 'hcc_test')
 * @returns API key
 */
export function generateAPIKey(prefix: string = 'hcc'): string {
  const random = generateSecureToken(32);
  return `${prefix}_${random}`;
}

/**
 * Mask token for safe logging
 *
 * Shows only first 6 and last 4 characters
 * Example: "abc123...xyz9"
 *
 * @param token - Token to mask
 * @returns Masked token
 */
export function maskToken(token: string): string {
  if (token.length < 12) {
    return '***';
  }
  const start = token.substring(0, 6);
  const end = token.substring(token.length - 4);
  return `${start}...${end}`;
}

/**
 * Token metadata for audit logging
 *
 * @param token - Plain token
 * @returns Metadata object
 */
export function getTokenMetadata(token: string): {
  length: number;
  masked: string;
  hash_preview: string;
  created_at: string;
} {
  return {
    length: token.length,
    masked: maskToken(token),
    hash_preview: hashToken(token).substring(0, 8),
    created_at: new Date().toISOString(),
  };
}

/**
 * Check if a string looks like a valid token format
 *
 * Basic format validation (doesn't verify cryptographic properties)
 *
 * @param token - Token to validate
 * @returns True if format looks valid
 */
export function isValidTokenFormat(token: string): boolean {
  // Check length (should be at least 16 chars for security)
  if (token.length < 16) {
    return false;
  }

  // Check if it's base64url format
  const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
  if (base64UrlPattern.test(token)) {
    return true;
  }

  // Check if it's a UUID
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(token)) {
    return true;
  }

  return false;
}

/**
 * Calculate token strength
 *
 * Returns entropy in bits
 *
 * @param token - Token to analyze
 * @returns Entropy in bits
 */
export function calculateTokenEntropy(token: string): number {
  // For base64url: 6 bits per character
  // For hex: 4 bits per character
  // For UUID: 122 bits (standard UUID v4)

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return 122; // UUID v4
  }

  if (/^[A-Za-z0-9_-]+$/.test(token)) {
    return token.length * 6; // base64url
  }

  if (/^[0-9a-f]+$/i.test(token)) {
    return token.length * 4; // hex
  }

  // Unknown format - estimate conservatively
  return token.length * 5;
}
