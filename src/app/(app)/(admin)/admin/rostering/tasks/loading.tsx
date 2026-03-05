export default function TasksLoading() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="size-3 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-4 w-36 rounded bg-gray-100 animate-pulse" />
            <div className="h-4 w-12 rounded-full bg-gray-100 animate-pulse" />
          </div>
          <div className="space-y-2 pl-6">
            {[1, 2].map((j) => (
              <div key={j} className="h-10 rounded-lg bg-gray-50 animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
