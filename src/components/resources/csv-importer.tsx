"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { bulkUpdateResources } from "@/app/(app)/(admin)/admin/resources/actions";

export function CsvImporter() {
  const [isOpen, setIsOpen] = useState(false);
  const [resourceType, setResourceType] = useState<"menu_items" | "spaces">(
    "menu_items"
  );
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDownloadTemplate = () => {
    let csvContent = "";
    if (resourceType === "menu_items") {
      csvContent =
        "Label,Meal Type,Allergens,Default Caterer\nRoast Chicken,Dinner,Gluten,HCC Kitchen\nVegan Curry,Lunch,Nuts,Bella Catering";
    } else {
      csvContent =
        "Name,Capacity,Price,Features\nCorbett Room,80,100.00,AV\nDining Hall,150,200.00,Buffet line";
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resourceType}_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    const text = await file.text();
    const rows = text.split("\n").map((row) => row.split(","));
    const headers = rows[0].map((h) => h.trim());
    const data = rows
      .slice(1)
      .filter((r) => r.length === headers.length)
      .map((row) => {
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = row[i]?.trim();
        });
        return obj;
      });

    try {
      await bulkUpdateResources(resourceType, data);
      setIsOpen(false);
      setFile(null);
      toast({ title: "Import successful" });
    } catch (error) {
      console.error(error);
      toast({ title: "Import failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import from CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Resources</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk update resources. Download the template
            first to ensure correct format.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Resource Type</Label>
            <Select
              value={resourceType}
              onValueChange={(val: any) => setResourceType(val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="menu_items">Menu Items</SelectItem>
                <SelectItem value="spaces">Spaces</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>
          <div className="grid gap-2">
            <Label>CSV File</Label>
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleUpload} disabled={!file || isLoading}>
            {isLoading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
