import { RosteringTabs } from "./_components/rostering-tabs";

export default function RosteringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Rostering</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage shifts, tasks, staff records, timesheets, and leave.
        </p>
      </div>
      <RosteringTabs />
      {children}
    </div>
  );
}
