export type TaskType = 'Idea' | 'Feature' | 'Change' | 'Bug';

export const TASK_TYPES: TaskType[] = ['Idea', 'Feature', 'Change', 'Bug'];

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

export interface Task {
  id: string;
  projectId: string;
  type: TaskType;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}