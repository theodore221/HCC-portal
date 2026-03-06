// @ts-nocheck
"use server";

import { sbServer } from "@/lib/supabase-server";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import type { TablesInsert, TablesUpdate } from "@/lib/database.types";

export async function createMenuItem(data: TablesInsert<"menu_items">) {
  const supabase = await sbServer();
  // @ts-ignore - Type compatibility issue with @supabase/ssr
  const { error } = await supabase.from("menu_items").insert(data);
  if (error) throw error;
  revalidateTag(CACHE_TAGS.CATERING_OPTIONS);
}

export async function updateMenuItem(id: string, data: TablesUpdate<"menu_items">) {
  const supabase = await sbServer();
  // @ts-ignore - Type compatibility issue with @supabase/ssr
  const { error } = await supabase.from("menu_items").update(data).eq("id", id);
  if (error) throw error;
  revalidateTag(CACHE_TAGS.CATERING_OPTIONS);
}

export async function deleteMenuItem(id: string) {
  const supabase = await sbServer();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw error;
  revalidateTag(CACHE_TAGS.CATERING_OPTIONS);
}
