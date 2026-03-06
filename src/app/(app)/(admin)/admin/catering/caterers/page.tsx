import { sbServer } from "@/lib/supabase-server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CaterersClient from "./client";

export default async function CaterersPage() {
  const supabase = await sbServer();
  const { data: caterers } = await supabase.from("caterers").select("*").order("name");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Caterers</CardTitle>
          <CardDescription>Manage catering companies and their portal access</CardDescription>
        </CardHeader>
        <CardContent>
          <CaterersClient caterers={caterers ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
