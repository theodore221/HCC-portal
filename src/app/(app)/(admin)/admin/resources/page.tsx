import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getResources } from "./actions";
import { SpacesTab } from "./_components/spaces-tab";
import { RoomsTab } from "./_components/rooms-tab";
import { MealsTab } from "./_components/meals-tab";
import { CsvImporter } from "@/components/resources/csv-importer";

export default async function AdminResources() {
  const { spaces, rooms, roomTypes, mealPrices } = await getResources();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Resource registry</CardTitle>
            <CardDescription>
              Maintain spaces, rooms and meal pricing. Caterers and menu items have moved to{" "}
              <a href="/admin/catering/caterers" className="text-primary underline-offset-2 hover:underline">
                Kitchen → Caterers
              </a>
              .
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
