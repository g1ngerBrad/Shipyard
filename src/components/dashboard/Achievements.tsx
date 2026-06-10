import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Lock, Sparkles, Trophy, X } from 'lucide-react';
import type { Metrics } from '../../lib/dashboardStats';
import {
  closestToComplete,
  evaluateAchievements,
  mostRecentlyAchieved,
  type Achievement,
} from '../../lib/achievements';

type StatusFilter = 'all' | 'completed' | 'incomplete';
import { CATEGORY_ACCENTS } from './palette';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function Badge({
  achievement,
  size = 'md',
}: {
  achievement: Achievement;
  size?: 'md' | 'lg';
}) {
  const accent = CATEGORY_ACCENTS[achievement.category];
  const Icon = achievement.icon;
  const dim = !achievement.unlocked;
  const box = size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const px = size === 'lg' ? 22 : 18;
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl border ${box} ${
        dim
          ? 'border-ink-line bg-ink text-slate-600'
          : `${accent.ring} ${accent.glow}`
      }`}
    >
      <Icon size={px} />
    </span>
  );
}

function ProgressBar({ achievement }: { achievement: Achievement }) {
  const accent = CATEGORY_ACCENTS[achievement.category];
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-ink">
      <div
        className={`h-full rounded-full ${accent.bar}`}
        style={{ width: `${Math.max(3, Math.round(achievement.ratio * 100))}%` }}
      />
    </div>
  );
}

function AllAchievementsModal({
  achievements,
  unlockedCount,
  onClose,
}: {
  achievements: Achievement[];
  unlockedCount: number;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const visible = achievements.filter((a) =>
    filter === 'all' ? true : filter === 'completed' ? a.unlocked : !a.unlocked
  );

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Achievements"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <div className="absolute inset-0 animate-[overlay-in_120ms_ease-out] bg-ink/70 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[85vh] w-full max-w-md animate-[dialog-in_140ms_ease-out] flex-col rounded-t-2xl border border-ink-line bg-ink-soft shadow-2xl shadow-black/40 sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-ink-line px-4 py-3">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-300" />
            <h2 className="text-sm font-semibold text-slate-100">
              Achievements
            </h2>
            <span className="rounded bg-ink px-1.5 py-0.5 text-[11px] font-medium text-slate-400">
              {unlockedCount}/{achievements.length}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1.5 px-4 py-2.5">
          {(['all', 'completed', 'incomplete'] as StatusFilter[]).map((f) => (
            <FilterChip
              key={f}
              label={f === 'all' ? 'All' : f === 'completed' ? 'Completed' : 'Incomplete'}
              active={filter === f}
              onClick={() => setFilter(f)}
            />
          ))}
        </div>

        <ul className="flex flex-col gap-1.5 overflow-y-auto px-4 pb-4 pt-0.5">
          {visible.map((a) => (
            <li
              key={a.id}
              className={`flex items-center gap-3 rounded-xl border border-ink-line p-2.5 ${
                a.unlocked ? 'bg-ink/40' : 'bg-ink/20'
              }`}
            >
              <Badge achievement={a} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p
                    className={`truncate text-sm font-semibold ${
                      a.unlocked ? 'text-slate-100' : 'text-slate-300'
                    }`}
                  >
                    {a.name}
                  </p>
                  {!a.unlocked && (
                    <Lock size={11} className="shrink-0 text-slate-600" />
                  )}
                </div>
                <p className="truncate text-[11px] text-slate-400">
                  {a.description}
                </p>
                {!a.unlocked && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1">
                      <ProgressBar achievement={a} />
                    </div>
                    <span className="shrink-0 text-[10px] tabular-nums text-slate-500">
                      {a.current}/{a.target}
                    </span>
                  </div>
                )}
              </div>
              {a.unlocked && (
                <span className="shrink-0 text-[10px] font-medium text-slate-500">
                  {a.achievedAt ? formatDate(a.achievedAt) : 'Done'}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-transform active:scale-95 ${
        active ? 'bg-accent/15 text-accent' : 'bg-ink text-slate-400'
      }`}
    >
      {label}
    </button>
  );
}

export default function Achievements({ metrics }: { metrics: Metrics }) {
  const achievements = useMemo(
    () => evaluateAchievements(metrics),
    [metrics]
  );
  const [open, setOpen] = useState(false);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const recent = mostRecentlyAchieved(achievements);
  const next = closestToComplete(achievements);

  return (
    <div className="rounded-xl border border-ink-line bg-ink-soft p-3.5">
      <button
        onClick={() => setOpen(true)}
        className="mb-3 flex w-full items-center justify-between active:scale-[0.99]"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-200">Achievements</h2>
          <span className="rounded bg-ink px-1.5 py-0.5 text-[11px] font-medium text-slate-400">
            {unlockedCount}/{achievements.length}
          </span>
        </div>
        <span className="flex items-center text-xs font-medium text-slate-400">
          View all
          <ChevronRight size={15} className="text-slate-500" />
        </span>
      </button>

      <div className="flex flex-col gap-2">
        {recent ? (
          <div className="flex items-center gap-3 rounded-lg bg-ink/40 p-2">
            <Badge achievement={recent} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                Latest unlock
              </p>
              <p className="truncate text-sm font-semibold text-slate-100">
                {recent.name}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {recent.description}
              </p>
            </div>
            {recent.achievedAt && (
              <span className="shrink-0 text-[10px] font-medium text-slate-500">
                {formatDate(recent.achievedAt)}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg bg-ink/40 p-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-line bg-ink text-slate-600">
              <Sparkles size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-300">
                No achievements yet
              </p>
              <p className="truncate text-[11px] text-slate-400">
                Log ideas and close tasks to start earning badges.
              </p>
            </div>
          </div>
        )}

        {next && (
          <div className="flex items-center gap-3 rounded-lg bg-ink/40 p-2">
            <Badge achievement={next} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Almost there
              </p>
              <p className="truncate text-sm font-semibold text-slate-100">
                {next.name}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1">
                  <ProgressBar achievement={next} />
                </div>
                <span className="shrink-0 text-[10px] tabular-nums text-slate-500">
                  {next.current}/{next.target}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {open && (
        <AllAchievementsModal
          achievements={achievements}
          unlockedCount={unlockedCount}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
