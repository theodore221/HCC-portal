/**
 * CSRF Token API Route
 *
 * Generates and sets CSRF tokens in cookies.
 * This is a Route Handler, which is allowed to modify cookies.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_TOKEN_LENGTH = 32;

function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('base64url');
}

export async function GET() {
  const cookieStore = await cookies();

  // Check if token already exists
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  // If not, generate new token
  if (!token) {
    token = generateCSRFToken();

    cookieStore.set(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });
  }

  return NextResponse.json({ token });
}
