import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Image, Folder } from '../services/api';
import { serverApi } from '../services/mockApi';
import { useAuth } from './AuthContext';

interface ImageContextType {
  images: Image[];
  folders: Folder[];
  currentFolder: string | null;
  loading: boolean;
  error: string | null;
  fetchImages: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  uploadImage: (file: File, folderId?: string) => Promise<Image>;
  deleteImage: (identifier: string) => Promise<void>;
  setCurrentFolder: (folderId: string | null) => void;
  createFolder: (name: string, parentId?: string) => Promise<Folder>;
  renameFolder: (folderId: string, newName: string) => Promise<Folder>;
  deleteFolder: (folderId: string) => Promise<void>;
  moveFolder: (folderId: string, newParentId?: string) => Promise<Folder>;
  moveImagesToFolder: (imageIds: string[], folderId?: string) => Promise<void>;
  getFolderImages: (folderId?: string) => Promise<Image[]>;
  getCurrentFolderImages: () => Image[];
  getBreadcrumbPath: (folderId: string | null) => Folder[];
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export const ImageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [images, setImages] = useState<Image[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedImages = await serverApi.getUserImages();
      setImages(fetchedImages);
    } catch (err: any) {
      console.error('Failed to fetch images:', err);
      setError(err.message || 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchFolders = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedFolders = await serverApi.getFolders();
      setFolders(fetchedFolders);
    } catch (err: any) {
      console.error('Failed to fetch folders:', err);
      setError(err.message || 'Failed to fetch folders');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const uploadImage = useCallback(async (file: File, folderId?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const targetFolderId = folderId !== undefined 
        ? folderId 
        : (currentFolder !== null ? currentFolder : undefined);
        
      const uploadedImage = await serverApi.uploadImage(file, targetFolderId);
      setImages(prevImages => [...prevImages, uploadedImage]);
      return uploadedImage;
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      setError(err.message || 'Failed to upload image');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, currentFolder]);

  const deleteImage = useCallback(async (identifier: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      await serverApi.deleteImage(identifier);
      setImages(prevImages => prevImages.filter(img => img.identifier !== identifier));
    } catch (err: any) {
      console.error('Failed to delete image:', err);
      setError(err.message || 'Failed to delete image');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createFolder = useCallback(async (name: string, parentId?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const folderParentId = parentId !== undefined 
        ? parentId 
        : (currentFolder !== null ? currentFolder : undefined);
        
      const newFolder = await serverApi.createFolder(name, folderParentId);
      setFolders(prevFolders => [...prevFolders, newFolder]);
      return newFolder;
    } catch (err: any) {
      console.error('Failed to create folder:', err);
      setError(err.message || 'Failed to create folder');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, currentFolder]);

  const renameFolder = useCallback(async (folderId: string, newName: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedFolder = await serverApi.renameFolder(folderId, newName);
      setFolders(prevFolders => 
        prevFolders.map(folder => 
          folder.id === folderId ? updatedFolder : folder
        )
      );
      return updatedFolder;
    } catch (err: any) {
      console.error('Failed to rename folder:', err);
      setError(err.message || 'Failed to rename folder');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deleteFolder = useCallback(async (folderId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      await serverApi.deleteFolder(folderId);
      
      // Update current folder if it was deleted
      if (currentFolder === folderId) {
        const deletedFolder = folders.find(f => f.id === folderId);
        const parentFolder = deletedFolder?.parentId || null;
        setCurrentFolder(parentFolder);
      }
      
      // Update folders list
      setFolders(prevFolders => {
        // Get all subfolders to remove recursively
        const getSubfolderIds = (parentId: string): string[] => {
          const directSubfolders = prevFolders.filter(folder => folder.parentId === parentId);
          const directSubfolderIds = directSubfolders.map(folder => folder.id);
          const nestedSubfolderIds = directSubfolderIds.flatMap(id => getSubfolderIds(id));
          return [...directSubfolderIds, ...nestedSubfolderIds];
        };
        
        const subfolderIds = getSubfolderIds(folderId);
        const allFolderIdsToDelete = [folderId, ...subfolderIds];
        
        return prevFolders.filter(folder => !allFolderIdsToDelete.includes(folder.id));
      });
      
      // Update images list
      fetchImages();
    } catch (err: any) {
      console.error('Failed to delete folder:', err);
      setError(err.message || 'Failed to delete folder');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, folders, currentFolder, fetchImages]);

  const moveFolder = useCallback(async (folderId: string, newParentId?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedFolder = await serverApi.moveFolder(folderId, newParentId);
      setFolders(prevFolders => 
        prevFolders.map(folder => 
          folder.id === folderId ? updatedFolder : folder
        )
      );
      return updatedFolder;
    } catch (err: any) {
      console.error('Failed to move folder:', err);
      setError(err.message || 'Failed to move folder');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const moveImagesToFolder = useCallback(async (imageIds: string[], folderId?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      await serverApi.moveImagesToFolder(imageIds, folderId);
      
      // Update local images data through refetch
      fetchImages();
    } catch (err: any) {
      console.error('Failed to move images:', err);
      setError(err.message || 'Failed to move images');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, fetchImages]);

  const getFolderImages = useCallback(async (folderId?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const folderImages = await serverApi.getFolderImages(folderId);
      return folderImages;
    } catch (err: any) {
      console.error('Failed to get folder images:', err);
      setError(err.message || 'Failed to get folder images');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get images for the current folder only
  const getCurrentFolderImages = useCallback(() => {
    if (!currentFolder) {
      return images.filter(image => !image.folderId);
    }
    return images.filter(image => image.folderId === currentFolder);
  }, [images, currentFolder]);

  // Get breadcrumb path for a given folder
  const getBreadcrumbPath = useCallback((folderId: string | null): Folder[] => {
    const path: Folder[] = [];
    
    const getParentFolder = (id: string | null): void => {
      if (!id) return;
      
      const folder = folders.find(f => f.id === id);
      if (!folder) return;
      
      // Add to beginning of path (we're moving up the tree)
      path.unshift(folder);
      
      // Continue to parent if it exists
      if (folder.parentId) {
        getParentFolder(folder.parentId);
      }
    };
    
    getParentFolder(folderId);
    return path;
  }, [folders]);

  // Load images and folders when user changes
  useEffect(() => {
    console.log('ImageContext: User changed', user ? 'User exists' : 'No user');
    if (user) {
      console.log('ImageContext: Fetching images and folders for user', user.id);
      fetchImages();
      fetchFolders();
    } else {
      console.log('ImageContext: No user, clearing data');
      setImages([]);
      setFolders([]);
      setCurrentFolder(null);
    }
  }, [user, fetchImages, fetchFolders]);

  const value = {
    images,
    folders,
    currentFolder,
    loading,
    error,
    fetchImages,
    fetchFolders,
    uploadImage,
    deleteImage,
    setCurrentFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFolder,
    moveImagesToFolder,
    getFolderImages,
    getCurrentFolderImages,
    getBreadcrumbPath,
  };

  return <ImageContext.Provider value={value}>{children}</ImageContext.Provider>;
};

export const useImages = () => {
  const context = useContext(ImageContext);
  if (context === undefined) {
    throw new Error('useImages must be used within an ImageProvider');
  }
  return context;
}; 