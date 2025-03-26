import { API_CONFIG } from '../../config';

const API_BASE_URL = API_CONFIG.baseUrl;

// Helper function to get token from localStorage
export const getToken = (): string => {
  return localStorage.getItem('token') || '';
};

// Define interfaces
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
  folderId: string | null;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  userId: string;
  createdAt: string;
}

export interface FolderPreferences {
  openFolders: string[];
}

// API methods
const api = {
  // Upload an image
  async uploadImage(file: File, folderId?: string): Promise<Image> {
    const formData = new FormData();
    formData.append('image', file);
    
    if (folderId) {
      formData.append('folderId', folderId);
    }
    
    const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    return response.json();
  },
  
  // Get all images for the current user
  async getUserImages(): Promise<Image[]> {
    const response = await fetch(`${API_BASE_URL}/api/images`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch images');
    }
    
    return response.json();
  },
  
  // Get images in a specific folder
  async getFolderImages(folderId?: string): Promise<Image[]> {
    const url = folderId 
      ? `${API_BASE_URL}/api/folders/${folderId}/images` 
      : `${API_BASE_URL}/api/images?root=true`;
      
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch folder images');
    }
    
    return response.json();
  },
  
  // Get image by identifier
  async getImageByIdentifier(identifier: string): Promise<Image> {
    const response = await fetch(`${API_BASE_URL}/api/images/${identifier}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }
    
    return response.json();
  },
  
  // Delete an image
  async deleteImage(identifier: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/images/${identifier}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete image');
    }
  },
  
  // Get image URL by identifier
  getImageUrl(identifier: string): string {
    return `${API_BASE_URL}/images/${identifier}`;
  },
  
  // Get all folders
  async getFolders(): Promise<Folder[]> {
    const response = await fetch(`${API_BASE_URL}/api/folders`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch folders');
    }
    
    return response.json();
  },
  
  // Create a new folder
  async createFolder(name: string, parentId?: string): Promise<Folder> {
    const response = await fetch(`${API_BASE_URL}/api/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ name, parentId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create folder');
    }
    
    return response.json();
  },
  
  // Rename a folder
  async renameFolder(folderId: string, newName: string): Promise<Folder> {
    const response = await fetch(`${API_BASE_URL}/api/folders/${folderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ name: newName })
    });
    
    if (!response.ok) {
      throw new Error('Failed to rename folder');
    }
    
    return response.json();
  },
  
  // Delete a folder
  async deleteFolder(folderId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/folders/${folderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete folder');
    }
  },
  
  // Move a folder
  async moveFolder(folderId: string, newParentId?: string): Promise<Folder> {
    const response = await fetch(`${API_BASE_URL}/api/folders/${folderId}/move`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ parentId: newParentId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to move folder');
    }
    
    return response.json();
  },
  
  // Move images to a folder
  async moveImagesToFolder(imageIds: string[], folderId?: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/images/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ imageIds, folderId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to move images');
    }
  },

  // Save user's folder preferences
  async saveUserFolderPreferences(preferences: FolderPreferences): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/user/preferences/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(preferences)
    });

    if (!response.ok) {
      throw new Error('Failed to save folder preferences');
    }
  },

  // Get user's folder preferences
  async getUserFolderPreferences(): Promise<FolderPreferences> {
    const response = await fetch(`${API_BASE_URL}/api/user/preferences/folders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      // Return default preferences if failed to fetch
      return { openFolders: [] };
    }

    return response.json();
  }
};

// Export the API methods
export const imageApi = {
  uploadImage: api.uploadImage,
  getUserImages: api.getUserImages,
  getFolderImages: api.getFolderImages,
  getImageByIdentifier: api.getImageByIdentifier,
  deleteImage: api.deleteImage,
  getImageUrl: api.getImageUrl,
  getFolders: api.getFolders,
  createFolder: api.createFolder,
  renameFolder: api.renameFolder,
  deleteFolder: api.deleteFolder,
  moveFolder: api.moveFolder,
  moveImagesToFolder: api.moveImagesToFolder,
  saveUserFolderPreferences: api.saveUserFolderPreferences,
  getUserFolderPreferences: api.getUserFolderPreferences
}; 