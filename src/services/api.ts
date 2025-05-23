import axios from 'axios';
import { API_CONFIG } from '../config';

const API_URL = API_CONFIG.apiUrl;

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
  image1Id?: string | null;
  image2Id?: string | null;
  image3Id?: string | null;
  image4Id?: string | null;
  image5Id?: string | null;
  image6Id?: string | null;
  image7Id?: string | null;
  image8Id?: string | null;
  image9Id?: string | null;
  image10Id?: string | null;
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
  image1Id?: string | null;
  image2Id?: string | null;
  image3Id?: string | null;
  image4Id?: string | null;
  image5Id?: string | null;
  image6Id?: string | null;
  image7Id?: string | null;
  image8Id?: string | null;
  image9Id?: string | null;
  image10Id?: string | null;
}

export interface UpdateTrackData {
  name?: string;
  startBeat?: number;
  durationBeats?: number;
  image1Id?: string | null;
  image2Id?: string | null;
  image3Id?: string | null;
  image4Id?: string | null;
  image5Id?: string | null;
  image6Id?: string | null;
  image7Id?: string | null;
  image8Id?: string | null;
  image9Id?: string | null;
  image10Id?: string | null;
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
  folderId?: string | null;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string | null;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Video {
  id: string;
  identifier: string;
  filename: string;
  duration: number;
  fileSize: number;
  videoType: string;
  uploadDate: string;
  folderId: string | null;
  youtubeInfo?: {
    title: string;
    author: string;
    lengthSeconds: number;
  };
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
  uploadImage: async (file: File, folderId?: string): Promise<Image> => {
    try {
      console.log('Uploading image:', file.name);
      const formData = new FormData();
      formData.append('image', file);
      
      // Add folderId to the form data if provided
      if (folderId) {
        formData.append('folderId', folderId);
      }
      
      // Create a custom config for form data
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      };
      
      // Log token presence
      const token = localStorage.getItem('token');
      console.log('Token exists for upload:', !!token);
      
      // First try with the api instance
      try {
        console.log('Attempting upload with api instance');
        const response = await api.post<Image>(`/images/upload`, formData, config);
        console.log('Upload response:', response.data);
        return response.data;
      } catch (apiError: any) {
        console.error('API instance upload failed:', apiError);
        console.error('Error response:', apiError.response?.data);
        console.error('Error status:', apiError.response?.status);
        
        // Fall back to direct axios call with explicit token
        console.log('Trying direct axios call with explicit token');
        throw apiError; // Remove this line when testing the fallback
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
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
  
  // Get random images
  getRandomImages: async (count?: number, duplicateNth?: number): Promise<Image[]> => {
    try {
      console.log('Getting random images, count:', count, 'duplicateNth:', duplicateNth);
      let url = '/images/random';
      const params: string[] = [];
      if (count !== undefined) params.push(`count=${count}`);
      if (duplicateNth !== undefined) params.push(`duplicateNth=${duplicateNth}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      const response = await api.get<Image[]>(url);
      console.log('Random images response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get random images error:', error);
      throw error;
    }
  },
  
  // Get images in a specific folder
  getFolderImages: async (folderId?: string): Promise<Image[]> => {
    try {
      let url = '/images';
      if (folderId) {
        url = `/folders/${folderId}/images`;
      }
      
      const response = await api.get<Image[]>(url);
      return response.data;
    } catch (error) {
      console.error('Get folder images error:', error);
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
    // Return the direct URL to the image using the identifier
    return `${API_URL.replace('/api', '')}/images/${identifier}`;
  },

  getFolders: async (): Promise<Folder[]> => {
    try {
      const response = await api.get<Folder[]>('/folders');
      return response.data;
    } catch (error) {
      console.error('Get folders error:', error);
      throw error;
    }
  },

  createFolder: async (name: string, parentId?: string): Promise<Folder> => {
    try {
      const response = await api.post<Folder>('/folders', { name, parentId });
      return response.data;
    } catch (error) {
      console.error('Create folder error:', error);
      throw error;
    }
  },

  renameFolder: async (folderId: string, newName: string): Promise<Folder> => {
    try {
      const response = await api.put<Folder>(`/folders/${folderId}`, { name: newName });
      return response.data;
    } catch (error) {
      console.error('Rename folder error:', error);
      throw error;
    }
  },

  deleteFolder: async (folderId: string): Promise<void> => {
    try {
      await api.delete(`/folders/${folderId}`);
    } catch (error) {
      console.error('Delete folder error:', error);
      throw error;
    }
  },

  moveFolder: async (folderId: string, newParentId?: string): Promise<Folder> => {
    try {
      const response = await api.patch<Folder>(`/folders/${folderId}/move`, { parentId: newParentId });
      return response.data;
    } catch (error) {
      console.error('Move folder error:', error);
      throw error;
    }
  },

  moveImagesToFolder: async (imageIds: string[], folderId?: string): Promise<void> => {
    try {
      await api.post('/images/move', { imageIds, folderId });
    } catch (error) {
      console.error('Move images error:', error);
      throw error;
    }
  }
};

export const videoApi = {
  async list(folderId?: string): Promise<Video[]> {
    const url = folderId ? `/videos?folderId=${folderId}` : '/videos';
    const response = await api.get<Video[]>(url);
    return response.data;
  },

  async upload(file: File, folderId?: string): Promise<Video> {
    const formData = new FormData();
    formData.append('video', file);
    if (folderId) {
      formData.append('folderId', folderId);
    }

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    };

    const response = await api.post<Video>('/videos/upload', formData, config);
    return response.data;
  },

  async uploadGeneratedVideo(blob: Blob, filename: string): Promise<Video> {
    const formData = new FormData();
    formData.append('video', blob, filename);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    };

    const response = await api.post<Video>('/videos/upload', formData, config);
    return response.data;
  },

  async downloadFromYouTube(url: string, folderId?: string): Promise<Video> {
    const response = await api.post<Video>('/videos/youtube', { url, folderId });
    return response.data;
  },

  async delete(identifier: string): Promise<void> {
    await api.delete(`/videos/${identifier}`);
  },

  async move(identifiers: string[], folderId: string | null): Promise<void> {
    await api.post('/videos/move', { identifiers, folderId });
  },

  getVideoThumbnailUrl: (identifier: string): string => {
    return `${API_URL}/videos/${identifier}/thumbnail`;
  },

  getVideoUrl: async (identifier: string): Promise<string> => {
    const response = await api.get(`/videos/${identifier}/stream`, { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  },
};

export const segmentApi = {
  createSegment: async (data: {
    projectId: string;
    startFrame: number;
    duration: number;
    images: string[];
    draftVideo: string;
  }) => {
    // Convert images to array of { imageId }
    const images = data.images.map((id, idx) => ({ imageId: id, order: idx }));
    const payload = {
      draftVideoId: data.draftVideo,
      startFrame: data.startFrame,
      duration: data.duration,
      images,
    };
    const response = await api.post(`/segments/projects/${data.projectId}/segments`, payload);
    return response.data;
  },
  deleteSegment: async (segmentId: string) => {
    await api.delete(`/segments/${segmentId}`);
  },
  getSegmentsByProjectId: async (projectId: string) => {
    const response = await api.get(`/segments/projects/${projectId}/segments`);
    const segments = response.data;
    
    // Fetch full image details for each segment
    const segmentsWithImages = await Promise.all(segments.map(async (segment: any) => {
      const images = await Promise.all(segment.images.map(async (img: any) => {
        const imageDetails = await imageApi.getImageByIdentifier(img.imageId);
        return imageDetails;
      }));
      return {
        ...segment,
        images
      };
    }));
    
    return segmentsWithImages;
  },
  updateSegment: async (segmentId: string, data: {
    upscaleVideoId?: string;
    draftVideoId?: string;
    startFrame?: number;
    duration?: number;
    images?: { imageId: string; order?: number }[];
  }) => {
    const response = await api.patch(`/segments/${segmentId}`, data);
    return response.data;
  },
}; 