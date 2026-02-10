/**
 * Enquiry Form Validation Schema
 *
 * Zod schema for validating enquiry form submissions
 */

import { z } from 'zod';

export const enquirySchema = z.object({
  // Customer info
  customer_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),

  customer_email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),

  customer_phone: z
    .string()
    .optional()
    .transform((val) => val?.trim() || null),

  organization: z
    .string()
    .max(200, 'Organization name must not exceed 200 characters')
    .optional()
    .transform((val) => val?.trim() || null),

  // Event details
  event_type: z.enum(
    [
      'Retreat',
      'Conference',
      'Wedding',
      'School',
      'Young Adults',
      'Training',
      'Silent Retreat',
      'Other',
    ],
    {
      required_error: 'Please select an event type',
    }
  ),

  approximate_start_date: z
    .string()
    .optional()
    .transform((val) => val || null),

  approximate_end_date: z
    .string()
    .optional()
    .transform((val) => val || null),

  estimated_guests: z
    .number()
    .int()
    .min(1, 'Number of guests must be at least 1')
    .max(200, 'Number of guests must not exceed 200')
    .optional()
    .nullable(),

  message: z
    .string()
    .min(10, 'Please provide more details (at least 10 characters)')
    .max(2000, 'Message must not exceed 2000 characters')
    .trim(),

  // Security fields (validated separately but included in schema)
  _honeypot: z
    .string()
    .optional()
    .transform((val) => val || null),

  _form_time: z
    .string()
    .optional()
    .transform((val) => val || null),

  _csrf: z.string().optional(),
});

export type EnquiryFormData = z.infer<typeof enquirySchema>;

/**
 * Sanitize enquiry data before database insertion
 * Removes security fields
 */
export function sanitizeEnquiryData(data: EnquiryFormData) {
  const { _honeypot, _form_time, _csrf, ...cleanData } = data;
  return cleanData;
}
