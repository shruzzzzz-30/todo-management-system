export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'DISABLED';
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  assignedToId: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  assignedTo: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  files: TodoFile[];
  _count?: {
    files: number;
  };
}

export interface TodoFile {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt: string;
  todoId: string;
  todo?: {
    id: string;
    title: string;
    status: string;
    createdBy: {
      id: string;
      name: string;
    };
    assignedTo: {
      id: string;
      name: string;
    };
  };
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ApiResponse<T = unknown> {
  message?: string;
  error?: string;
  data?: T;
  [key: string]: unknown;
}

export interface CreateTodoData {
  title: string;
  description?: string;
  assignedToId: string;
  dueDate?: string;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: string;
  order?: number;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

