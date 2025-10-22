export function ConflictBanner({ issues }: { issues: string[] }) {
  if (!issues.length) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
      <p className="font-semibold">Conflicts detected</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-red-700">
        Resolve conflicts before approving to prevent double bookings.
      </p>
    </div>
  );
}
