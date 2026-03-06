// @ts-nocheck
"use server";

import { sbServer } from "@/lib/supabase-server";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export async function createDietaryLabel(data: {
  label: string;
  is_allergy: boolean;
  sort_order: number;
}) {
  const supabase = await sbServer();
  // @ts-ignore
  const { error } = await supabase.from("dietary_labels").insert(data);
  if (error) throw error;
  revalidateTag(CACHE_TAGS.DIETARY_LABELS);
}

export async function updateDietaryLabel(
  id: string,
  data: {
    label?: string;
    is_allergy?: boolean;
    sort_order?: number;
    active?: boolean;
  }
) {
  const supabase = await sbServer();
  // @ts-ignore
  const { error } = await supabase.from("dietary_labels").update(data).eq("id", id);
  if (error) throw error;
  revalidateTag(CACHE_TAGS.DIETARY_LABELS);
}

export async function deleteDietaryLabel(id: string) {
  const supabase = await sbServer();
  const { error } = await supabase.from("dietary_labels").delete().eq("id", id);
  if (error) throw error;
  revalidateTag(CACHE_TAGS.DIETARY_LABELS);
}
