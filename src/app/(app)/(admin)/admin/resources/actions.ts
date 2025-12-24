// @ts-nocheck
"use server";

import { sbServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";

const RESOURCES_PATH = "/admin/resources";

// --- Fetchers ---

export async function getResources() {
  const supabase = await sbServer();

  const [
    { data: spaces },
    { data: rooms },
    { data: roomTypes },
    { data: mealPrices },
    { data: menuItems },
    { data: caterers },
  ] = await Promise.all([
    supabase.from("spaces").select("*").order("name"),
    supabase.from("rooms").select("*, room_types(*)").order("name"),
    supabase.from("room_types").select("*").order("price"),
    supabase.from("meal_prices").select("*").order("price"),
    supabase.from("menu_items").select("*, caterers(name)").order("label"),
    supabase.from("caterers").select("*").order("name"),
  ]);

  return {
    spaces: spaces || [],
    rooms: rooms || [],
    roomTypes: roomTypes || [],
    mealPrices: mealPrices || [],
    menuItems: menuItems || [],
    caterers: caterers || [],
  };
}

// --- Mutations ---

// Spaces
export async function updateSpace(id: string, data: TablesUpdate<"spaces">) {
  const supabase = await sbServer();
  const { error } = await supabase.from("spaces").update(data).eq("id", id);
  if (error) throw error;
  revalidatePath(RESOURCES_PATH);
}

// Room Types
export async function updateRoomType(
  id: string,
  data: TablesUpdate<"room_types">
) {
  const supabase = await sbServer();
  const { error } = await supabase.from("room_types").update(data).eq("id", id);
  if (error) throw error;
  revalidatePath(RESOURCES_PATH);
}

export async function createRoomType(data: TablesInsert<"room_types">) {
  const supabase = await sbServer();
  const { error } = await supabase.from("room_types").insert(data);
  if (error) throw error;
  revalidatePath(RESOURCES_PATH);
}

// Rooms
export async function updateRoom(id: string, data: TablesUpdate<"rooms">) {
  const supabase = await sbServer();
  const { error } = await supabase.from("rooms").update(data).eq("id", id);
  if (error) throw error;
  revalidatePath(RESOURCES_PATH);
}

// Meal Prices
export async function updateMealPrice(
  id: string,
  data: TablesUpdate<"meal_prices">
) {
  const supabase = await sbServer();
  const { error } = await supabase
    .from("meal_prices")
    .update(data)
    .eq("id", id);
  if (error) throw error;
  revalidatePath(RESOURCES_PATH);
}

// Menu Items
export async function updateMenuItem(
  id: string,
  data: TablesUpdate<"menu_items">
) {
  const supabase = await sbServer();
  const { error } = await supabase.from("menu_items").update(data).eq("id", id);
  if (error) throw error;
  revalidatePath(RESOURCES_PATH);
}

export async function createMenuItem(data: TablesInsert<"menu_items">) {
  const supabase = await sbServer();
  const { error } = await supabase.from("menu_items").insert(data);
  if (error) throw error;
  revalidatePath(RESOURCES_PATH);
}

export async function deleteMenuItem(id: string) {
  const supabase = await sbServer();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(RESOURCES_PATH);
}

// Caterers
export async function updateCaterer(
  id: string,
  data: TablesUpdate<"caterers">
) {
  const supabase = await sbServer();
  const { error } = await supabase.from("caterers").update(data).eq("id", id);
  if (error) throw error;
  revalidatePath(RESOURCES_PATH);
}

export async function createCaterer(data: TablesInsert<"caterers">) {
  const supabase = await sbServer();
  const { error } = await supabase.from("caterers").insert(data);
  if (error) throw error;
  revalidatePath(RESOURCES_PATH);
}

export async function deleteCaterer(id: string) {
  const supabase = await sbServer();
  const { error } = await supabase.from("caterers").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(RESOURCES_PATH);
}

// Bulk Update
export async function bulkUpdateResources(
  type: "menu_items" | "spaces",
  data: any[]
) {
  const supabase = await sbServer();

  if (type === "menu_items") {
    // Expects: Label, Meal Type, Allergens, Default Caterer
    const { data: caterers } = await supabase
      .from("caterers")
      .select("id, name");
    const catererMap = new Map(
      caterers?.map((c) => [c.name.toLowerCase(), c.id])
    );

    const upserts = data.map((row) => {
      const catererId =
        catererMap.get(row["Default Caterer"]?.toLowerCase()) || null;
      return {
        label: row["Label"],
        meal_type: row["Meal Type"],
        allergens: row["Allergens"]
          ? row["Allergens"].split(",").map((s: string) => s.trim())
          : [],
        default_caterer_id: catererId,
      };
    });

    const { error } = await supabase.from("menu_items").insert(upserts);
    if (error) throw error;
  } else if (type === "spaces") {
    // Expects: Name, Capacity, Price, Features
    const upserts = data.map((row) => ({
      name: row["Name"],
      capacity: parseInt(row["Capacity"]) || 0,
      price: parseFloat(row["Price"]) || 0,
      features: row["Features"]
        ? row["Features"].split(",").map((s: string) => s.trim())
        : [],
    }));

    // Spaces ID is text (name). So we can upsert.
    const { error } = await supabase.from("spaces").upsert(
      upserts.map((u) => ({ ...u, id: u.name })),
      { onConflict: "id" }
    );
    if (error) throw error;
  }

  revalidatePath(RESOURCES_PATH);
}
