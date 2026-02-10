/**
 * Admin Enquiry Management Actions
 */

'use server';

import { sbServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function updateEnquiryStatus(
  enquiryId: string,
  status: string,
  notes?: string
) {
  const supabase = await sbServer();

  const updateData: any = { status };
  if (notes) updateData.admin_notes = notes;

  const { error } = await supabase
    .from('enquiries')
    .update(updateData)
    .eq('id', enquiryId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/enquiries');
  return { success: true };
}

export async function setQuotedAmount(
  enquiryId: string,
  amount: number,
  notes?: string
) {
  const supabase = await sbServer();

  const { error } = await supabase
    .from('enquiries')
    .update({
      status: 'quoted',
      quoted_amount: amount,
      admin_notes: notes || null,
    })
    .eq('id', enquiryId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/enquiries');
  return { success: true };
}

export async function markAsLost(
  enquiryId: string,
  reason: string
) {
  const supabase = await sbServer();

  const { error } = await supabase
    .from('enquiries')
    .update({
      status: 'lost',
      lost_reason: reason,
    })
    .eq('id', enquiryId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/enquiries');
  return { success: true };
}
