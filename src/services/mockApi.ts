import { v4 as uuidv4 } from 'uuid';
import { Image, Folder } from './api';

// Define mock data and functions

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

// Initial mock images
let mockImages: Image[] = [
  {
    id: 'image-1',
    identifier: 'img-abc123',
    filePath: '/images/beach.jpg',
    height: 1080,
    width: 1920,
    fileSize: 3500000,
    imageType: 'image/jpeg',
    uploadDate: new Date().toISOString(),
    filename: 'beach.jpg',
    userId: mockUserId,
    folderId: 'folder-2'
  },
  {
    id: 'image-2',
    identifier: 'img-def456',
    filePath: '/images/mountain.jpg',
    height: 1200,
    width: 1800,
    fileSize: 4200000,
    imageType: 'image/jpeg',
    uploadDate: new Date().toISOString(),
    filename: 'mountain.jpg',
    userId: mockUserId,
    folderId: 'folder-4'
  },
  {
    id: 'image-3',
    identifier: 'img-ghi789',
    filePath: '/images/project_diagram.png',
    height: 900,
    width: 1600, 
    fileSize: 2100000,
    imageType: 'image/png',
    uploadDate: new Date().toISOString(),
    filename: 'project_diagram.png',
    userId: mockUserId,
    folderId: 'folder-3'
  },
  {
    id: 'image-4',
    identifier: 'img-jkl012',
    filePath: '/images/profile.jpg',
    height: 800,
    width: 800,
    fileSize: 1500000,
    imageType: 'image/jpeg',
    uploadDate: new Date().toISOString(),
    filename: 'profile.jpg',
    userId: mockUserId,
    folderId: null
  }
];

// Mock API helper functions
const getMockFolders = (): Folder[] => {
  return [...mockFolders];
};

const getMockImages = (): Image[] => {
  return [...mockImages];
};

const getFolderImages = (folderId?: string): Image[] => {
  if (!folderId) {
    return mockImages.filter(image => !image.folderId);
  }
  return mockImages.filter(image => image.folderId === folderId);
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
  
  // Delete all images in these folders
  mockImages = mockImages.filter(image => !image.folderId || !allFolderIdsToDelete.includes(image.folderId));
  
  // Delete the folders
  mockFolders = mockFolders.filter(folder => !allFolderIdsToDelete.includes(folder.id));
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
  mockImages = mockImages.map(image => {
    if (imageIds.includes(image.id)) {
      return {
        ...image,
        folderId: folderId || null
      };
    }
    return image;
  });
};

const addMockImage = (file: File, folderId?: string): Image => {
  const id = 'image-' + uuidv4();
  const identifier = 'img-' + uuidv4();
  
  const newImage: Image = {
    id,
    identifier,
    filePath: `/images/${file.name}`,
    height: 1080, // Mock values
    width: 1920,
    fileSize: file.size,
    imageType: file.type,
    uploadDate: new Date().toISOString(),
    filename: file.name,
    userId: mockUserId,
    folderId: folderId || null
  };
  
  mockImages.push(newImage);
  return newImage;
};

const deleteMockImage = (identifier: string): void => {
  mockImages = mockImages.filter(image => image.identifier !== identifier);
};

const getPlaceholderImageUrl = (identifier: string): string => {
  const image = mockImages.find(img => img.identifier === identifier);
  if (!image) {
    return `https://picsum.photos/800/600`;
  }
  return `https://picsum.photos/${image.width}/${image.height}`;
};

// Mock API
const API_BASE_URL = 'http://localhost:5001';

export const mockApi = {
  // Upload an image
  async uploadImage(file: File, folderId?: string): Promise<Image> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const image = addMockImage(file, folderId);
        resolve(image);
      }, 1500);
    });
  },

  // Get all images for current user
  async getUserImages(): Promise<Image[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const images = getMockImages();
        resolve(images);
      }, 800);
    });
  },
  
  // Get images in a specific folder
  async getFolderImages(folderId?: string): Promise<Image[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const images = getFolderImages(folderId);
        resolve(images);
      }, 800);
    });
  },

  // Get image by identifier
  async getImageByIdentifier(identifier: string): Promise<Image> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const images = getMockImages();
        const image = images.find(img => img.identifier === identifier);
        
        if (image) {
          resolve(image);
        } else {
          reject(new Error('Image not found'));
        }
      }, 500);
    });
  },

  // Delete image by identifier
  async deleteImage(identifier: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        deleteMockImage(identifier);
        resolve();
      }, 700);
    });
  },

  // Get image URL
  getImageUrl(identifier: string): string {
    // For mock data, return a placeholder image URL
    return getPlaceholderImageUrl(identifier);
  },

  // Get all folders
  async getFolders(): Promise<Folder[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const folders = getMockFolders();
        resolve(folders);
      }, 600);
    });
  },

  // Create a new folder
  async createFolder(name: string, parentId?: string): Promise<Folder> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const folder = addMockFolder(name, parentId);
        resolve(folder);
      }, 800);
    });
  },

  // Rename a folder
  async renameFolder(folderId: string, newName: string): Promise<Folder> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const folder = updateMockFolder(folderId, newName);
          resolve(folder);
        } catch (error) {
          reject(error);
        }
      }, 600);
    });
  },

  // Delete a folder
  async deleteFolder(folderId: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        deleteMockFolder(folderId);
        resolve();
      }, 1000);
    });
  },

  // Move a folder
  async moveFolder(folderId: string, newParentId?: string): Promise<Folder> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const folder = moveMockFolder(folderId, newParentId);
          resolve(folder);
        } catch (error) {
          reject(error);
        }
      }, 800);
    });
  },

  // Move images to a folder
  async moveImagesToFolder(imageIds: string[], folderId?: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        moveMockImagesToFolder(imageIds, folderId);
        resolve();
      }, 1200);
    });
  }
}; 