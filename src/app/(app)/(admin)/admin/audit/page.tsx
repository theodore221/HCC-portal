import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuditTimeline } from "@/components/ui/audit-timeline";

export default function AdminAudit() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit log</CardTitle>
          <CardDescription>Track every change across the portal</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditTimeline
            events={[
              {
                id: "1",
                actor: "Amelia (Admin)",
                timestamp: new Date().toISOString(),
                description: "Approved booking HCC-2411-ALPHA",
              },
              {
                id: "2",
                actor: "Oliver (Staff)",
                timestamp: new Date().toISOString(),
                description: "Completed run sheet for 13 Nov",
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
