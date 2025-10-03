import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Todo, 
  TodoFile, 
  AuthResponse, 
  CreateTodoData,
  UpdateTodoData,
  RegisterData,
  LoginData
} from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
    });

    // Request interceptor → attach token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor → auto logout on 401
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ---------------- AUTH ----------------
  async register(data: RegisterData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/register', data);
    return response.data;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/login', data);
    return response.data;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const response: AxiosResponse<{ user: User }> = await this.client.get('/auth/me');
    return response.data;
  }

  async refreshToken(): Promise<{ token: string }> {
    const response: AxiosResponse<{ token: string }> = await this.client.post('/auth/refresh');
    return response.data;
  }

  // ---------------- USERS ----------------
  async getUsers(): Promise<{ users: User[] }> {
    const response: AxiosResponse<{ users: User[] }> = await this.client.get('/users');
    return response.data;
  }

  async getUser(id: string): Promise<{ user: User }> {
    const response: AxiosResponse<{ user: User }> = await this.client.get(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, data: Partial<User>): Promise<{ user: User }> {
    const response: AxiosResponse<{ user: User }> = await this.client.put(`/users/${id}`, data);
    return response.data;
  }

  async updateUserStatus(id: string, status: 'ACTIVE' | 'DISABLED'): Promise<{ user: User }> {
    const response: AxiosResponse<{ user: User }> = await this.client.patch(`/users/${id}/status`, { status });
    return response.data;
  }

  async uploadProfilePicture(id: string, file: File): Promise<{ user: User }> {
    const formData = new FormData();
    formData.append('profilePicture', file);
    const response: AxiosResponse<{ user: User }> = await this.client.post(`/users/${id}/profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // ---------------- TODOS ----------------
  async getTodos(params?: { 
    type?: string; 
    status?: string; 
    search?: string; 
    userId?: string;   // ✅ added userId
  }): Promise<{ todos: Todo[] }> {
    const response: AxiosResponse<{ todos: Todo[] }> = await this.client.get('/todos', { params });
    return response.data;
  }

  async getTodo(id: string): Promise<{ todo: Todo }> {
    const response: AxiosResponse<{ todo: Todo }> = await this.client.get(`/todos/${id}`);
    return response.data;
  }

  async createTodo(data: CreateTodoData): Promise<{ todo: Todo }> {
    const response: AxiosResponse<{ todo: Todo }> = await this.client.post('/todos', data);
    return response.data;
  }

  async updateTodo(id: string, data: UpdateTodoData): Promise<{ todo: Todo }> {
    const response: AxiosResponse<{ todo: Todo }> = await this.client.put(`/todos/${id}`, data);
    return response.data;
  }

  async deleteTodo(id: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.client.delete(`/todos/${id}`);
    return response.data;
  }

  async reorderTodos(todoUpdates: { id: string; order: number }[]): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.client.patch('/todos/reorder', { todoUpdates });
    return response.data;
  }

  async getAssignableUsers(): Promise<{ users: User[] }> {
    const response: AxiosResponse<{ users: User[] }> = await this.client.get('/todos/users/assignable');
    return response.data;
  }

  // ---------------- FILES ----------------
  async uploadFiles(todoId: string, files: File[]): Promise<{ files: TodoFile[] }> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    const response: AxiosResponse<{ files: TodoFile[] }> = await this.client.post(`/files/upload/${todoId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getFiles(): Promise<{ files: TodoFile[] }> {
    const response: AxiosResponse<{ files: TodoFile[] }> = await this.client.get('/files');
    return response.data;
  }

  async getTodoFiles(todoId: string): Promise<{ files: TodoFile[] }> {
    const response: AxiosResponse<{ files: TodoFile[] }> = await this.client.get(`/files/todo/${todoId}`);
    return response.data;
  }

  async deleteFile(id: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await this.client.delete(`/files/${id}`);
    return response.data;
  }

  getFileDownloadUrl(id: string): string {
    return `${this.client.defaults.baseURL}/files/download/${id}`;
  }
}

export const apiClient = new ApiClient();
