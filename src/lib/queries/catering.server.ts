import { sbServer } from "@/lib/supabase-server";

export type CateringOptions = {
  caterers: { id: string; name: string }[];
  menuItems: {
    id: string;
    label: string;
    catererId: string | null;
    mealType: string | null;
  }[];
};

export async function getCateringOptions(): Promise<CateringOptions> {
  const supabase = await sbServer();

  const [{ data: caterers }, { data: menuItems }] = await Promise.all([
    supabase
      .from("caterers")
      .select("id, name")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("active", true as any)
      .order("name"),
    supabase
      .from("menu_items")
      .select("id, label, default_caterer_id, meal_type")
      .order("label"),
  ]);

  return {
    caterers: (caterers as { id: string; name: string }[]) ?? [],
    menuItems:
      (menuItems as { id: string; label: string; default_caterer_id: string | null; meal_type: string | null }[])?.map((item) => ({
        id: item.id,
        label: item.label,
        catererId: item.default_caterer_id,
        mealType: item.meal_type,
      })) ?? [],
  };
}
