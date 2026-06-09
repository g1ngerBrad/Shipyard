import { supabase } from '../lib/supabase';
import type { Project, Task, TaskType, TechStack } from '../types';
import { useAuthStore } from './useAuthStore';
import { useProjectStore } from './useProjectStore';

type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  tech_stack: TechStack | null;
  integrations: string | null;
  created_at: number;
  updated_at: number;
  completed: boolean;
  completed_at: number | null;
};

type TaskRow = {
  id: string;
  user_id: string;
  project_id: string;
  type: TaskType;
  title: string;
  completed: boolean;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
  order: number;
};

const projectToRow = (p: Project, userId: string): ProjectRow => ({
  id: p.id,
  user_id: userId,
  name: p.name,
  description: p.description ?? null,
  tech_stack: p.techStack ?? null,
  integrations: p.integrations ?? null,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
  completed: p.completed,
  completed_at: p.completedAt ?? null,
});

const rowToProject = (r: ProjectRow): Project => ({
  id: r.id,
  name: r.name,
  description: r.description ?? undefined,
  techStack: r.tech_stack ?? undefined,
  integrations: r.integrations ?? undefined,
  createdAt: Number(r.created_at),
  updatedAt: Number(r.updated_at),
  completed: r.completed,
  completedAt: r.completed_at == null ? undefined : Number(r.completed_at),
});

const taskToRow = (t: Task, userId: string): TaskRow => ({
  id: t.id,
  user_id: userId,
  project_id: t.projectId,
  type: t.type,
  title: t.title,
  completed: t.completed,
  created_at: t.createdAt,
  updated_at: t.updatedAt,
  completed_at: t.completedAt ?? null,
  order: t.order,
});

const rowToTask = (r: TaskRow): Task => ({
  id: r.id,
  projectId: r.project_id,
  type: r.type,
  title: r.title,
  completed: r.completed,
  createdAt: Number(r.created_at),
  updatedAt: Number(r.updated_at),
  completedAt: r.completed_at == null ? undefined : Number(r.completed_at),
  order: r.order,
});

const isOnline = () =>
  typeof navigator === 'undefined' || navigator.onLine;

let suspendPush = false;

async function pushLocal(userId: string): Promise<void> {
  if (!supabase) return;
  const { projects, tasks, deletedProjectIds, deletedTaskIds } =
    useProjectStore.getState();

  const uniq = (ids: string[]) => [...new Set(ids)];

  if (deletedTaskIds.length) {
    const { error } = await supabase
      .from('tl_tasks')
      .delete()
      .in('id', uniq(deletedTaskIds));
    if (error) throw error;
  }
  if (deletedProjectIds.length) {
    const { error } = await supabase
      .from('tl_projects')
      .delete()
      .in('id', uniq(deletedProjectIds));
    if (error) throw error;
  }

  if (projects.length) {
    const { error } = await supabase
      .from('tl_projects')
      .upsert(projects.map((p) => projectToRow(p, userId)));
    if (error) throw error;
  }
  if (tasks.length) {
    const { error } = await supabase
      .from('tl_tasks')
      .upsert(tasks.map((t) => taskToRow(t, userId)));
    if (error) throw error;
  }

  useProjectStore.getState().markSynced();
}

async function pullCloud(userId: string): Promise<void> {
  if (!supabase) return;
  const [projectsRes, tasksRes] = await Promise.all([
    supabase.from('tl_projects').select('*').eq('user_id', userId),
    supabase.from('tl_tasks').select('*').eq('user_id', userId),
  ]);
  if (projectsRes.error) throw projectsRes.error;
  if (tasksRes.error) throw tasksRes.error;

  suspendPush = true;
  try {
    useProjectStore
      .getState()
      .applyCloudSnapshot(
        (projectsRes.data as ProjectRow[]).map(rowToProject),
        (tasksRes.data as TaskRow[]).map(rowToTask)
      );
  } finally {
    setTimeout(() => {
      suspendPush = false;
    }, 0);
  }
}

export async function fullSync(userId: string): Promise<void> {
  if (!supabase) return;
  const auth = useAuthStore.getState();
  if (!isOnline()) {
    auth.setSyncStatus('offline');
    return;
  }
  auth.setSyncStatus('syncing');
  try {
    await pushLocal(userId);
    await pullCloud(userId);
    useAuthStore.getState().setSyncedNow(Date.now());
  } catch (e) {
    useAuthStore
      .getState()
      .setSyncStatus('error', e instanceof Error ? e.message : 'Sync failed');
  }
}

export async function syncNow(): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (userId) await fullSync(userId);
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

export function initSync(): void {
  if (!supabase) return;

  useAuthStore.subscribe((state, prev) => {
    const id = state.user?.id ?? null;
    const prevId = prev.user?.id ?? null;
    if (id === prevId) return;
    if (id) {
      void fullSync(id);
    } else {
      useAuthStore.getState().setSyncStatus('idle');
    }
  });

  useProjectStore.subscribe(() => {
    if (suspendPush) return;
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      if (!isOnline()) {
        useAuthStore.getState().setSyncStatus('offline');
        return;
      }
      useAuthStore.getState().setSyncStatus('syncing');
      try {
        await pushLocal(userId);
        useAuthStore.getState().setSyncedNow(Date.now());
      } catch (e) {
        useAuthStore
          .getState()
          .setSyncStatus(
            'error',
            e instanceof Error ? e.message : 'Sync failed'
          );
      }
    }, 1500);
  });

  if (typeof window !== 'undefined') {
    const refresh = () => void syncNow();
    window.addEventListener('online', refresh);
    window.addEventListener('focus', refresh);
  }
}
