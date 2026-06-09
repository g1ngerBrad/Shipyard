import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
    >
      <div className="absolute inset-0 animate-[overlay-in_120ms_ease-out] bg-ink/70 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xs animate-[dialog-in_140ms_ease-out] rounded-2xl border border-ink-line bg-ink-soft p-4 shadow-2xl shadow-black/40"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-400/15 text-rose-300">
            <AlertTriangle size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
            {message && (
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {message}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-ink-line bg-ink py-2 text-sm font-semibold text-slate-300 transition-transform active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-rose-500 py-2 text-sm font-semibold text-white transition-transform active:scale-95"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
