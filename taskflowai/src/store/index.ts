import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Task, TaskFilter, AppSettings, User, CreateTaskData, UpdateTaskData } from '../types';
import { apiService } from '../services/api';

interface TaskState {
  tasks: Task[];
  filteredTasks: Task[];
  filter: TaskFilter;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: CreateTaskData) => Promise<void>;
  updateTask: (id: string, updates: UpdateTaskData) => Promise<void>;
  deleteTask: (id: string) => void;
  setFilter: (filter: Partial<TaskFilter>) => void;
  clearFilter: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  applyFilters: () => void;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

interface SettingsState {
  settings: AppSettings;
  
  // Actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleTheme: () => void;
}

interface UIState {
  isSidebarOpen: boolean;
  isTaskModalOpen: boolean;
  isShareModalOpen: boolean;
  isAIChatOpen: boolean;
  selectedTaskId: string | null;
  
  // Actions
  toggleSidebar: () => void;
  openTaskModal: (taskId?: string) => void;
  closeTaskModal: () => void;
  openShareModal: (taskId: string) => void;
  closeShareModal: () => void;
  openAIChat: () => void;
  closeAIChat: () => void;
  toggleAIChat: () => void;
  setSelectedTaskId: (id: string | null) => void;
}

// Helper function to apply filters
const applyTaskFilters = (tasks: Task[], filter: TaskFilter): Task[] => {
  return tasks.filter(task => {
    // Status filter
    if (filter.status && filter.status !== 'all' && task.status !== filter.status) {
      return false;
    }
    
    // Priority filter
    if (filter.priority && filter.priority !== 'all' && task.priority !== filter.priority) {
      return false;
    }
    
    // Due date filter
    if (filter.dueDate && filter.dueDate !== 'all') {
      const now = new Date();
      const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;
      
      switch (filter.dueDate) {
        case 'today':
          if (!taskDueDate || taskDueDate.toDateString() !== now.toDateString()) {
            return false;
          }
          break;
        case 'week': {
          if (!taskDueDate) return false;
          const weekFromNow = new Date();
          weekFromNow.setDate(now.getDate() + 7);
          if (taskDueDate > weekFromNow) return false;
          break;
        }
        case 'month': {
          if (!taskDueDate) return false;
          const monthFromNow = new Date();
          monthFromNow.setMonth(now.getMonth() + 1);
          if (taskDueDate > monthFromNow) return false;
          break;
        }
        case 'overdue':
          if (!taskDueDate || taskDueDate >= now) return false;
          break;
      }
    }
    
    // Category filter
    if (filter.category && filter.category !== 'all' && task.category !== filter.category) {
      return false;
    }
    
    // Search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      if (!task.title.toLowerCase().includes(searchLower) && 
          !task.description?.toLowerCase().includes(searchLower) &&
          !task.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
        return false;
      }
    }
    
    // Assignee filter
    if (filter.assignee && filter.assignee !== 'all' && task.assignedTo !== filter.assignee) {
      return false;
    }
    
    return true;
  });
};

export const useTaskStore = create<TaskState>()(
  devtools(
    (set, get) => ({
      tasks: [],
      filteredTasks: [],
      filter: {},
      isLoading: false,
      error: null,
      
      setTasks: (tasks) => {
        set({ tasks });
        get().applyFilters();
      },
      
      addTask: async (taskData) => {
        set({ isLoading: true });
        try {
          const response = await apiService.createTask(taskData);
          if (response.success && response.data) {
            const newTask = response.data;
            const tasks = [...get().tasks, newTask];
            set({ tasks, isLoading: false });
            get().applyFilters();
          } else {
            throw new Error((response as { message?: string }).message || 'Failed to create task');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          set({ error: errorMessage, isLoading: false });
          // Re-throw the error to be caught in the component
          throw new Error(errorMessage);
        }
      },
      
      updateTask: async (id, updates) => {
        set({ isLoading: true });
        try {
          const response = await apiService.updateTask(id, updates);
          if (response.success && response.data) {
            const updatedTask = response.data;
            const tasks = get().tasks.map(task =>
              task._id === id ? updatedTask : task
            );
            set({ tasks, isLoading: false });
            get().applyFilters();
          } else {
            throw new Error((response as { message?: string }).message || 'Failed to update task');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },
      
      deleteTask: (id) => {
        const tasks = get().tasks.filter(task => task._id !== id);
        set({ tasks });
        get().applyFilters();
      },
      
      setFilter: (filter) => {
        set({ filter: { ...get().filter, ...filter } });
        get().applyFilters();
      },
      
      clearFilter: () => {
        set({ filter: {} });
        get().applyFilters();
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      applyFilters: () => {
        const { tasks, filter } = get();
        const filteredTasks = applyTaskFilters(tasks, filter);
        set({ filteredTasks });
      },
    }),
    { name: 'task-store' }
  )
);

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
        setLoading: (isLoading) => set({ isLoading }),
        logout: () => set({ user: null, isAuthenticated: false }),
      }),
      { name: 'auth-store' }
    )
  )
);

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set, get) => ({
        settings: {
          theme: { mode: 'light' },
          notifications: {
            email: true,
            push: true,
            dueDateReminders: true,
          },
          defaultPriority: 'medium',
          defaultCategory: 'general',
        },
        
        updateSettings: (newSettings) => {
          set({ settings: { ...get().settings, ...newSettings } });
        },
        
        toggleTheme: () => {
          const currentMode = get().settings.theme.mode;
          const newMode = currentMode === 'light' ? 'dark' : 'light';
          set({
            settings: {
              ...get().settings,
              theme: { mode: newMode }
            }
          });
        },
      }),
      { name: 'settings-store' }
    )
  )
);

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      isSidebarOpen: false,
      isTaskModalOpen: false,
      isShareModalOpen: false,
      isAIChatOpen: false,
      selectedTaskId: null,
      
      toggleSidebar: () => set({ isSidebarOpen: !get().isSidebarOpen }),
      
      openTaskModal: (taskId) => set({ 
        isTaskModalOpen: true, 
        selectedTaskId: taskId || null 
      }),
      
      closeTaskModal: () => set({ 
        isTaskModalOpen: false, 
        selectedTaskId: null 
      }),
      
      openShareModal: (taskId) => set({ 
        isShareModalOpen: true, 
        selectedTaskId: taskId 
      }),
      
      closeShareModal: () => set({ 
        isShareModalOpen: false, 
        selectedTaskId: null 
      }),
      
      openAIChat: () => set({ isAIChatOpen: true }),
      closeAIChat: () => set({ isAIChatOpen: false }),
      toggleAIChat: () => set({ isAIChatOpen: !get().isAIChatOpen }),
      
      setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),
    }),
    { name: 'ui-store' }
  )
);
