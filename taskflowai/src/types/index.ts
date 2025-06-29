export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  username?: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  owner: User; // Changed from userId: string to owner: User
  sharedWith: string[];
  tags: string[];
  assignedTo?: string;
  category?: string;
  isArchived: boolean;
}

export interface TaskFilter {
  status?: 'todo' | 'in-progress' | 'completed' | 'all';
  priority?: 'low' | 'medium' | 'high' | 'all';
  dueDate?: 'today' | 'week' | 'month' | 'overdue' | 'all' | 'this-week' | 'this-month' | 'no-due-date';
  assignee?: string | 'all';
  category?: string | 'all';
  search?: string;
  tags?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
  dueDate?: string;
  tags?: string[];
  category?: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  isArchived?: boolean;
}

export interface ShareTaskData {
  taskId: string;
  email?: string;
  username?: string;
  permissions: 'view' | 'edit';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AIQueryResponse {
  response: string;
  suggestions?: string[];
  relatedTasks?: Task[];
}

export interface Theme {
  mode: 'light' | 'dark';
}

export interface AppSettings {
  theme: Theme;
  notifications: {
    email: boolean;
    push: boolean;
    dueDateReminders: boolean;
  };
  defaultPriority: 'low' | 'medium' | 'high';
  defaultCategory: string;
}

export interface SocketEvents {
  'task:created': Task;
  'task:updated': Task;
  'task:deleted': string;
  'task:shared': { taskId: string; sharedWith: string };
  'user:online': string;
  'user:offline': string;
}
