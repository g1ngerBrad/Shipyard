import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, FolderPlus, Plus, Trash2, X } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const projects = useProjectStore((s) => s.projects);
  const tasks = useProjectStore((s) => s.tasks);
  const addProject = useProjectStore((s) => s.addProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.get('new') === '1') {
      setShowForm(true);
      params.delete('new');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  useEffect(() => {
    if (showForm) nameRef.current?.focus();
  }, [showForm]);

  const counts = (projectId: string) => {
    const own = tasks.filter((t) => t.projectId === projectId);
    return { open: own.filter((t) => !t.completed).length, total: own.length };
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = addProject(trimmed, desc);
    setName('');
    setDesc('');
    setShowForm(false);
    navigate(`/project/${id}`);
  };

  return (
    <div>
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-slate-100">
          Projects
        </h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          aria-label="Add project"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-ink transition-transform active:scale-95"
        >
          <Plus size={20} strokeWidth={2.4} />
        </button>
      </header>

      {showForm && (
        <div className="mb-4 rounded-xl border border-ink-line bg-ink-soft p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">
              New project
            </span>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 active:scale-95"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Project name"
            className="mb-2 w-full rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Description (optional)"
            className="mb-3 w-full rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="w-full rounded-lg bg-accent py-2 text-sm font-semibold text-ink transition-transform active:scale-95 disabled:opacity-40"
          >
            Create project
          </button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center text-slate-500">
          <FolderPlus size={40} strokeWidth={1.5} className="mb-3" />
          <p className="text-sm">No projects yet.</p>
          <p className="text-xs">Tap “Add” to create your first one.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((p) => {
            const { open, total } = counts(p.id);
            return (
              <li key={p.id}>
                <div className="flex items-center gap-2 rounded-xl border border-ink-line bg-ink-soft active:scale-[0.99]">
                  <button
                    onClick={() => navigate(`/project/${p.id}`)}
                    className="flex flex-1 items-center justify-between gap-2 px-3 py-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {open} open · {total} total
                      </p>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-slate-500" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete “${p.name}” and all its tasks?`))
                        deleteProject(p.id);
                    }}
                    aria-label={`Delete ${p.name}`}
                    className="px-3 py-3 text-slate-500 active:scale-90"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}