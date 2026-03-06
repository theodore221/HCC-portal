import { CateringTabs } from "./_components/catering-tabs";

export default function CateringLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-0">
      <CateringTabs />
      {children}
    </div>
  );
}
