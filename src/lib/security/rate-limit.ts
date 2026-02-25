/**
 * Rate Limiting Middleware
 *
 * Implements sliding window rate limiting to protect public endpoints from abuse.
 * Supports both Upstash Redis (production) and in-memory (development/fallback).
 *
 * Usage in API routes:
 * ```ts
 * const rateLimitResult = await rateLimit(request, 'enquiry', { max: 5, window: '15m' });
 * if (!rateLimitResult.success) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 * }
 * ```
 */

import { NextRequest } from 'next/server';
import { headers } from 'next/headers';

// Rate limit configuration per endpoint type
export interface RateLimitConfig {
  max: number; // Maximum requests allowed
  window: string; // Time window (e.g., '15m', '1h', '1d')
}

// Rate limit result
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when limit resets
}

// Predefined rate limit configurations per spec
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  enquiry: { max: 5, window: '15m' },
  booking: { max: 3, window: '15m' },
  pricing: { max: 20, window: '1m' },
  custom_booking: { max: 5, window: '15m' },
  portal: { max: 10, window: '1m' },
};

// In-memory store for rate limiting (fallback when Redis not available)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

/**
 * Parse window string to milliseconds
 */
function parseWindow(window: string): number {
  const unit = window.slice(-1);
  const value = parseInt(window.slice(0, -1), 10);

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid window format: ${window}`);
  }
}

/**
 * Clean up expired entries from in-memory store
 * Run periodically to prevent memory leaks
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (entry.resetAt < now) {
      inMemoryStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Get client identifier from request
 * Uses x-forwarded-for header if behind proxy, otherwise connection IP
 */
function getClientId(request: NextRequest): string {
  // Check for forwarded IP (if behind proxy like Vercel, Cloudflare)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take first IP in chain
    return forwardedFor.split(',')[0].trim();
  }

  // Check x-real-ip header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to 'unknown' (shouldn't happen in production)
  return 'unknown';
}

/**
 * In-memory rate limiting implementation
 */
async function rateLimitInMemory(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = parseWindow(config.window);
  const resetAt = now + windowMs;

  const entry = inMemoryStore.get(identifier);

  // No entry or expired entry - create new
  if (!entry || entry.resetAt < now) {
    inMemoryStore.set(identifier, { count: 1, resetAt });
    return {
      success: true,
      limit: config.max,
      remaining: config.max - 1,
      reset: resetAt,
    };
  }

  // Increment count
  entry.count += 1;

  // Check if limit exceeded
  if (entry.count > config.max) {
    return {
      success: false,
      limit: config.max,
      remaining: 0,
      reset: entry.resetAt,
    };
  }

  return {
    success: true,
    limit: config.max,
    remaining: config.max - entry.count,
    reset: entry.resetAt,
  };
}

/**
 * Main rate limiting function
 *
 * Attempts to use Upstash Redis if available, falls back to in-memory
 *
 * @param request - Next.js request object
 * @param endpointType - Type of endpoint ('enquiry', 'booking', etc.)
 * @param customConfig - Optional custom rate limit config (overrides preset)
 * @returns Rate limit result
 */
export async function rateLimit(
  request: NextRequest,
  endpointType: string,
  customConfig?: RateLimitConfig
): Promise<RateLimitResult> {
  const config = customConfig || RATE_LIMITS[endpointType];

  if (!config) {
    throw new Error(`No rate limit config found for endpoint: ${endpointType}`);
  }

  // Get client identifier
  const clientId = getClientId(request);
  const identifier = `ratelimit:${endpointType}:${clientId}`;

  // Try Upstash Redis first (if configured)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await rateLimitWithUpstash(identifier, config);
    } catch (error) {
      console.warn('Upstash rate limiting failed, falling back to in-memory:', error);
      // Fall through to in-memory
    }
  }

  // Fallback to in-memory rate limiting
  return await rateLimitInMemory(identifier, config);
}

/**
 * Upstash Redis rate limiting implementation
 * Uses sliding window algorithm with Redis sorted sets
 */
async function rateLimitWithUpstash(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

  const now = Date.now();
  const windowMs = parseWindow(config.window);
  const windowStart = now - windowMs;

  // Pipeline commands for atomic execution
  const commands = [
    // Remove old entries outside the window
    ['ZREMRANGEBYSCORE', identifier, 0, windowStart],
    // Count current entries in window
    ['ZCARD', identifier],
    // Add current request
    ['ZADD', identifier, now, `${now}-${Math.random()}`],
    // Set expiry on key
    ['EXPIRE', identifier, Math.ceil(windowMs / 1000)],
  ];

  const response = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  if (!response.ok) {
    throw new Error(`Upstash request failed: ${response.statusText}`);
  }

  const results = await response.json();
  const count = results[1].result; // ZCARD result

  const resetAt = now + windowMs;

  if (count > config.max) {
    return {
      success: false,
      limit: config.max,
      remaining: 0,
      reset: resetAt,
    };
  }

  return {
    success: true,
    limit: config.max,
    remaining: config.max - count,
    reset: resetAt,
  };
}

/**
 * Rate limit middleware for Next.js API routes
 *
 * Usage:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await checkRateLimit(request, 'enquiry');
 *   if (rateLimitResult) return rateLimitResult; // 429 response
 *
 *   // Continue with handler logic
 * }
 * ```
 */
export async function checkRateLimit(
  request: NextRequest,
  endpointType: string
): Promise<Response | null> {
  const result = await rateLimit(request, endpointType);

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retry_after: retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
        },
      }
    );
  }

  return null; // Rate limit passed
}

/**
 * Get client identifier from Next.js server action context (uses next/headers)
 */
export async function getClientIdFromHeaders(): Promise<string> {
  const headersList = await headers();

  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headersList.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Rate limiting for server actions (no NextRequest available)
 *
 * Usage in server actions:
 * ```ts
 * const rl = await rateLimitServerAction('enquiry');
 * if (!rl.success) {
 *   return { success: false, error: 'Too many submissions. Please try again in a few minutes.' };
 * }
 * ```
 */
export async function rateLimitServerAction(
  endpointType: string,
  customConfig?: RateLimitConfig
): Promise<RateLimitResult> {
  const config = customConfig || RATE_LIMITS[endpointType];

  if (!config) {
    throw new Error(`No rate limit config found for endpoint: ${endpointType}`);
  }

  const clientId = await getClientIdFromHeaders();
  const identifier = `ratelimit:${endpointType}:${clientId}`;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await rateLimitWithUpstash(identifier, config);
    } catch (error) {
      console.warn('Upstash rate limiting failed, falling back to in-memory:', error);
    }
  }

  return await rateLimitInMemory(identifier, config);
}

/**
 * Get rate limit info without incrementing counter
 * Useful for displaying limit status to users
 */
export async function getRateLimitInfo(
  request: NextRequest,
  endpointType: string
): Promise<{ limit: number; remaining: number; reset: number }> {
  const config = RATE_LIMITS[endpointType];
  if (!config) {
    return { limit: 0, remaining: 0, reset: 0 };
  }

  const clientId = getClientId(request);
  const identifier = `ratelimit:${endpointType}:${clientId}`;

  const entry = inMemoryStore.get(identifier);
  const now = Date.now();

  if (!entry || entry.resetAt < now) {
    return {
      limit: config.max,
      remaining: config.max,
      reset: now + parseWindow(config.window),
    };
  }

  return {
    limit: config.max,
    remaining: Math.max(0, config.max - entry.count),
    reset: entry.resetAt,
  };
}
