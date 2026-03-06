export const ROOM_DISPLAY_NAMES: Record<string, string> = {
  'Single Bed': 'Single Bed',
  'Double Bed': 'Double Bed',
  'Double Bed + Ensuite': 'Ensuite',
  'Double Bed + Ensuite + Priv Study': 'Ensuite + Private Study',
};

export const ROOM_DISPLAY_DESCRIPTIONS: Record<string, string> = {
  'Single Bed': 'Single bed accommodation',
  'Double Bed': 'Double bed accommodation',
  'Double Bed + Ensuite': 'Double bed with attached toilet',
  'Double Bed + Ensuite + Priv Study': 'Double bed with ensuite and private study room',
};

/**
 * Format an array of ISO date strings into a compact human-readable string,
 * collapsing consecutive runs into ranges (e.g. "12–14 Mar") while keeping
 * gaps explicit (e.g. "12 Mar, 15–16 Mar").
 */
export function formatDateRanges(isoDates: string[]): string {
  if (isoDates.length === 0) return '';

  const sorted = [...isoDates].sort();
  const dates = sorted.map((d) => new Date(d + 'T00:00:00'));

  // Group into consecutive runs
  const runs: Date[][] = [];
  let current: Date[] = [dates[0]];
  for (let i = 1; i < dates.length; i++) {
    const diffDays = Math.round(
      (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      current.push(dates[i]);
    } else {
      runs.push(current);
      current = [dates[i]];
    }
  }
  runs.push(current);

  return runs
    .map((run) => {
      const first = run[0];
      const last = run[run.length - 1];
      const firstDay = first.getDate();
      const lastDay = last.getDate();
      const firstMonth = first.toLocaleDateString('en-AU', { month: 'short' });
      const lastMonth = last.toLocaleDateString('en-AU', { month: 'short' });

      if (run.length === 1) return `${firstDay} ${firstMonth}`;
      if (firstMonth === lastMonth) return `${firstDay}–${lastDay} ${firstMonth}`;
      return `${firstDay} ${firstMonth}–${lastDay} ${lastMonth}`;
    })
    .join(', ');
}

// Maps room_types.name → accommodation_requests JSONB shorthand keys
export const ROOM_NAME_TO_SHORTHAND: Record<string, string> = {
  'Single Bed': 'singleBB',
  'Double Bed': 'doubleBB',
  'Double Bed + Ensuite': 'doubleEnsuite',
  'Double Bed + Ensuite + Priv Study': 'studySuite',
};
