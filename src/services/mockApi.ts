import { v4 as uuidv4 } from 'uuid';
import { imageApi, Image, Folder } from './api';

// Define mock data for folders
// Mock user ID
const mockUserId = uuidv4();

// Initial mock folders
let mockFolders: Folder[] = [
  {
    id: 'folder-1',
    name: 'Root Folder',
    parentId: null,
    userId: mockUserId,
    createdAt: new Date().toISOString()
  },
  {
    id: 'folder-2',
    name: 'Vacation Photos',
    parentId: 'folder-1',
    userId: mockUserId,
    createdAt: new Date().toISOString()
  },
  {
    id: 'folder-3',
    name: 'Work Projects',
    parentId: 'folder-1',
    userId: mockUserId,
    createdAt: new Date().toISOString()
  },
  {
    id: 'folder-4',
    name: 'Summer 2023',
    parentId: 'folder-2',
    userId: mockUserId,
    createdAt: new Date().toISOString()
  }
];

// Mock folder image associations
let imageToFolderMap: Record<string, string | null> = {};

// Mock folder operations
const getMockFolders = (): Folder[] => {
  return [...mockFolders];
};

const addMockFolder = (name: string, parentId?: string): Folder => {
  const newFolder: Folder = {
    id: 'folder-' + uuidv4(),
    name,
    parentId: parentId || null,
    userId: mockUserId,
    createdAt: new Date().toISOString()
  };
  
  mockFolders.push(newFolder);
  return newFolder;
};

const updateMockFolder = (folderId: string, newName: string): Folder => {
  const folderIndex = mockFolders.findIndex(folder => folder.id === folderId);
  
  if (folderIndex === -1) {
    throw new Error(`Folder with ID ${folderId} not found`);
  }
  
  mockFolders[folderIndex] = {
    ...mockFolders[folderIndex],
    name: newName
  };
  
  return mockFolders[folderIndex];
};

const deleteMockFolder = (folderId: string): void => {
  // Find all subfolders recursively
  const getSubfolderIds = (parentId: string | null): string[] => {
    if (!parentId) return [];
    const directSubfolders = mockFolders.filter(folder => folder.parentId === parentId);
    const directSubfolderIds = directSubfolders.map(folder => folder.id);
    const nestedSubfolderIds = directSubfolderIds.flatMap(id => getSubfolderIds(id));
    return [...directSubfolderIds, ...nestedSubfolderIds];
  };
  
  const subfolderIds = getSubfolderIds(folderId);
  const allFolderIdsToDelete = [folderId, ...subfolderIds];
  
  // Delete the folders
  mockFolders = mockFolders.filter(folder => !allFolderIdsToDelete.includes(folder.id));
  
  // Clear folder associations for images in these folders
  Object.keys(imageToFolderMap).forEach(imageId => {
    if (allFolderIdsToDelete.includes(imageToFolderMap[imageId] || '')) {
      imageToFolderMap[imageId] = null;
    }
  });
};

const moveMockFolder = (folderId: string, newParentId?: string): Folder => {
  const folderIndex = mockFolders.findIndex(folder => folder.id === folderId);
  
  if (folderIndex === -1) {
    throw new Error(`Folder with ID ${folderId} not found`);
  }
  
  // Check for circular dependencies
  if (newParentId) {
    let currentParent: string | null = newParentId;
    while (currentParent) {
      if (currentParent === folderId) {
        throw new Error('Cannot move a folder into its own subtree');
      }
      
      const parent = mockFolders.find(folder => folder.id === currentParent);
      currentParent = parent?.parentId || null;
    }
  }
  
  mockFolders[folderIndex] = {
    ...mockFolders[folderIndex],
    parentId: newParentId || null
  };
  
  return mockFolders[folderIndex];
};

const moveMockImagesToFolder = (imageIds: string[], folderId?: string): void => {
  imageIds.forEach(imageId => {
    imageToFolderMap[imageId] = folderId || null;
  });
};

// Server API - Uses real API for images, mock API for folders
export const serverApi = {
  // Upload an image
  async uploadImage(file: File, folderId?: string): Promise<Image> {
    const image = await imageApi.uploadImage(file);
    // Store folder association
    if (folderId) {
      imageToFolderMap[image.id] = folderId;
    }
    return {
      ...image,
      folderId: folderId || null
    };
  },

  // Get all images for current user
  async getUserImages(): Promise<Image[]> {
    const images = await imageApi.getUserImages();
    // Add folder associations
    return images.map(image => ({
      ...image,
      folderId: imageToFolderMap[image.id] || null
    }));
  },
  
  // Get images in a specific folder
  async getFolderImages(folderId?: string): Promise<Image[]> {
    const images = await imageApi.getUserImages();
    // Filter by folder
    return images.filter(image => {
      if (!folderId) {
        return !imageToFolderMap[image.id];
      }
      return imageToFolderMap[image.id] === folderId;
    }).map(image => ({
      ...image,
      folderId: imageToFolderMap[image.id] || null
    }));
  },

  // Get image by identifier
  async getImageByIdentifier(identifier: string): Promise<Image> {
    const image = await imageApi.getImageByIdentifier(identifier);
    return {
      ...image,
      folderId: imageToFolderMap[image.id] || null
    };
  },

  // Delete image by identifier
  async deleteImage(identifier: string): Promise<void> {
    const image = await imageApi.getImageByIdentifier(identifier);
    // Clean up folder association
    if (image && image.id) {
      delete imageToFolderMap[image.id];
    }
    return imageApi.deleteImage(identifier);
  },

  // Get image URL
  getImageUrl(identifier: string): string {
    return imageApi.getImageUrl(identifier);
  },

  // Get all folders - MOCK IMPLEMENTATION
  async getFolders(): Promise<Folder[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return getMockFolders();
  },

  // Create a new folder - MOCK IMPLEMENTATION
  async createFolder(name: string, parentId?: string): Promise<Folder> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return addMockFolder(name, parentId);
  },

  // Rename a folder - MOCK IMPLEMENTATION
  async renameFolder(folderId: string, newName: string): Promise<Folder> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    return updateMockFolder(folderId, newName);
  },

  // Delete a folder - MOCK IMPLEMENTATION
  async deleteFolder(folderId: string): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    deleteMockFolder(folderId);
  },

  // Move a folder - MOCK IMPLEMENTATION
  async moveFolder(folderId: string, newParentId?: string): Promise<Folder> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return moveMockFolder(folderId, newParentId);
  },

  // Move images to a folder - MOCK IMPLEMENTATION
  async moveImagesToFolder(imageIds: string[], folderId?: string): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    moveMockImagesToFolder(imageIds, folderId);
  }
}; 