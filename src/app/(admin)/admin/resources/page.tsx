"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type Space = (typeof spaces)[number];
type Room = (typeof rooms)[number];
type MenuItem = (typeof menuItems)[number];
type Caterer = (typeof caterers)[number];

const spaceColumns: ColumnDef<Space>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium text-olive-900">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "capacity",
    header: "Capacity",
  },
  {
    accessorKey: "features",
    header: "Features",
    meta: {
      cellClassName: "max-w-[220px]",
    },
  },
];

const roomColumns: ColumnDef<Room>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium text-olive-900">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "building",
    header: "Building",
  },
  {
    accessorKey: "beds",
    header: "Beds",
  },
];

const catererColumns: ColumnDef<Caterer>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium text-olive-900">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "contact",
    header: "Contact",
  },
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

  const menuColumns: ColumnDef<MenuItem>[] = useMemo(
    () => [
      {
        accessorKey: "label",
        header: "Menu item",
        cell: ({ row }) => (
          <span className="font-medium text-olive-900">{row.original.label}</span>
        ),
      },
      {
        accessorKey: "allergens",
        header: "Allergens",
      },
      {
        id: "caterer",
        header: "Default caterer",
        cell: ({ row }) => (
          <Combobox
            value={defaultCaterers[row.original.label] ?? null}
            onChange={(next) =>
              setDefaultCaterers((prev) => ({
                ...prev,
                [row.original.label]: next ?? "",
              }))
            }
            options={catererOptions}
            placeholder="Assign caterer"
          />
        ),
        enableSorting: false,
        meta: {
          cellClassName: "min-w-[240px]",
        },
      },
    ],
    [catererOptions, defaultCaterers, setDefaultCaterers]
  );

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
              <DataTable
                columns={spaceColumns}
                data={spaces}
                hidePagination
                containerClassName="bg-white"
              />
            </TabsContent>
            <TabsContent value="rooms" className="space-y-4 p-6">
              <DataTable
                columns={roomColumns}
                data={rooms}
                hidePagination
                containerClassName="bg-white"
              />
            </TabsContent>
            <TabsContent value="menu" className="space-y-4 p-6">
              <DataTable
                columns={menuColumns}
                data={menuItems}
                hidePagination
                containerClassName="bg-white"
              />
            </TabsContent>
            <TabsContent value="caterers" className="space-y-4 p-6">
              <DataTable
                columns={catererColumns}
                data={caterers}
                hidePagination
                containerClassName="bg-white"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
