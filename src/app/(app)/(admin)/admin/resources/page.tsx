"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";

const spaces = [
  { name: "Corbett Room", capacity: 80, features: "AV, breakout" },
  { name: "Dining Hall", capacity: 150, features: "Buffet line" },
];

const rooms = [
  { name: "Dorm 1", building: "Wing A", beds: "2 + extra" },
  { name: "Lodge Suite", building: "Wing B", beds: "2" },
];

const menuItems = [
  { label: "Roast Chicken", allergens: "Gluten", caterer: "HCC Kitchen" },
  { label: "Vegan Curry", allergens: "Nuts", caterer: "Bella Catering" },
];

const caterers = [
  { name: "HCC Kitchen", contact: "kitchen@hcc.org.au" },
  { name: "Bella Catering", contact: "hello@bellacatering.com" },
];

export default function AdminResources() {
  const [defaultCaterers, setDefaultCaterers] = useState<Record<string, string>>(() =>
    Object.fromEntries(menuItems.map((item) => [item.label, item.caterer]))
  );

  const catererOptions: ComboboxOption[] = caterers.map((caterer) => ({
    value: caterer.name,
    label: caterer.name,
    description: caterer.contact,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Resource registry</CardTitle>
            <CardDescription>Maintain spaces, rooms, menu items and caterers</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button>Add resource</Button>
            <Button variant="outline">Import from CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="spaces" className="space-y-4">
            <TabsList className="flex flex-wrap gap-2 bg-transparent p-0">
              <TabsTrigger value="spaces" className="rounded-full border border-transparent">
                Spaces
              </TabsTrigger>
              <TabsTrigger value="rooms" className="rounded-full border border-transparent">
                Rooms
              </TabsTrigger>
              <TabsTrigger value="menu" className="rounded-full border border-transparent">
                Menu items
              </TabsTrigger>
              <TabsTrigger value="caterers" className="rounded-full border border-transparent">
                Caterers
              </TabsTrigger>
            </TabsList>
            <TabsContent value="spaces" className="space-y-4 p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Features</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spaces.map((space) => (
                    <TableRow key={space.name}>
                      <TableCell className="font-medium text-olive-900">{space.name}</TableCell>
                      <TableCell>{space.capacity}</TableCell>
                      <TableCell>{space.features}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="rooms" className="space-y-4 p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Building</TableHead>
                    <TableHead>Beds</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.name}>
                      <TableCell className="font-medium text-olive-900">{room.name}</TableCell>
                      <TableCell>{room.building}</TableCell>
                      <TableCell>{room.beds}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="menu" className="space-y-4 p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Menu item</TableHead>
                    <TableHead>Allergens</TableHead>
                    <TableHead className="w-60">Default caterer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuItems.map((item) => (
                    <TableRow key={item.label}>
                      <TableCell className="font-medium text-olive-900">{item.label}</TableCell>
                      <TableCell>{item.allergens}</TableCell>
                      <TableCell>
                        <Combobox
                          value={defaultCaterers[item.label] ?? null}
                          onChange={(next) =>
                            setDefaultCaterers((prev) => ({
                              ...prev,
                              [item.label]: next ?? "",
                            }))
                          }
                          options={catererOptions}
                          placeholder="Assign caterer"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="caterers" className="space-y-4 p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {caterers.map((caterer) => (
                    <TableRow key={caterer.name}>
                      <TableCell className="font-medium text-olive-900">{caterer.name}</TableCell>
                      <TableCell>{caterer.contact}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
