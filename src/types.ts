export const PROJECT_COLORS = [
  'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray'
] as const;

export type ProjectColor = typeof PROJECT_COLORS[number];

export const TAG_COLORS = [
  'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray', 'teal', 'brown'
] as const;

export type TagColor = typeof TAG_COLORS[number];

export interface Task {
  id: string;
  title: string;
  notes: string;
  projectId: string | null;
  dueDate: string | null;
  isToday: boolean;
  isSomeday: boolean;
  completed: boolean;
  completedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  sortOrder: number;
  tagIds: string[];
  repeat: RepeatInterval | null;
  assignedTo: string | null;
  assignedBy: string | null;
}

export interface Project {
  id: string;
  title: string;
  color: ProjectColor;
  sortOrder: number;
  createdAt: string;
  userId: string;
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface ProjectShare {
  id: string;
  projectId: string;
  sharedBy: string;
  sharedWith: string | null;
  invitedEmail: string | null;
  status: 'active' | 'invited';
  permission: 'read' | 'write';
  token: string | null;
  createdAt: string;
}

export interface Tag {
  id: string;
  title: string;
  color: TagColor;
  createdAt: string;
}

export const REPEAT_INTERVALS = [
  'daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'yearly'
] as const;

export type RepeatInterval = typeof REPEAT_INTERVALS[number];

export interface ChecklistItem {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  sortOrder: number;
  createdAt: string;
}

export type ViewType = 'inbox' | 'today' | 'someday' | 'all' | 'project' | 'assigned' | 'trash' | 'logbook';
