import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Plus } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onHome = pathname === '/';

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-line bg-ink-soft/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-6 pb-safe">
        <button
          onClick={() => navigate('/')}
          aria-current={onHome ? 'page' : undefined}
          className={`flex flex-col items-center gap-0.5 text-xs transition-transform active:scale-95 ${
            onHome ? 'text-accent' : 'text-slate-400'
          }`}
        >
          <LayoutGrid size={22} strokeWidth={2.2} />
          Projects
        </button>

        <button
          onClick={() => navigate('/?new=1')}
          className="flex flex-col items-center gap-0.5 text-xs text-slate-400 transition-transform active:scale-95"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-ink">
            <Plus size={22} strokeWidth={2.6} />
          </span>
          New
        </button>
      </div>
    </nav>
  );
}