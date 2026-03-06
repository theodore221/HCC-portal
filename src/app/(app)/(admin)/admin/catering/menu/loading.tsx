export default function Loading() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4 animate-pulse">
      <div className="h-5 w-28 rounded bg-gray-100" />
      <div className="h-4 w-48 rounded bg-gray-100" />
      <div className="space-y-2 pt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-gray-50" />
        ))}
      </div>
    </div>
  );
}
