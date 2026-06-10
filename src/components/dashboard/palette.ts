import type { AttributeKey } from '../../lib/dashboardStats';
import type { AchievementCategory } from '../../lib/achievements';

export interface Accent {
  text: string;
  bar: string;
  soft: string;
  ring: string;
  glow: string;
}

export const ATTRIBUTE_ACCENTS: Record<AttributeKey, Accent> = {
  creativity: {
    text: 'text-blue-300',
    bar: 'bg-blue-400',
    soft: 'bg-blue-400/15',
    ring: 'border-blue-400/30',
    glow: 'bg-blue-400/15 text-blue-300',
  },
  execution: {
    text: 'text-emerald-300',
    bar: 'bg-emerald-400',
    soft: 'bg-emerald-400/15',
    ring: 'border-emerald-400/30',
    glow: 'bg-emerald-400/15 text-emerald-300',
  },
  craftsmanship: {
    text: 'text-amber-300',
    bar: 'bg-amber-400',
    soft: 'bg-amber-400/15',
    ring: 'border-amber-400/30',
    glow: 'bg-amber-400/15 text-amber-300',
  },
};

export const CATEGORY_ACCENTS: Record<AchievementCategory, Accent> = {
  creativity: ATTRIBUTE_ACCENTS.creativity,
  execution: ATTRIBUTE_ACCENTS.execution,
  craftsmanship: ATTRIBUTE_ACCENTS.craftsmanship,
  milestone: {
    text: 'text-sky-300',
    bar: 'bg-sky-400',
    soft: 'bg-sky-400/15',
    ring: 'border-sky-400/30',
    glow: 'bg-sky-400/15 text-sky-300',
  },
  streak: {
    text: 'text-orange-300',
    bar: 'bg-orange-400',
    soft: 'bg-orange-400/15',
    ring: 'border-orange-400/30',
    glow: 'bg-orange-400/15 text-orange-300',
  },
};
