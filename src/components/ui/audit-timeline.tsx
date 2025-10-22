interface AuditItem {
  id: string;
  actor: string;
  timestamp: string;
  description: string;
}

export function AuditTimeline({ events }: { events: AuditItem[] }) {
  return (
    <ol className="relative space-y-6 border-l border-olive-200 pl-6">
      {events.map((event) => (
        <li key={event.id} className="space-y-1">
          <div className="absolute -left-2 mt-1 h-3 w-3 rounded-full bg-olive-500" />
          <p className="text-sm font-medium text-olive-900">{event.description}</p>
          <p className="text-xs text-olive-700">
            {event.actor} · {new Date(event.timestamp).toLocaleString("en-AU")}
          </p>
        </li>
      ))}
    </ol>
  );
}
