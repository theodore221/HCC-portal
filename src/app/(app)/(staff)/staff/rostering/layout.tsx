import { StaffRosteringTabs } from "./_components/staff-rostering-tabs";

export default function StaffRosteringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <StaffRosteringTabs />
      {children}
    </div>
  );
}
