import { useState } from 'react';
import { ChevronDown, Hammer, Info, Lightbulb, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  XP_PER_LEVEL,
  XP_WEIGHTS,
  type Attribute,
  type AttributeKey,
} from '../../lib/dashboardStats';
import { ATTRIBUTE_ACCENTS } from './palette';

const ICONS: Record<AttributeKey, LucideIcon> = {
  creativity: Lightbulb,
  execution: Rocket,
  craftsmanship: Hammer,
};

const BLURBS: Record<AttributeKey, string> = {
  creativity: 'Ideas',
  execution: 'Features',
  craftsmanship: 'Changes & bugs',
};

function AttributeRow({ attr }: { attr: Attribute }) {
  const accent = ATTRIBUTE_ACCENTS[attr.key];
  const Icon = ICONS[attr.key];
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${accent.ring} ${accent.glow}`}
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-100">
            {attr.label}
            <span className="ml-1.5 text-[11px] font-normal text-slate-500">
              {BLURBS[attr.key]}
            </span>
          </p>
          <span className={`shrink-0 text-xs font-bold ${accent.text}`}>
            Lv {attr.level}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink">
          <div
            className={`h-full rounded-full ${accent.bar} transition-[width] duration-500`}
            style={{ width: `${Math.max(4, Math.round(attr.progress * 100))}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] tabular-nums text-slate-500">
          {attr.intoLevel} / {attr.levelSpan} XP to next
        </p>
      </div>
    </div>
  );
}

const XP_RULES: { key: AttributeKey; text: string }[] = [
  {
    key: 'creativity',
    text: `+${XP_WEIGHTS.ideaCreated} XP for logging an idea, +${XP_WEIGHTS.ideaCompleted} when you validate it`,
  },
  {
    key: 'execution',
    text: `+${XP_WEIGHTS.featureCompleted} XP for every feature you ship`,
  },
  {
    key: 'craftsmanship',
    text: `+${XP_WEIGHTS.craftCompleted} XP for each change, bug, or tweak you close`,
  },
];

function HowItWorks() {
  return (
    <div className="mt-1 rounded-lg bg-ink/50 p-3 text-[11px] leading-relaxed text-slate-400">
      <p className="text-slate-300">
        Each task type levels up a different attribute as you work:
      </p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {XP_RULES.map((rule) => {
          const accent = ATTRIBUTE_ACCENTS[rule.key];
          return (
            <li key={rule.key} className="flex items-start gap-1.5">
              <span
                className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${accent.bar}`}
              />
              <span>{rule.text}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2.5 border-t border-ink-line pt-2.5">
        Levels get steeper as you climb — reaching level{' '}
        <span className="font-semibold text-slate-300">N</span> costs{' '}
        <span className="font-semibold text-slate-300">
          N × {XP_PER_LEVEL}
        </span>{' '}
        XP. So level 2 needs {XP_PER_LEVEL} XP, level 3 another{' '}
        {2 * XP_PER_LEVEL}, and so on.
      </p>
    </div>
  );
}

export default function AttributeSheet({
  attributes,
}: {
  attributes: Attribute[];
}) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="rounded-xl border border-ink-line bg-ink-soft p-3.5">
      <div className="flex flex-col gap-3.5">
        {attributes.map((attr) => (
          <AttributeRow key={attr.key} attr={attr} />
        ))}
      </div>

      <button
        onClick={() => setShowHelp((v) => !v)}
        aria-expanded={showHelp}
        className="mt-3 flex w-full items-center justify-between rounded-lg px-1 py-1 text-[11px] font-medium text-slate-400 active:scale-[0.99]"
      >
        <span className="flex items-center gap-1.5">
          <Info size={13} className="text-slate-500" />
          How XP &amp; leveling work
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform ${
            showHelp ? 'rotate-180' : ''
          }`}
        />
      </button>
      {showHelp && <HowItWorks />}
    </div>
  );
}
