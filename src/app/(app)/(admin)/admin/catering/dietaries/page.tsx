import { sbServer } from "@/lib/supabase-server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DietariesClient from "./client";

export default async function DietariesPage() {
  const supabase = await sbServer();
  const { data: labels } = await supabase
    .from("dietary_labels")
    .select("id, label, is_allergy, sort_order, active")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dietary Labels</CardTitle>
          <CardDescription>
            Configure the dietary categories shown when creating catering jobs. Labels marked as
            &quot;Allergy&quot; are shown with a warning indicator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DietariesClient labels={labels ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
