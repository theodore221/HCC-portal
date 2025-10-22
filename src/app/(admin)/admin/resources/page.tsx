import { Card, CardHeader, CardSection } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Resource registry" subtitle="Maintain spaces, rooms, menu items and caterers" />
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-olive-700">
          <Button>Add resource</Button>
          <Button variant="outline">Import from CSV</Button>
        </div>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardSection title="Spaces">
            <ul className="space-y-3 text-sm text-olive-800">
              {spaces.map((space) => (
                <li key={space.name} className="rounded-xl border border-olive-100 bg-white px-4 py-3">
                  <p className="font-semibold text-olive-900">{space.name}</p>
                  <p className="text-xs text-olive-700">Capacity {space.capacity} · {space.features}</p>
                </li>
              ))}
            </ul>
          </CardSection>
          <CardSection title="Rooms">
            <ul className="space-y-3 text-sm text-olive-800">
              {rooms.map((room) => (
                <li key={room.name} className="rounded-xl border border-olive-100 bg-white px-4 py-3">
                  <p className="font-semibold text-olive-900">{room.name}</p>
                  <p className="text-xs text-olive-700">{room.building} · {room.beds} beds</p>
                </li>
              ))}
            </ul>
          </CardSection>
        </Card>
        <Card>
          <CardSection title="Menu items">
            <ul className="space-y-3 text-sm text-olive-800">
              {menuItems.map((item) => (
                <li key={item.label} className="rounded-xl border border-olive-100 bg-white px-4 py-3">
                  <p className="font-semibold text-olive-900">{item.label}</p>
                  <p className="text-xs text-olive-700">Allergens: {item.allergens} · Default caterer {item.caterer}</p>
                </li>
              ))}
            </ul>
          </CardSection>
          <CardSection title="Caterers">
            <ul className="space-y-3 text-sm text-olive-800">
              {caterers.map((caterer) => (
                <li key={caterer.name} className="rounded-xl border border-olive-100 bg-white px-4 py-3">
                  <p className="font-semibold text-olive-900">{caterer.name}</p>
                  <p className="text-xs text-olive-700">{caterer.contact}</p>
                </li>
              ))}
            </ul>
          </CardSection>
        </Card>
      </div>
    </div>
  );
}
