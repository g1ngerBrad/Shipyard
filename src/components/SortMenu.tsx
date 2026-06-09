import { useEffect, useRef, useState } from 'react';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';

export interface SortOption<T extends string> {
  value: T;
  label: string;
}

export default function SortMenu<T extends string>({
  value,
  options,
  onChange,
  label = 'Sort',
}: {
  value: T;
  options: SortOption<T>[];
  onChange: (value: T) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex-1">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="flex w-full items-center gap-2 rounded-lg border border-ink-line bg-ink-soft px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors active:scale-[0.99]"
      >
        <ArrowUpDown size={14} className="shrink-0 text-slate-400" />
        <span className="flex-1 truncate text-left">{current?.label}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1.5 origin-top animate-[dialog-in_120ms_ease-out] overflow-hidden rounded-xl border border-ink-line bg-ink-soft p-1 shadow-2xl shadow-black/40"
        >
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <li key={o.value}>
                <button
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors active:scale-[0.99] ${
                    selected
                      ? 'bg-accent/15 font-semibold text-accent'
                      : 'font-medium text-slate-300 hover:bg-ink'
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {selected && <Check size={14} className="shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
