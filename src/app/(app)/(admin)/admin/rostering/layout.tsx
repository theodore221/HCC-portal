import { RosteringTabs } from "./_components/rostering-tabs";

export default function RosteringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <RosteringTabs />
      {children}
    </div>
  );
}
