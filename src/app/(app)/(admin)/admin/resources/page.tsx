// @ts-nocheck
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getResources } from "./actions";
import { SpacesTab } from "./_components/spaces-tab";
import { RoomsTab } from "./_components/rooms-tab";
import { MealsTab } from "./_components/meals-tab";
import { MenuTab } from "./_components/menu-tab";
import { CaterersTab } from "./_components/caterers-tab";
import { CsvImporter } from "@/components/resources/csv-importer";

export default async function AdminResources() {
  const { spaces, rooms, roomTypes, mealPrices, menuItems, caterers } =
    await getResources();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Resource registry</CardTitle>
            <CardDescription>
              Maintain spaces, rooms, menu items and caterers
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <CsvImporter />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="spaces" className="space-y-4">
            <TabsList className="flex flex-wrap gap-2 bg-transparent p-0">
              <TabsTrigger
                value="spaces"
                className="rounded-full border border-transparent data-[state=active]:border-border data-[state=active]:bg-background"
              >
                Spaces
              </TabsTrigger>
              <TabsTrigger
                value="rooms"
                className="rounded-full border border-transparent data-[state=active]:border-border data-[state=active]:bg-background"
              >
                Rooms
              </TabsTrigger>
              <TabsTrigger
                value="meals"
                className="rounded-full border border-transparent data-[state=active]:border-border data-[state=active]:bg-background"
              >
                Meals
              </TabsTrigger>
              <TabsTrigger
                value="menu"
                className="rounded-full border border-transparent data-[state=active]:border-border data-[state=active]:bg-background"
              >
                Menu items
              </TabsTrigger>
              <TabsTrigger
                value="caterers"
                className="rounded-full border border-transparent data-[state=active]:border-border data-[state=active]:bg-background"
              >
                Caterers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="spaces" className="space-y-4 pt-4">
              <SpacesTab spaces={spaces} />
            </TabsContent>

            <TabsContent value="rooms" className="space-y-4 pt-4">
              <RoomsTab rooms={rooms} roomTypes={roomTypes} />
            </TabsContent>

            <TabsContent value="meals" className="space-y-4 pt-4">
              <MealsTab mealPrices={mealPrices} />
            </TabsContent>

            <TabsContent value="menu" className="space-y-4 pt-4">
              <MenuTab
                menuItems={menuItems}
                caterers={caterers}
                mealPrices={mealPrices}
              />
            </TabsContent>

            <TabsContent value="caterers" className="space-y-4 pt-4">
              <CaterersTab caterers={caterers} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
