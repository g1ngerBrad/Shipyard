import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, ProjectSort, Task, TaskType } from '../types';

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface ProjectState {
  projects: Project[];
  tasks: Task[];
  projectSort: ProjectSort;

  addProject: (name: string, description?: string) => string;
  editProject: (
    projectId: string,
    updates: { name?: string; description?: string }
  ) => void;
  deleteProject: (projectId: string) => void;
  toggleProjectComplete: (projectId: string) => void;
  setProjectSort: (sort: ProjectSort) => void;

  addTask: (projectId: string, type: TaskType, title: string) => void;
  toggleTask: (taskId: string) => void;
  editTask: (taskId: string, updates: { title?: string; type?: TaskType }) => void;
  deleteTask: (taskId: string) => void;
  /** Persist a new manual order for the given visible task ids within a project. */
  reorderTasks: (projectId: string, orderedIds: string[]) => void;

  getProject: (projectId: string) => Project | undefined;
  getTasks: (projectId: string) => Task[];
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => {
      /** Bump a project's updatedAt to the given timestamp. */
      const touchProject = (projects: Project[], projectId: string, now: number) =>
        projects.map((p) =>
          p.id === projectId ? { ...p, updatedAt: now } : p
        );

      return {
        projects: [],
        tasks: [],
        projectSort: 'created-desc',

        addProject: (name, description) => {
          const id = uid();
          const now = Date.now();
          const project: Project = {
            id,
            name: name.trim(),
            description: description?.trim() || undefined,
            createdAt: now,
            updatedAt: now,
            completed: false,
          };
          set((s) => ({ projects: [project, ...s.projects] }));
          return id;
        },

        editProject: (projectId, updates) =>
          set((s) => {
            const now = Date.now();
            return {
              projects: s.projects.map((p) =>
                p.id === projectId
                  ? {
                      ...p,
                      ...(updates.name !== undefined && {
                        name: updates.name.trim() || p.name,
                      }),
                      ...(updates.description !== undefined && {
                        description: updates.description.trim() || undefined,
                      }),
                      updatedAt: now,
                    }
                  : p
              ),
            };
          }),

        deleteProject: (projectId) =>
          set((s) => ({
            projects: s.projects.filter((p) => p.id !== projectId),
            tasks: s.tasks.filter((t) => t.projectId !== projectId),
          })),

        toggleProjectComplete: (projectId) =>
          set((s) => {
            const now = Date.now();
            return {
              projects: s.projects.map((p) =>
                p.id === projectId
                  ? {
                      ...p,
                      completed: !p.completed,
                      completedAt: !p.completed ? now : undefined,
                      updatedAt: now,
                    }
                  : p
              ),
            };
          }),

        setProjectSort: (sort) => set({ projectSort: sort }),

        addTask: (projectId, type, title) => {
          const now = Date.now();
          set((s) => {
            const minOrder = s.tasks
              .filter((t) => t.projectId === projectId)
              .reduce((min, t) => Math.min(min, t.order), 0);
            const task: Task = {
              id: uid(),
              projectId,
              type,
              title: title.trim(),
              completed: false,
              createdAt: now,
              order: minOrder - 1,
            };
            return {
              tasks: [task, ...s.tasks],
              projects: touchProject(s.projects, projectId, now),
            };
          });
        },

        toggleTask: (taskId) =>
          set((s) => {
            const target = s.tasks.find((t) => t.id === taskId);
            const now = Date.now();
            return {
              tasks: s.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      completed: !t.completed,
                      completedAt: !t.completed ? now : undefined,
                    }
                  : t
              ),
              projects: target
                ? touchProject(s.projects, target.projectId, now)
                : s.projects,
            };
          }),

        editTask: (taskId, updates) =>
          set((s) => {
            const target = s.tasks.find((t) => t.id === taskId);
            const now = Date.now();
            return {
              tasks: s.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      ...(updates.type !== undefined && { type: updates.type }),
                      ...(updates.title !== undefined && {
                        title: updates.title.trim() || t.title,
                      }),
                    }
                  : t
              ),
              projects: target
                ? touchProject(s.projects, target.projectId, now)
                : s.projects,
            };
          }),

        deleteTask: (taskId) =>
          set((s) => {
            const target = s.tasks.find((t) => t.id === taskId);
            const now = Date.now();
            return {
              tasks: s.tasks.filter((t) => t.id !== taskId),
              projects: target
                ? touchProject(s.projects, target.projectId, now)
                : s.projects,
            };
          }),

        reorderTasks: (projectId, orderedIds) =>
          set((s) => {
            // Reassign only the order "slots" the moved tasks already occupied,
            // so tasks hidden by a filter keep their relative positions.
            const slots = orderedIds
              .map((id) => s.tasks.find((t) => t.id === id)?.order)
              .filter((o): o is number => o !== undefined)
              .sort((a, b) => a - b);
            const newOrder = new Map<string, number>();
            orderedIds.forEach((id, i) => {
              if (slots[i] !== undefined) newOrder.set(id, slots[i]);
            });
            return {
              tasks: s.tasks.map((t) =>
                newOrder.has(t.id) ? { ...t, order: newOrder.get(t.id)! } : t
              ),
              projects: touchProject(s.projects, projectId, Date.now()),
            };
          }),

        getProject: (projectId) =>
          get().projects.find((p) => p.id === projectId),

        getTasks: (projectId) =>
          get().tasks.filter((t) => t.projectId === projectId),
      };
    },
    {
      name: 'project-tracker-v1',
      version: 2,
      partialize: (s) => ({
        projects: s.projects,
        tasks: s.tasks,
        projectSort: s.projectSort,
      }),
      migrate: (persisted, version) => {
        const state = persisted as Partial<ProjectState> | undefined;
        if (!state) return persisted as ProjectState;
        if (version < 2) {
          const projects = (state.projects ?? []).map((p) => ({
            ...p,
            updatedAt: p.updatedAt ?? p.createdAt,
            completed: p.completed ?? false,
          }));
          // Backfill manual order per project, preserving the existing
          // newest-first array order (index 0 = top).
          const seen: Record<string, number> = {};
          const tasks = (state.tasks ?? []).map((t) => {
            const idx = seen[t.projectId] ?? 0;
            seen[t.projectId] = idx + 1;
            return { ...t, order: t.order ?? idx };
          });
          return {
            ...state,
            projects,
            tasks,
            projectSort: state.projectSort ?? 'created-desc',
          } as ProjectState;
        }
        return state as ProjectState;
      },
    }
  )
);