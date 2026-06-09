import { useMemo, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronLeft,
  Circle,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { TASK_TYPES, type Task, type TaskType } from '../types';

type Filter = 'All' | TaskType;
const FILTERS: Filter[] = ['All', 'Idea', 'Feature', 'Change', 'Bug'];

const TYPE_STYLES: Record<TaskType, string> = {
  Idea: 'bg-amber-400/15 text-amber-300',
  Feature: 'bg-sky-400/15 text-sky-300',
  Change: 'bg-violet-400/15 text-violet-300',
  Bug: 'bg-rose-400/15 text-rose-300',
};

export default function ProjectDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const tasks = useProjectStore((s) => s.tasks);
  const addTask = useProjectStore((s) => s.addTask);
  const toggleTask = useProjectStore((s) => s.toggleTask);
  const deleteTask = useProjectStore((s) => s.deleteTask);
  const deleteProject = useProjectStore((s) => s.deleteProject);

  const [title, setTitle] = useState('');
  const [newType, setNewType] = useState<TaskType>('Feature');
  const [filter, setFilter] = useState<Filter>('All');
  const [showDone, setShowDone] = useState(false);

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === id),
    [tasks, id]
  );

  const active = useMemo(
    () =>
      projectTasks.filter(
        (t) => !t.completed && (filter === 'All' || t.type === filter)
      ),
    [projectTasks, filter]
  );

  const done = useMemo(
    () => projectTasks.filter((t) => t.completed),
    [projectTasks]
  );

  if (!project) return <Navigate to="/" replace />;

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask(id, newType, trimmed);
    setTitle('');
  };

  return (
    <div>
      <header className="mb-3 flex items-center gap-1">
        <button
          onClick={() => navigate('/')}
          aria-label="Back"
          className="-ml-1 p-1 text-slate-300 active:scale-90"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight text-slate-100">
            {project.name}
          </h1>
          {project.description && (
            <p className="truncate text-xs text-slate-400">
              {project.description}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            if (confirm(`Delete “${project.name}” and all its tasks?`)) {
              deleteProject(id);
              navigate('/', { replace: true });
            }
          }}
          aria-label="Delete project"
          className="p-1 text-slate-500 active:scale-90"
        >
          <Trash2 size={18} />
        </button>
      </header>

      <div className="mb-3 rounded-xl border border-ink-line bg-ink-soft p-2.5">
        <div className="mb-2 flex gap-1">
          {TASK_TYPES.map((t) => (
            <button
              key={t}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setNewType(t)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-transform active:scale-95 ${
                newType === t ? TYPE_STYLES[t] : 'bg-ink text-slate-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={`Add ${newType.toLowerCase()}…`}
            className="min-w-0 flex-1 rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={submit}
            disabled={!title.trim()}
            aria-label="Add task"
            className="flex w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-ink transition-transform active:scale-95 disabled:opacity-40"
          >
            <Plus size={20} strokeWidth={2.6} />
          </button>
        </div>
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-transform active:scale-95 ${
              filter === f ? 'bg-slate-100 text-ink' : 'bg-ink-soft text-slate-400'
            }`}
          >
            {f === 'All' ? 'All' : `${f}s`}
          </button>
        ))}
      </div>

      {active.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Nothing open here.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {active.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onToggle={() => toggleTask(t.id)}
              onDelete={() => deleteTask(t.id)}
            />
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <div className="mt-5">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowDone((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg bg-ink-soft px-3 py-2 text-sm text-slate-300 active:scale-[0.99]"
          >
            <span className="font-medium">Completed ({done.length})</span>
            <ChevronDown
              size={18}
              className={`transition-transform ${showDone ? 'rotate-180' : ''}`}
            />
          </button>
          {showDone && (
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {done.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onToggle={() => toggleTask(t.id)}
                  onDelete={() => deleteTask(t.id)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-ink-soft px-3 py-2.5">
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={onToggle}
        aria-label={task.completed ? 'Mark as open' : 'Mark as done'}
        className="-m-1.5 shrink-0 p-1.5 active:scale-90"
      >
        {task.completed ? (
          <CheckCircle2 size={28} className="text-accent" />
        ) : (
          <Circle size={28} className="text-slate-500" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm ${
            task.completed ? 'text-slate-500 line-through' : 'text-slate-100'
          }`}
        >
          {task.title}
        </p>
      </div>

      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
          TYPE_STYLES[task.type]
        }`}
      >
        {task.type}
      </span>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={onDelete}
        aria-label="Delete task"
        className="shrink-0 text-slate-600 active:scale-90"
      >
        <Trash2 size={15} />
      </button>
    </li>
  );
}