import { StaffRosteringTabs } from "./_components/staff-rostering-tabs";

export default function StaffRosteringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Roster</h2>
        <p className="mt-1 text-sm text-gray-500">
          View shifts, log timesheets, and manage leave.
        </p>
      </div>
      <StaffRosteringTabs />
      {children}
    </div>
  );
}
