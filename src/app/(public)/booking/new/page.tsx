/**
 * New Booking Page
 * Path B: Direct Booking Form with Standard Pricing
 */

import { Metadata } from 'next';
import { getOrCreateCSRFToken } from '@/lib/security/csrf-actions';
import { sbServer } from '@/lib/supabase-server';
import { BookingForm } from './booking-form';
import type { SpaceOption, RoomTypeOption, MealPriceOption } from './booking-form';

export const metadata: Metadata = {
  title: 'New Booking | Holy Cross Centre',
  description: 'Book the Holy Cross Centre for your event with our online booking form.',
};

export default async function NewBookingPage() {
  const [csrfToken, supabase] = await Promise.all([
    getOrCreateCSRFToken(),
    sbServer(),
  ]);

  // Fetch reference data in parallel
  const [spacesResult, roomTypesResult, mealPricesResult] = await Promise.all([
    supabase
      .from('spaces')
      .select('id, name, capacity, price')
      .eq('active', true)
      .neq('id', 'Whole Centre Day Hire') // Handled separately as a toggle
      .order('name'),
    supabase
      .from('room_types')
      .select('id, name, description, price, capacity')
      .in('name', ['Single Bed', 'Double Bed', 'Double Bed + Ensuite', 'Double Bed + Ensuite + Priv Study'])
      .order('price'),
    supabase
      .from('meal_prices')
      .select('meal_type, price')
      .order('meal_type'),
  ]);

  const spaces: SpaceOption[] = (spacesResult.data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    capacity: s.capacity,
    price: s.price,
  }));

  // Room type max quantities based on known room inventory
  const ROOM_MAX_QTY: Record<string, number> = {
    'Single Bed': 80,
    'Double Bed': 5,
    'Double Bed + Ensuite': 5,
    'Double Bed + Ensuite + Priv Study': 1,
  };

  const roomTypes: RoomTypeOption[] = (roomTypesResult.data ?? []).map((rt: any) => ({
    id: rt.id,
    name: rt.name,
    description: rt.description,
    price: rt.price,
    capacity: rt.capacity,
    max_qty: ROOM_MAX_QTY[rt.name],
  }));

  const mealPrices: MealPriceOption[] = (mealPricesResult.data ?? []).map((mp: any) => ({
    meal_type: mp.meal_type,
    price: mp.price,
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Book Holy Cross Centre
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete this form to request your booking. We&apos;ll review it and get back to you shortly.
          </p>
        </div>

        <BookingForm
          csrfToken={csrfToken}
          spaces={spaces}
          roomTypes={roomTypes}
          mealPrices={mealPrices}
        />
      </div>
    </div>
  );
}
