import {
  CheckCircle2,
  FolderKanban,
  ListTodo,
  Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { GeneralStats } from '../../lib/dashboardStats';

function StatCard({
  icon: Icon,
  value,
  label,
  hint,
  tint,
}: {
  icon: LucideIcon;
  value: number | string;
  label: string;
  hint?: string;
  tint: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-ink-soft px-3 py-2.5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tint}`}
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none text-slate-100">{value}</p>
        <p className="mt-0.5 truncate text-[11px] text-slate-400">
          {label}
          {hint && <span className="text-slate-500"> · {hint}</span>}
        </p>
      </div>
    </div>
  );
}

export default function StatsOverview({ stats }: { stats: GeneralStats }) {
  const pct = Math.round(stats.completionRate * 100);
  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard
        icon={FolderKanban}
        value={stats.openProjects}
        label="Open projects"
        tint="bg-sky-400/15 text-sky-300"
      />
      <StatCard
        icon={Trophy}
        value={stats.completedProjects}
        label="Shipped"
        tint="bg-amber-400/15 text-amber-300"
      />
      <StatCard
        icon={ListTodo}
        value={stats.openTasks}
        label="Open tasks"
        tint="bg-violet-400/15 text-violet-300"
      />
      <StatCard
        icon={CheckCircle2}
        value={stats.completedTasks}
        label="Done"
        hint={stats.totalTasks > 0 ? `${pct}%` : undefined}
        tint="bg-emerald-400/15 text-emerald-300"
      />
    </div>
  );
}
