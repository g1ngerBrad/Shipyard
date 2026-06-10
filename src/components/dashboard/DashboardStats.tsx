import { useMemo, type ReactNode } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { computeDashboard } from '../../lib/dashboardStats';
import StatsOverview from './StatsOverview';
import HeatTracker from './HeatTracker';

export default function DashboardStats({ children }: { children: ReactNode }) {
  const projects = useProjectStore((s) => s.projects);
  const tasks = useProjectStore((s) => s.tasks);

  const data = useMemo(
    () => computeDashboard(projects, tasks),
    [projects, tasks]
  );

  return (
    <>
      <StatsOverview stats={data.general} />

      <div className="my-5">
        <HeatTracker heat={data.heat} currentStreak={data.currentStreak} />
      </div>

      {children}
    </>
  );
}
