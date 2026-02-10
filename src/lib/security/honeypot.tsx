/**
 * Honeypot Field Validation
 *
 * Honeypot fields are hidden form fields that legitimate users never fill out,
 * but bots typically auto-fill. This provides a simple bot detection mechanism.
 *
 * Implementation:
 * 1. Add a hidden field to forms (styled with CSS display:none)
 * 2. Name it something tempting for bots (e.g., 'website', 'url', 'email_confirm')
 * 3. Validate server-side that the field is empty
 *
 * IMPORTANT: Do not use obvious names like 'honeypot' - bots can detect these.
 */

/**
 * Honeypot field names (randomize these periodically for better security)
 */
export const HONEYPOT_FIELDS = {
  enquiry: 'website_url', // Bots think this is a legitimate field
  booking: 'email_confirm', // Looks like an email confirmation field
  contact: 'phone_backup', // Looks like a backup phone field
};

/**
 * Validate that honeypot field is empty
 *
 * @param fieldValue - Value of the honeypot field from form data
 * @returns True if validation passes (field is empty), false if bot detected
 */
export function validateHoneypot(fieldValue: string | null | undefined): boolean {
  // Field should be empty or null for legitimate users
  return !fieldValue || fieldValue.trim() === '';
}

/**
 * Validate honeypot field from FormData
 *
 * @param formData - FormData object from request
 * @param fieldName - Name of the honeypot field
 * @returns Validation result with bot detection flag
 */
export function validateHoneypotFromFormData(
  formData: FormData,
  fieldName: string
): {
  valid: boolean;
  botDetected: boolean;
  message?: string;
} {
  const honeypotValue = formData.get(fieldName);

  if (!validateHoneypot(honeypotValue as string)) {
    return {
      valid: false,
      botDetected: true,
      message: 'Bot activity detected',
    };
  }

  return {
    valid: true,
    botDetected: false,
  };
}

/**
 * Validate honeypot field from JSON body
 *
 * @param body - Parsed JSON body from request
 * @param fieldName - Name of the honeypot field
 * @returns Validation result
 */
export function validateHoneypotFromJSON(
  body: Record<string, any>,
  fieldName: string
): {
  valid: boolean;
  botDetected: boolean;
  message?: string;
} {
  const honeypotValue = body[fieldName];

  if (!validateHoneypot(honeypotValue)) {
    return {
      valid: false,
      botDetected: true,
      message: 'Bot activity detected',
    };
  }

  return {
    valid: true,
    botDetected: false,
  };
}

/**
 * Generate honeypot field HTML for React forms
 *
 * Usage in forms:
 * ```tsx
 * <div dangerouslySetInnerHTML={{ __html: generateHoneypotField('website_url') }} />
 * ```
 *
 * Or better, use a React component:
 * ```tsx
 * <HoneypotField name="website_url" />
 * ```
 */
export function generateHoneypotFieldHTML(fieldName: string): string {
  return `
    <input
      type="text"
      name="${fieldName}"
      id="${fieldName}"
      tabindex="-1"
      autocomplete="off"
      style="position: absolute; left: -9999px; width: 1px; height: 1px;"
      aria-hidden="true"
    />
  `;
}

/**
 * React Honeypot Component
 *
 * Usage:
 * ```tsx
 * import { HoneypotField } from '@/lib/security/honeypot';
 *
 * <HoneypotField name="website_url" />
 * ```
 */
export function HoneypotField({ name }: { name: string }) {
  return (
    <input
      type="text"
      name={name}
      id={name}
      tabIndex={-1}
      autoComplete="off"
      style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Handle bot detection in API routes
 *
 * Usage:
 * ```ts
 * const honeypotResult = validateHoneypotFromJSON(body, 'website_url');
 * if (!honeypotResult.valid) {
 *   return handleBotDetection(request);
 * }
 * ```
 */
export function handleBotDetection(request: Request): Response {
  // Log bot attempt (optional - add to your logging system)
  console.warn('Bot detected:', {
    url: request.url,
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
  });

  // Return a subtle error (don't reveal bot detection to attackers)
  return new Response(
    JSON.stringify({
      error: 'Invalid request',
      message: 'Please check your form submission and try again.',
    }),
    {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Advanced honeypot: Time-based honeypot
 *
 * Track when form page was loaded and reject submissions that are too fast
 * (indicates bot auto-fill)
 */
export interface TimeBasedValidation {
  pageLoadTime: number; // Unix timestamp when form loaded
  minimumTimeSeconds: number; // Minimum time required to fill form
}

/**
 * Generate time-based validation token
 *
 * This should be embedded as a hidden field in the form
 *
 * @returns Base64 encoded timestamp
 */
export function generateTimeToken(): string {
  const timestamp = Date.now();
  return Buffer.from(timestamp.toString()).toString('base64');
}

/**
 * Validate submission time
 *
 * @param timeToken - Token from form (base64 encoded timestamp)
 * @param minimumSeconds - Minimum time required (default: 3 seconds)
 * @returns Validation result
 */
export function validateSubmissionTime(
  timeToken: string | null | undefined,
  minimumSeconds: number = 3
): {
  valid: boolean;
  tooFast: boolean;
  elapsed?: number;
  message?: string;
} {
  if (!timeToken) {
    return {
      valid: false,
      tooFast: false,
      message: 'Missing time validation token',
    };
  }

  try {
    const pageLoadTime = parseInt(Buffer.from(timeToken, 'base64').toString(), 10);
    const now = Date.now();
    const elapsedSeconds = (now - pageLoadTime) / 1000;

    if (elapsedSeconds < minimumSeconds) {
      return {
        valid: false,
        tooFast: true,
        elapsed: elapsedSeconds,
        message: `Form submitted too quickly (${elapsedSeconds.toFixed(1)}s < ${minimumSeconds}s)`,
      };
    }

    // Also check if timestamp is in the future or too old (1 hour)
    if (pageLoadTime > now || elapsedSeconds > 3600) {
      return {
        valid: false,
        tooFast: false,
        message: 'Invalid time token',
      };
    }

    return {
      valid: true,
      tooFast: false,
      elapsed: elapsedSeconds,
    };
  } catch (error) {
    return {
      valid: false,
      tooFast: false,
      message: 'Invalid time token format',
    };
  }
}

/**
 * Combined bot detection validation
 *
 * Checks both honeypot and submission time
 *
 * @param body - Request body
 * @param honeypotField - Name of honeypot field
 * @param timeTokenField - Name of time token field
 * @returns Combined validation result
 */
export function validateBotDetection(
  body: Record<string, any>,
  honeypotField: string,
  timeTokenField: string = '_form_time'
): {
  valid: boolean;
  reason?: string;
} {
  // Check honeypot
  const honeypotResult = validateHoneypotFromJSON(body, honeypotField);
  if (!honeypotResult.valid) {
    return {
      valid: false,
      reason: 'honeypot',
    };
  }

  // Check submission time
  const timeResult = validateSubmissionTime(body[timeTokenField]);
  if (!timeResult.valid) {
    return {
      valid: false,
      reason: timeResult.tooFast ? 'too_fast' : 'invalid_time',
    };
  }

  return { valid: true };
}
