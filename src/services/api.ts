import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export interface SignupData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  newPassword: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/users/signup', data);
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/users/login', data);
    localStorage.setItem('token', response.data.token);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/users/profile');
    return response.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await api.post('/users/change-password', data);
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/users/request-reset', { email });
  },

  resetPassword: async (data: ResetPasswordData): Promise<void> => {
    await api.post('/users/reset-password', data);
  },

  logout: () => {
    localStorage.removeItem('token');
  },
}; 