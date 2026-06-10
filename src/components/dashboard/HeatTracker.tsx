import { Flame } from 'lucide-react';
import type { HeatDay } from '../../lib/dashboardStats';

function cellClass(count: number): string {
  if (count === 0) return 'bg-ink-line/40';
  if (count <= 2) return 'bg-accent/30';
  if (count <= 4) return 'bg-accent/55';
  if (count <= 7) return 'bg-accent/75';
  return 'bg-accent';
}

export default function HeatTracker({
  heat,
  currentStreak,
}: {
  heat: HeatDay[];
  currentStreak: number;
}) {
  const total = heat.reduce((sum, d) => sum + d.count, 0);
  const first = heat[0];
  const last = heat[heat.length - 1];

  return (
    <div className="rounded-xl border border-ink-line bg-ink-soft p-3.5">
      {currentStreak > 0 && (
        <div className="mb-2.5 flex items-center">
          <span className="flex items-center gap-1 text-xs font-semibold text-orange-300">
            <Flame size={13} />
            {currentStreak}d streak
          </span>
        </div>
      )}
      <div className="flex gap-1">
        {heat.map((day) => (
          <div
            key={day.dayNumber}
            title={`${day.monthDay}: ${day.count} closed`}
            className={`aspect-square flex-1 rounded-[3px] ${cellClass(
              day.count
            )} ${day.isToday ? 'ring-1 ring-accent/70' : ''}`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
        <span>{first?.monthDay}</span>
        <span className="tabular-nums text-slate-400">
          {total} closed in 14 days
        </span>
        <span>{last?.monthDay}</span>
      </div>
    </div>
  );
}
