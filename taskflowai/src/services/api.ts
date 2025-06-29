import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { 
  Task, 
  CreateTaskData, 
  UpdateTaskData, 
  ShareTaskData, 
  ApiResponse, 
  PaginatedResponse,
  AIQueryResponse,
  User
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private getToken?: () => Promise<string | null>;
  
  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          if (this.getToken) {
            const token = await this.getToken();
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          }
        } catch (error) {
          console.warn('Could not get auth token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('Unauthorized request');
        }
        return Promise.reject(error);
      }
    );
  }

  // Method to set the token getter function
  setTokenGetter(getToken: () => Promise<string | null>) {
    this.getToken = getToken;
  }
  
  // Task endpoints
  async getTasks(
    page = 1, 
    limit = 20, 
    filters?: Record<string, unknown>
  ): Promise<PaginatedResponse<Task>> {
    const response: AxiosResponse<PaginatedResponse<Task>> = await this.api.get('/tasks', {
      params: { page, limit, ...filters }
    });
    return response.data;
  }
  
  async getTask(id: string): Promise<ApiResponse<Task>> {
    const response: AxiosResponse<ApiResponse<Task>> = await this.api.get(`/tasks/${id}`);
    return response.data;
  }
  
  async createTask(taskData: CreateTaskData): Promise<ApiResponse<Task>> {
    const response: AxiosResponse<ApiResponse<Task>> = await this.api.post('/tasks', taskData);
    return response.data;
  }
  
  async updateTask(id: string, updates: UpdateTaskData): Promise<ApiResponse<Task>> {
    const response: AxiosResponse<ApiResponse<Task>> = await this.api.patch(`/tasks/${id}`, updates);
    return response.data;
  }
  
  async deleteTask(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/tasks/${id}`);
    return response.data;
  }
  
  async shareTask(shareData: ShareTaskData): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.api.post('/tasks/share', shareData);
    return response.data;
  }
  
  async getSharedTasks(): Promise<ApiResponse<Task[]>> {
    const response: AxiosResponse<ApiResponse<Task[]>> = await this.api.get('/tasks/shared');
    return response.data;
  }
  
  async duplicateTask(id: string): Promise<ApiResponse<Task>> {
    const response: AxiosResponse<ApiResponse<Task>> = await this.api.post(`/tasks/${id}/duplicate`);
    return response.data;
  }
  
  async archiveTask(id: string): Promise<ApiResponse<Task>> {
    const response: AxiosResponse<ApiResponse<Task>> = await this.api.patch(`/tasks/${id}/archive`);
    return response.data;
  }
  
  async unarchiveTask(id: string): Promise<ApiResponse<Task>> {
    const response: AxiosResponse<ApiResponse<Task>> = await this.api.patch(`/tasks/${id}/unarchive`);
    return response.data;
  }
  
  // AI endpoints
  async queryAI(query: string, context?: string[]): Promise<ApiResponse<AIQueryResponse>> {
    const response: AxiosResponse<ApiResponse<AIQueryResponse>> = await this.api.post('/ai/query', {
      query,
      context
    });
    return response.data;
  }
  
  async getSuggestedTasks(): Promise<ApiResponse<Task[]>> {
    const response: AxiosResponse<ApiResponse<Task[]>> = await this.api.get('/ai/suggestions');
    return response.data;
  }
  
  // User endpoints
  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.api.get('/users/me');
    return response.data;
  }
  
  async updateProfile(profileData: Record<string, unknown>): Promise<ApiResponse<User>> {
    const response = await this.api.patch('/users/profile', profileData);
    return response.data;
  }
  
  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    const response = await this.api.get('/users/search', { params: { q: query } });
    return response.data;
  }
  
  // Analytics endpoints
  async getTaskAnalytics(): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await this.api.get('/analytics/tasks');
    return response.data;
  }
  
  async getProductivityStats(): Promise<ApiResponse<Record<string, unknown>>> {
    const response = await this.api.get('/analytics/productivity');
    return response.data;
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();

// Export specific methods for easier imports
export const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  shareTask,
  getSharedTasks,
  duplicateTask,
  archiveTask,
  unarchiveTask,
  queryAI,
  getSuggestedTasks,
  getCurrentUser,
  updateProfile,
  searchUsers,
  getTaskAnalytics,
  getProductivityStats
} = apiService;
