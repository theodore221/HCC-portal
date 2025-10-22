import { Card, CardHeader } from "@/components/ui/card";
import { AuditTimeline } from "@/components/ui/audit-timeline";

export default function AdminAudit() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Audit log" subtitle="Track every change across the portal" />
        <div className="mt-6">
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
        </div>
      </Card>
    </div>
  );
}
