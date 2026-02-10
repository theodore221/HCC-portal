/**
 * Client-Safe Security Utilities
 *
 * This file contains ONLY utilities that can be safely used in client components.
 * NO imports from server-only modules.
 */

/**
 * Honeypot field names
 */
export const HONEYPOT_FIELDS = {
  enquiry: 'website_url',
  booking: 'email_confirm',
  contact: 'phone_backup',
};

/**
 * Generate time-based validation token
 */
export function generateTimeToken(): string {
  const timestamp = Date.now();
  if (typeof window !== 'undefined') {
    return btoa(timestamp.toString());
  }
  return Buffer.from(timestamp.toString()).toString('base64');
}

/**
 * Generate honeypot field HTML
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
 * Generate CSRF field HTML
 */
export function generateCSRFField(token: string): string {
  return `<input type="hidden" name="_csrf" value="${token}" />`;
}
