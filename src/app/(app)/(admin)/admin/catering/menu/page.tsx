import { sbServer } from "@/lib/supabase-server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MenuClient from "./client";

export default async function MenuPage() {
  const supabase = await sbServer();
  const [{ data: menuItems }, { data: caterers }, { data: mealPrices }] = await Promise.all([
    supabase.from("menu_items").select("*, caterers(name)").order("label"),
    supabase.from("caterers").select("*").order("name"),
    supabase.from("meal_prices").select("*").order("price"),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
          <CardDescription>Manage menu items available to caterers</CardDescription>
        </CardHeader>
        <CardContent>
          <MenuClient
            menuItems={menuItems ?? []}
            caterers={caterers ?? []}
            mealPrices={mealPrices ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
