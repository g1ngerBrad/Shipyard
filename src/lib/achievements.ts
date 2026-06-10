import {
  Award,
  Bug,
  CheckCheck,
  Crown,
  Flame,
  FolderPlus,
  Hammer,
  Lightbulb,
  Medal,
  Rocket,
  Sparkles,
  Sun,
  Target,
  Trophy,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { Metrics } from './dashboardStats';

export type AchievementCategory =
  | 'creativity'
  | 'execution'
  | 'craftsmanship'
  | 'milestone'
  | 'streak';

export const ACHIEVEMENT_CATEGORIES: {
  key: AchievementCategory;
  label: string;
}[] = [
  { key: 'creativity', label: 'Creativity' },
  { key: 'execution', label: 'Execution' },
  { key: 'craftsmanship', label: 'Craftsmanship' },
  { key: 'milestone', label: 'Milestones' },
  { key: 'streak', label: 'Streaks' },
];

type TimelineMetric =
  | 'ideasCreated'
  | 'ideasCompleted'
  | 'featuresCompleted'
  | 'bugsCompleted'
  | 'craftCompleted'
  | 'tasksCompleted'
  | 'projectsCreated'
  | 'projectsCompleted';

type ScalarMetric = 'maxStreak' | 'bestDay';

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: LucideIcon;
  target: number;
  metric: TimelineMetric | ScalarMetric;
}

export interface Achievement extends AchievementDef {
  current: number;
  unlocked: boolean;
  achievedAt?: number;
  ratio: number;
}

const SCALAR_METRICS: ScalarMetric[] = ['maxStreak', 'bestDay'];

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-spark',
    name: 'First Spark',
    description: 'Log your very first idea.',
    category: 'creativity',
    icon: Lightbulb,
    metric: 'ideasCreated',
    target: 1,
  },
  {
    id: 'daydreamer',
    name: 'Daydreamer',
    description: 'Capture 10 ideas.',
    category: 'creativity',
    icon: Sparkles,
    metric: 'ideasCreated',
    target: 10,
  },
  {
    id: 'visionary',
    name: 'Visionary',
    description: 'Validate 10 ideas by closing them out.',
    category: 'creativity',
    icon: Sun,
    metric: 'ideasCompleted',
    target: 10,
  },
  {
    id: 'mad-scientist',
    name: 'Mad Scientist',
    description: 'Log 50 ideas.',
    category: 'creativity',
    icon: Zap,
    metric: 'ideasCreated',
    target: 50,
  },
  {
    id: 'ship-it',
    name: 'Ship It',
    description: 'Ship your first feature.',
    category: 'execution',
    icon: Rocket,
    metric: 'featuresCompleted',
    target: 1,
  },
  {
    id: 'closer',
    name: 'The Closer',
    description: 'Ship 10 features.',
    category: 'execution',
    icon: CheckCheck,
    metric: 'featuresCompleted',
    target: 10,
  },
  {
    id: 'feature-machine',
    name: 'Feature Machine',
    description: 'Ship 50 features.',
    category: 'execution',
    icon: Trophy,
    metric: 'featuresCompleted',
    target: 50,
  },
  {
    id: 'first-fix',
    name: 'First Fix',
    description: 'Squash your first bug.',
    category: 'craftsmanship',
    icon: Bug,
    metric: 'bugsCompleted',
    target: 1,
  },
  {
    id: 'pest-control',
    name: 'Pest Control',
    description: 'Squash 25 bugs.',
    category: 'craftsmanship',
    icon: Wrench,
    metric: 'bugsCompleted',
    target: 25,
  },
  {
    id: 'polisher',
    name: 'The Polisher',
    description: 'Land 50 changes, bugs & tweaks.',
    category: 'craftsmanship',
    icon: Hammer,
    metric: 'craftCompleted',
    target: 50,
  },
  {
    id: 'founder',
    name: 'Founder',
    description: 'Create your first project.',
    category: 'milestone',
    icon: FolderPlus,
    metric: 'projectsCreated',
    target: 1,
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Have 5 projects on the go.',
    category: 'milestone',
    icon: Medal,
    metric: 'projectsCreated',
    target: 5,
  },
  {
    id: 'finisher',
    name: 'Finisher',
    description: 'Complete a whole project.',
    category: 'milestone',
    icon: Award,
    metric: 'projectsCompleted',
    target: 1,
  },
  {
    id: 'serial-shipper',
    name: 'Serial Shipper',
    description: 'Complete 5 projects.',
    category: 'milestone',
    icon: Crown,
    metric: 'projectsCompleted',
    target: 5,
  },
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Close out 10 tasks.',
    category: 'milestone',
    icon: Target,
    metric: 'tasksCompleted',
    target: 10,
  },
  {
    id: 'productive',
    name: 'Productive',
    description: 'Close out 100 tasks.',
    category: 'milestone',
    icon: Target,
    metric: 'tasksCompleted',
    target: 100,
  },
  {
    id: 'prolific',
    name: 'Prolific',
    description: 'Close out 500 tasks.',
    category: 'milestone',
    icon: Trophy,
    metric: 'tasksCompleted',
    target: 500,
  },
  {
    id: 'on-fire',
    name: 'On Fire',
    description: 'Close tasks 3 days in a row.',
    category: 'streak',
    icon: Flame,
    metric: 'maxStreak',
    target: 3,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Keep a 7-day closing streak.',
    category: 'streak',
    icon: Flame,
    metric: 'maxStreak',
    target: 7,
  },
  {
    id: 'big-day',
    name: 'Big Day',
    description: 'Close 10 tasks in a single day.',
    category: 'streak',
    icon: Zap,
    metric: 'bestDay',
    target: 10,
  },
];

function isScalar(metric: string): metric is ScalarMetric {
  return (SCALAR_METRICS as string[]).includes(metric);
}

export function evaluateAchievements(metrics: Metrics): Achievement[] {
  return ACHIEVEMENTS.map((def) => {
    if (isScalar(def.metric)) {
      const value = metrics[def.metric];
      const unlocked = value >= def.target;
      return {
        ...def,
        current: Math.min(value, def.target),
        unlocked,
        achievedAt: undefined,
        ratio: Math.min(1, value / def.target),
      };
    }

    const timeline = metrics[def.metric];
    const count = timeline.length;
    const unlocked = count >= def.target;
    return {
      ...def,
      current: Math.min(count, def.target),
      unlocked,
      achievedAt: unlocked ? timeline[def.target - 1] : undefined,
      ratio: Math.min(1, count / def.target),
    };
  });
}

export function mostRecentlyAchieved(items: Achievement[]): Achievement | null {
  const dated = items.filter((a) => a.unlocked && a.achievedAt !== undefined);
  if (dated.length === 0) return null;
  return dated.reduce((best, a) =>
    (a.achievedAt ?? 0) > (best.achievedAt ?? 0) ? a : best
  );
}

export function closestToComplete(items: Achievement[]): Achievement | null {
  const locked = items.filter((a) => !a.unlocked);
  if (locked.length === 0) return null;
  return locked.reduce((best, a) => (a.ratio > best.ratio ? a : best));
}
