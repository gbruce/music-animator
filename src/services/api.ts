import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export interface SignupData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  username: string;
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

export interface Track {
  id: string;
  name: string;
  startBeat: number;
  durationBeats: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  bpm: number;
  fps: number;
  duration: number;
  userId: string;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  name: string;
  bpm?: number;
  fps?: number;
  duration?: number;
}

export interface UpdateProjectData {
  name?: string;
  bpm?: number;
  fps?: number;
  duration?: number;
}

export interface CreateTrackData {
  name: string;
  startBeat?: number;
  durationBeats?: number;
}

export interface UpdateTrackData {
  name?: string;
  startBeat?: number;
  durationBeats?: number;
}

export interface Image {
  id: string;
  identifier: string;
  filePath: string;
  height: number;
  width: number;
  fileSize: number;
  imageType: string;
  uploadDate: string;
  filename: string;
  userId: string;
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

export const projectApi = {
  createProject: async (data: CreateProjectData): Promise<Project> => {
    const response = await api.post<Project>('/projects', data);
    return response.data;
  },

  getProjects: async (): Promise<Project[]> => {
    const response = await api.get<Project[]>('/projects');
    return response.data;
  },

  getProject: async (id: string): Promise<Project> => {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  updateProject: async (id: string, data: UpdateProjectData): Promise<Project> => {
    const response = await api.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};

export const trackApi = {
  createTrack: async (projectId: string, data: CreateTrackData): Promise<Track> => {
    const response = await api.post<Track>(`/projects/${projectId}/tracks`, data);
    return response.data;
  },

  getTracks: async (projectId: string): Promise<Track[]> => {
    const response = await api.get<Track[]>(`/projects/${projectId}/tracks`);
    return response.data;
  },

  getTrack: async (id: string): Promise<Track> => {
    const response = await api.get<Track>(`/tracks/${id}`);
    return response.data;
  },

  updateTrack: async (id: string, data: UpdateTrackData): Promise<Track> => {
    const response = await api.put<Track>(`/tracks/${id}`, data);
    return response.data;
  },

  deleteTrack: async (id: string): Promise<void> => {
    await api.delete(`/tracks/${id}`);
  },
};

export const imageApi = {
  uploadImage: async (file: File): Promise<Image> => {
    try {
      console.log('Uploading image:', file.name);
      const formData = new FormData();
      formData.append('image', file);
      
      // Create a custom config for form data
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      };
      
      const response = await api.post<Image>(`/images/upload`, formData, config);
      console.log('Upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },
  
  getUserImages: async (): Promise<Image[]> => {
    try {
      console.log('Getting user images');
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      const response = await api.get<Image[]>('/images');
      console.log('Images response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get images error:', error);
      throw error;
    }
  },
  
  getImageByIdentifier: async (identifier: string): Promise<Image> => {
    const response = await api.get<Image>(`/images/${identifier}`);
    return response.data;
  },
  
  deleteImage: async (identifier: string): Promise<void> => {
    await api.delete(`/images/${identifier}`);
  },
  
  getImageUrl: (identifier: string): string => {
    return `${API_URL.replace('/api', '')}/images/${identifier}`;
  }
}; 