import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  FolderPlus,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { PROJECT_SORTS, type ProjectSort } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import SortMenu from '../components/SortMenu';

export default function Dashboard() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const projects = useProjectStore((s) => s.projects);
  const tasks = useProjectStore((s) => s.tasks);
  const addProject = useProjectStore((s) => s.addProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const toggleProjectComplete = useProjectStore((s) => s.toggleProjectComplete);
  const projectSort = useProjectStore((s) => s.projectSort);
  const setProjectSort = useProjectStore((s) => s.setProjectSort);

  const [showCompleted, setShowCompleted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
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

  const completedCount = projects.filter((p) => p.completed).length;

  const visibleProjects = useMemo(() => {
    const openCount = (projectId: string) =>
      tasks.filter((t) => t.projectId === projectId && !t.completed).length;

    const compare = (
      a: (typeof projects)[number],
      b: (typeof projects)[number]
    ) => {
      switch (projectSort) {
        case 'updated':
          return b.updatedAt - a.updatedAt;
        case 'created-asc':
          return a.createdAt - b.createdAt;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'open-tasks':
          return openCount(b.id) - openCount(a.id);
        case 'created-desc':
        default:
          return b.createdAt - a.createdAt;
      }
    };

    return projects
      .filter((p) => showCompleted || !p.completed)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return compare(a, b);
      });
  }, [projects, tasks, projectSort, showCompleted]);

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/settings')}
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-line bg-ink-soft text-slate-300 transition-transform active:scale-95"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            aria-label="Add project"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-ink transition-transform active:scale-95"
          >
            <Plus size={20} strokeWidth={2.4} />
          </button>
        </div>
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
        <>
          <div className="mb-3 flex items-center gap-2">
            <SortMenu<ProjectSort>
              label="Sort projects"
              value={projectSort}
              options={PROJECT_SORTS}
              onChange={setProjectSort}
            />
            {completedCount > 0 && (
              <button
                onClick={() => setShowCompleted((v) => !v)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-line px-2.5 py-1.5 text-xs font-medium transition-transform active:scale-95 ${
                  showCompleted
                    ? 'bg-accent/15 text-accent'
                    : 'bg-ink-soft text-slate-400'
                }`}
                aria-pressed={showCompleted}
              >
                {showCompleted ? <Eye size={14} /> : <EyeOff size={14} />}
                Done ({completedCount})
              </button>
            )}
          </div>

          {visibleProjects.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No active projects.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {visibleProjects.map((p) => {
                const { open, total } = counts(p.id);
                return (
                  <li key={p.id}>
                    <div
                      className={`flex items-center gap-1 rounded-xl border border-ink-line bg-ink-soft active:scale-[0.99] ${
                        p.completed ? 'opacity-60' : ''
                      }`}
                    >
                      <button
                        onClick={() => navigate(`/project/${p.id}`)}
                        className="flex flex-1 items-center justify-between gap-2 px-3 py-3 text-left"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="break-words text-sm font-semibold text-slate-100">
                              {p.name}
                            </p>
                            {p.completed && (
                              <span className="shrink-0 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                                Done
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {open} open · {total} total
                          </p>
                        </div>
                        <ChevronRight
                          size={18}
                          className="shrink-0 text-slate-500"
                        />
                      </button>
                      <button
                        onClick={() => toggleProjectComplete(p.id)}
                        aria-label={
                          p.completed
                            ? `Reopen ${p.name}`
                            : `Mark ${p.name} complete`
                        }
                        className={`py-3 pl-1 active:scale-90 ${
                          p.completed ? 'text-accent' : 'text-slate-500'
                        }`}
                      >
                        {p.completed ? (
                          <RotateCcw size={16} />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          setPendingDelete({ id: p.id, name: p.name })
                        }
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
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete project?"
        message={
          pendingDelete
            ? `“${pendingDelete.name}” and all its tasks will be permanently removed.`
            : undefined
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteProject(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}