export type TaskType = 'Idea' | 'Feature' | 'Change' | 'Bug' | 'Tweak';

export const TASK_TYPES: TaskType[] = ['Idea', 'Feature', 'Change', 'Bug', 'Tweak'];

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  completed: boolean;
  completedAt?: number;
}

export interface Task {
  id: string;
  projectId: string;
  type: TaskType;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  /** Manual sort position within a project (ascending = top). */
  order: number;
}

export type ProjectSort =
  | 'updated'
  | 'created-desc'
  | 'created-asc'
  | 'name'
  | 'open-tasks';

export const PROJECT_SORTS: { value: ProjectSort; label: string }[] = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'created-desc', label: 'Newest first' },
  { value: 'created-asc', label: 'Oldest first' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'open-tasks', label: 'Most open tasks' },
];