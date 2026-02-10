/**
 * Booking Form Validation Schema
 */

import { z } from 'zod';

// Step 1: Contact Details
export const contactDetailsSchema = z.object({
  booking_type: z.enum(['Group', 'Individual']),
  organization: z.string().optional().nullable(),
  contact_name: z.string().min(2).max(100),
  contact_email: z.string().email().toLowerCase(),
  contact_phone: z.string().min(6),
});

// Step 2: Event Details
export const eventDetailsSchema = z.object({
  event_type: z.string().min(1),
  event_name: z.string().optional().nullable(),
  arrival_date: z.string().min(1),
  departure_date: z.string().min(1),
  headcount: z.number().int().min(1).max(200),
  minors: z.boolean(),
});

// Step 3: Venue & Spaces
export const venueSchema = z.object({
  whole_centre: z.boolean(),
  selected_spaces: z.array(z.string()).optional(),
});

// Step 4: Accommodation
export const accommodationSchema = z.object({
  is_overnight: z.boolean(),
  rooms: z.array(z.object({
    room_type_id: z.string(),
    quantity: z.number().int().min(1),
    byo_linen: z.boolean().optional(),
  })).optional(),
});

// Step 5: Catering
export const cateringSchema = z.object({
  catering_required: z.boolean(),
  meals: z.array(z.object({
    meal_type: z.string(),
    date: z.string(),
    headcount: z.number().int().min(1),
  })).optional(),
  percolated_coffee_quantity: z.number().int().min(0).optional(),
});

// Complete booking schema
export const bookingSchema = contactDetailsSchema
  .merge(eventDetailsSchema)
  .merge(venueSchema)
  .merge(accommodationSchema)
  .merge(cateringSchema)
  .extend({
    notes: z.string().max(2000).optional().nullable(),
    terms_accepted: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions',
    }),
    _honeypot: z.string().optional(),
    _form_time: z.string().optional(),
  });

export type BookingFormData = z.infer<typeof bookingSchema>;
