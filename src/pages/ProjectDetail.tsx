import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Circle,
  CheckCircle2,
  GripVertical,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProjectStore } from '../store/useProjectStore';
import { TASK_TYPES, type Task, type TaskType } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';

const FILTERS: TaskType[] = ['Idea', 'Feature', 'Change', 'Bug', 'Tweak'];

const TYPE_STYLES: Record<TaskType, string> = {
  Idea: 'bg-amber-400/15 text-amber-300',
  Feature: 'bg-sky-400/15 text-sky-300',
  Change: 'bg-violet-400/15 text-violet-300',
  Bug: 'bg-rose-400/15 text-rose-300',
  Tweak: 'bg-emerald-400/15 text-emerald-300',
};

export default function ProjectDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const tasks = useProjectStore((s) => s.tasks);
  const addTask = useProjectStore((s) => s.addTask);
  const toggleTask = useProjectStore((s) => s.toggleTask);
  const editTask = useProjectStore((s) => s.editTask);
  const deleteTask = useProjectStore((s) => s.deleteTask);
  const reorderTasks = useProjectStore((s) => s.reorderTasks);
  const editProject = useProjectStore((s) => s.editProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const toggleProjectComplete = useProjectStore((s) => s.toggleProjectComplete);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    })
  );

  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [newType, setNewType] = useState<TaskType>('Feature');
  const [filters, setFilters] = useState<TaskType[]>([]);

  const toggleFilter = (f: TaskType) =>
    setFilters((cur) =>
      cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]
    );
  const [showDone, setShowDone] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftDesc, setDraftDesc] = useState('');

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === id),
    [tasks, id]
  );

  const active = useMemo(
    () =>
      projectTasks
        .filter(
          (t) =>
            !t.completed && (filters.length === 0 || filters.includes(t.type))
        )
        .sort((a, b) => a.order - b.order),
    [projectTasks, filters]
  );

  const done = useMemo(
    () =>
      projectTasks
        .filter((t) => t.completed)
        .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
    [projectTasks]
  );

  if (!project) return <Navigate to="/" replace />;

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask(id, newType, trimmed);
    setTitle('');
    const input = inputRef.current;
    input?.blur();
    requestAnimationFrame(() => input?.focus());
  };

  const startEditProject = () => {
    setDraftName(project.name);
    setDraftDesc(project.description ?? '');
    setEditingProject(true);
  };

  const saveProject = () => {
    if (!draftName.trim()) return;
    editProject(id, { name: draftName, description: draftDesc });
    setEditingProject(false);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active: dragged, over } = e;
    if (!over || dragged.id === over.id) return;
    const ids = active.map((t) => t.id);
    const from = ids.indexOf(String(dragged.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    reorderTasks(id, arrayMove(ids, from, to));
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
          <div className="flex items-center gap-1.5">
            <h1 className="truncate text-lg font-bold tracking-tight text-slate-100">
              {project.name}
            </h1>
            {project.completed && (
              <span className="shrink-0 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                Done
              </span>
            )}
          </div>
          {project.description && (
            <p className="text-xs text-slate-400">
              {project.description}
            </p>
          )}
        </div>
        <button
          onClick={startEditProject}
          aria-label="Edit project"
          title="Edit project"
          className="p-1 text-slate-500 active:scale-90"
        >
          <Pencil size={17} />
        </button>
        <button
          onClick={() => toggleProjectComplete(id)}
          aria-label={
            project.completed ? 'Reopen project' : 'Mark project complete'
          }
          title={project.completed ? 'Reopen project' : 'Mark project complete'}
          className={`p-1 active:scale-90 ${
            project.completed ? 'text-accent' : 'text-slate-500'
          }`}
        >
          {project.completed ? (
            <RotateCcw size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          aria-label="Delete project"
          className="p-1 text-slate-500 active:scale-90"
        >
          <Trash2 size={18} />
        </button>
      </header>

      {editingProject && (
        <div className="mb-3 rounded-xl border border-ink-line bg-ink-soft p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">
              Edit project
            </span>
            <button
              onClick={() => setEditingProject(false)}
              className="text-slate-400 active:scale-95"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveProject();
              if (e.key === 'Escape') setEditingProject(false);
            }}
            placeholder="Project name"
            className="mb-2 w-full rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
          <input
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveProject();
              if (e.key === 'Escape') setEditingProject(false);
            }}
            placeholder="Description (optional)"
            className="mb-3 w-full rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
          <button
            onClick={saveProject}
            disabled={!draftName.trim()}
            className="w-full rounded-lg bg-accent py-2 text-sm font-semibold text-ink transition-transform active:scale-95 disabled:opacity-40"
          >
            Save changes
          </button>
        </div>
      )}

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
            ref={inputRef}
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
            onClick={() => toggleFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-transform active:scale-95 ${
              filters.includes(f) ? TYPE_STYLES[f] : 'bg-ink-soft text-slate-400'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {active.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Nothing open here.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={active.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-1.5">
              {active.map((t) => (
                <SortableTaskRow
                  key={t.id}
                  task={t}
                  onToggle={() => toggleTask(t.id)}
                  onEdit={(updates) => editTask(t.id, updates)}
                  onDelete={() => deleteTask(t.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
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
                  onEdit={(updates) => editTask(t.id, updates)}
                  onDelete={() => deleteTask(t.id)}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete project?"
        message={`“${project.name}” and all its tasks will be permanently removed.`}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteProject(id);
          navigate('/', { replace: true });
        }}
      />
    </div>
  );
}

function SortableTaskRow(props: {
  task: Task;
  onToggle: () => void;
  onEdit: (updates: { title?: string; type?: TaskType }) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.task.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragProps = {
    ...attributes,
    ...listeners,
  } as HTMLAttributes<HTMLLIElement>;

  return (
    <TaskRow
      {...props}
      innerRef={setNodeRef}
      style={style}
      isDragging={isDragging}
      dragProps={dragProps}
    />
  );
}

function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
  innerRef,
  style,
  isDragging,
  dragProps,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: (updates: { title?: string; type?: TaskType }) => void;
  onDelete: () => void;
  innerRef?: (node: HTMLElement | null) => void;
  style?: CSSProperties;
  isDragging?: boolean;
  dragProps?: HTMLAttributes<HTMLLIElement>;
}) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftType, setDraftType] = useState<TaskType>(task.type);

  const startEdit = () => {
    setDraftTitle(task.title);
    setDraftType(task.type);
    setEditing(true);
  };

  const save = () => {
    const trimmed = draftTitle.trim();
    if (!trimmed) return;
    onEdit({ title: trimmed, type: draftType });
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  if (editing) {
    return (
      <li
        ref={innerRef}
        style={style}
        className="rounded-xl border border-ink-line bg-ink-soft p-2.5"
      >
        <div className="mb-2 flex gap-1">
          {TASK_TYPES.map((t) => (
            <button
              key={t}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setDraftType(t)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-transform active:scale-95 ${
                draftType === t ? TYPE_STYLES[t] : 'bg-ink text-slate-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') cancel();
            }}
            className="min-w-0 flex-1 rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={save}
            disabled={!draftTitle.trim()}
            aria-label="Save changes"
            className="flex w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-ink transition-transform active:scale-95 disabled:opacity-40"
          >
            <Check size={20} strokeWidth={2.6} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={cancel}
            aria-label="Cancel edit"
            className="flex w-10 shrink-0 items-center justify-center rounded-lg border border-ink-line bg-ink text-slate-300 transition-transform active:scale-95"
          >
            <X size={20} />
          </button>
        </div>
      </li>
    );
  }

  return (
    <li
      ref={innerRef}
      style={style}
      {...dragProps}
      className={`flex items-center gap-2.5 rounded-xl border border-ink-line bg-ink-soft px-3 py-2.5 ${
        dragProps ? 'cursor-grab active:cursor-grabbing' : ''
      } ${
        isDragging
          ? 'relative z-10 cursor-grabbing opacity-80 shadow-lg shadow-black/40'
          : ''
      }`}
    >
      {dragProps && (
        <GripVertical
          size={16}
          className="-ml-1 shrink-0 text-slate-600"
          aria-hidden
        />
      )}
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
          className={`break-words text-sm ${
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
        onClick={startEdit}
        aria-label="Edit task"
        className="shrink-0 text-slate-600 active:scale-90"
      >
        <Pencil size={15} />
      </button>

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