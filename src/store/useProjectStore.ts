import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, Task, TaskType } from '../types';

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface ProjectState {
  projects: Project[];
  tasks: Task[];

  addProject: (name: string, description?: string) => string;
  deleteProject: (projectId: string) => void;

  addTask: (projectId: string, type: TaskType, title: string) => void;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;

  getProject: (projectId: string) => Project | undefined;
  getTasks: (projectId: string) => Task[];
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      tasks: [],

      addProject: (name, description) => {
        const id = uid();
        const project: Project = {
          id,
          name: name.trim(),
          description: description?.trim() || undefined,
          createdAt: Date.now(),
        };
        set((s) => ({ projects: [project, ...s.projects] }));
        return id;
      },

      deleteProject: (projectId) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== projectId),
          tasks: s.tasks.filter((t) => t.projectId !== projectId),
        })),

      addTask: (projectId, type, title) => {
        const task: Task = {
          id: uid(),
          projectId,
          type,
          title: title.trim(),
          completed: false,
          createdAt: Date.now(),
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
      },

      toggleTask: (taskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? Date.now() : undefined,
                }
              : t
          ),
        })),

      deleteTask: (taskId) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) })),

      getProject: (projectId) =>
        get().projects.find((p) => p.id === projectId),

      getTasks: (projectId) =>
        get().tasks.filter((t) => t.projectId === projectId),
    }),
    {
      name: 'project-tracker-v1',
      version: 1,
      partialize: (s) => ({ projects: s.projects, tasks: s.tasks }),
    }
  )
);