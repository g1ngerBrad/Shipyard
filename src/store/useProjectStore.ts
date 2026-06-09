import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TECH_STACK_FIELDS } from '../types';
import type { Project, ProjectSort, Task, TaskType, TechStack } from '../types';

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function cleanTechStack(ts?: TechStack): TechStack | undefined {
  if (!ts) return undefined;
  const cleaned: TechStack = {};
  for (const { key } of TECH_STACK_FIELDS) {
    const v = ts[key]?.trim();
    if (v) cleaned[key] = v;
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

interface ProjectState {
  projects: Project[];
  tasks: Task[];
  projectSort: ProjectSort;

  deletedProjectIds: string[];
  deletedTaskIds: string[];

  addProject: (
    name: string,
    description?: string,
    techStack?: TechStack
  ) => string;
  editProject: (
    projectId: string,
    updates: { name?: string; description?: string; techStack?: TechStack }
  ) => void;
  deleteProject: (projectId: string) => void;
  toggleProjectComplete: (projectId: string) => void;
  setProjectSort: (sort: ProjectSort) => void;

  addTask: (projectId: string, type: TaskType, title: string) => void;
  toggleTask: (taskId: string) => void;
  editTask: (taskId: string, updates: { title?: string; type?: TaskType }) => void;
  deleteTask: (taskId: string) => void;
  reorderTasks: (projectId: string, orderedIds: string[]) => void;

  getProject: (projectId: string) => Project | undefined;
  getTasks: (projectId: string) => Task[];

  applyCloudSnapshot: (
    cloudProjects: Project[],
    cloudTasks: Task[]
  ) => void;
  markSynced: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => {
      const touchProject = (projects: Project[], projectId: string, now: number) =>
        projects.map((p) =>
          p.id === projectId ? { ...p, updatedAt: now } : p
        );

      return {
        projects: [],
        tasks: [],
        projectSort: 'created-desc',
        deletedProjectIds: [],
        deletedTaskIds: [],

        addProject: (name, description, techStack) => {
          const id = uid();
          const now = Date.now();
          const project: Project = {
            id,
            name: name.trim(),
            description: description?.trim() || undefined,
            techStack: cleanTechStack(techStack),
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
                      ...(updates.techStack !== undefined && {
                        techStack: cleanTechStack(updates.techStack),
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
            deletedProjectIds: [...s.deletedProjectIds, projectId],
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
              updatedAt: now,
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
                      updatedAt: now,
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
                      updatedAt: now,
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
              deletedTaskIds: [...s.deletedTaskIds, taskId],
            };
          }),

        reorderTasks: (projectId, orderedIds) =>
          set((s) => {
            const slots = orderedIds
              .map((id) => s.tasks.find((t) => t.id === id)?.order)
              .filter((o): o is number => o !== undefined)
              .sort((a, b) => a - b);
            const newOrder = new Map<string, number>();
            orderedIds.forEach((id, i) => {
              if (slots[i] !== undefined) newOrder.set(id, slots[i]);
            });
            const now = Date.now();
            return {
              tasks: s.tasks.map((t) =>
                newOrder.has(t.id)
                  ? { ...t, order: newOrder.get(t.id)!, updatedAt: now }
                  : t
              ),
              projects: touchProject(s.projects, projectId, now),
            };
          }),

        getProject: (projectId) =>
          get().projects.find((p) => p.id === projectId),

        getTasks: (projectId) =>
          get().tasks.filter((t) => t.projectId === projectId),

        applyCloudSnapshot: (cloudProjects, cloudTasks) =>
          set((s) => {
            const deletedP = new Set(s.deletedProjectIds);
            const deletedT = new Set(s.deletedTaskIds);

            const merge = <T extends { id: string; updatedAt: number }>(
              local: T[],
              cloud: T[],
              tombstones: Set<string>
            ): T[] => {
              const byId = new Map(local.map((row) => [row.id, row]));
              for (const remote of cloud) {
                if (tombstones.has(remote.id)) continue;
                const existing = byId.get(remote.id);
                if (!existing || remote.updatedAt >= existing.updatedAt) {
                  byId.set(remote.id, remote);
                }
              }
              return [...byId.values()];
            };

            return {
              projects: merge(s.projects, cloudProjects, deletedP),
              tasks: merge(s.tasks, cloudTasks, deletedT),
            };
          }),

        markSynced: () => set({ deletedProjectIds: [], deletedTaskIds: [] }),
      };
    },
    {
      name: 'project-tracker-v1',
      version: 3,
      partialize: (s) => ({
        projects: s.projects,
        tasks: s.tasks,
        projectSort: s.projectSort,
        deletedProjectIds: s.deletedProjectIds,
        deletedTaskIds: s.deletedTaskIds,
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
          const seen: Record<string, number> = {};
          const tasks = (state.tasks ?? []).map((t) => {
            const idx = seen[t.projectId] ?? 0;
            seen[t.projectId] = idx + 1;
            return { ...t, order: t.order ?? idx };
          });
          state.projects = projects;
          state.tasks = tasks;
          state.projectSort = state.projectSort ?? 'created-desc';
        }
        if (version < 3) {
          state.tasks = (state.tasks ?? []).map((t) => ({
            ...t,
            updatedAt: t.updatedAt ?? t.createdAt,
          }));
          state.deletedProjectIds = state.deletedProjectIds ?? [];
          state.deletedTaskIds = state.deletedTaskIds ?? [];
        }
        return state as ProjectState;
      },
    }
  )
);
