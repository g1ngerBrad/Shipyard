import type { Project, Task, TaskType } from '../types';

export type AttributeKey = 'creativity' | 'execution' | 'craftsmanship';

export const ATTRIBUTE_TYPES: Record<AttributeKey, TaskType[]> = {
  creativity: ['Idea'],
  execution: ['Feature'],
  craftsmanship: ['Change', 'Bug', 'Tweak'],
};

export const XP_WEIGHTS = {
  ideaCreated: 4,
  ideaCompleted: 10,
  featureCompleted: 16,
  craftCompleted: 10,
} as const;

export const XP_PER_LEVEL = 100;

export interface GeneralStats {
  openProjects: number;
  completedProjects: number;
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface Attribute {
  key: AttributeKey;
  label: string;
  xp: number;
  level: number;
  intoLevel: number;
  levelSpan: number;
  progress: number;
}

export interface HeatDay {
  dayNumber: number;
  weekday: string;
  monthDay: string;
  count: number;
  isToday: boolean;
}

export interface Metrics {
  ideasCreated: number[];
  ideasCompleted: number[];
  featuresCompleted: number[];
  bugsCompleted: number[];
  craftCompleted: number[];
  tasksCompleted: number[];
  projectsCreated: number[];
  projectsCompleted: number[];
  maxStreak: number;
  bestDay: number;
}

export interface DashboardData {
  general: GeneralStats;
  attributes: Attribute[];
  heat: HeatDay[];
  metrics: Metrics;
  currentStreak: number;
}

const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  creativity: 'Creativity',
  execution: 'Execution',
  craftsmanship: 'Craftsmanship',
};

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dayNumber(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return Math.round(d.getTime() / 86_400_000);
}

export function levelFromXp(xp: number): {
  level: number;
  intoLevel: number;
  levelSpan: number;
  progress: number;
} {
  let level = 1;
  let remaining = Math.max(0, xp);
  let span = XP_PER_LEVEL;
  while (remaining >= span) {
    remaining -= span;
    level += 1;
    span = level * XP_PER_LEVEL;
  }
  return {
    level,
    intoLevel: remaining,
    levelSpan: span,
    progress: span > 0 ? remaining / span : 0,
  };
}

function sortedAsc(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

export function computeDashboard(
  projects: Project[],
  tasks: Task[],
  now: number = Date.now()
): DashboardData {
  const completedProjects = projects.filter((p) => p.completed).length;
  const completedTasks = tasks.filter((t) => t.completed);
  const general: GeneralStats = {
    openProjects: projects.length - completedProjects,
    completedProjects,
    totalTasks: tasks.length,
    openTasks: tasks.length - completedTasks.length,
    completedTasks: completedTasks.length,
    completionRate: tasks.length > 0 ? completedTasks.length / tasks.length : 0,
  };

  const completedOf = (...types: TaskType[]) =>
    sortedAsc(
      tasks
        .filter((t) => t.completed && types.includes(t.type))
        .map((t) => t.completedAt ?? t.updatedAt)
    );

  const ideasCreated = sortedAsc(
    tasks.filter((t) => t.type === 'Idea').map((t) => t.createdAt)
  );
  const ideasCompleted = completedOf('Idea');
  const featuresCompleted = completedOf('Feature');
  const bugsCompleted = completedOf('Bug');
  const craftCompleted = completedOf('Change', 'Bug', 'Tweak');
  const tasksCompleted = sortedAsc(
    completedTasks.map((t) => t.completedAt ?? t.updatedAt)
  );
  const projectsCreated = sortedAsc(projects.map((p) => p.createdAt));
  const projectsCompleted = sortedAsc(
    projects.filter((p) => p.completed).map((p) => p.completedAt ?? p.updatedAt)
  );

  const countByDay = new Map<number, number>();
  for (const t of completedTasks) {
    const dn = dayNumber(t.completedAt ?? t.updatedAt);
    countByDay.set(dn, (countByDay.get(dn) ?? 0) + 1);
  }

  const bestDay = countByDay.size
    ? Math.max(...countByDay.values())
    : 0;

  const activeDays = [...countByDay.keys()].sort((a, b) => a - b);
  let maxStreak = 0;
  let run = 0;
  let prev: number | null = null;
  for (const dn of activeDays) {
    run = prev !== null && dn === prev + 1 ? run + 1 : 1;
    if (run > maxStreak) maxStreak = run;
    prev = dn;
  }

  const today = dayNumber(now);
  let currentStreak = 0;
  let cursor = countByDay.has(today) ? today : today - 1;
  while (countByDay.has(cursor)) {
    currentStreak += 1;
    cursor -= 1;
  }

  const heat: HeatDay[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const dn = dayNumber(date.getTime());
    heat.push({
      dayNumber: dn,
      weekday: WEEKDAYS[date.getDay()],
      monthDay: `${date.getMonth() + 1}/${date.getDate()}`,
      count: countByDay.get(dn) ?? 0,
      isToday: i === 0,
    });
  }

  const buildAttribute = (key: AttributeKey, xp: number): Attribute => ({
    key,
    label: ATTRIBUTE_LABELS[key],
    xp,
    ...levelFromXp(xp),
  });

  const attributes: Attribute[] = [
    buildAttribute(
      'creativity',
      ideasCreated.length * XP_WEIGHTS.ideaCreated +
        ideasCompleted.length * XP_WEIGHTS.ideaCompleted
    ),
    buildAttribute(
      'execution',
      featuresCompleted.length * XP_WEIGHTS.featureCompleted
    ),
    buildAttribute(
      'craftsmanship',
      craftCompleted.length * XP_WEIGHTS.craftCompleted
    ),
  ];

  return {
    general,
    attributes,
    heat,
    currentStreak,
    metrics: {
      ideasCreated,
      ideasCompleted,
      featuresCompleted,
      bugsCompleted,
      craftCompleted,
      tasksCompleted,
      projectsCreated,
      projectsCompleted,
      maxStreak,
      bestDay,
    },
  };
}
