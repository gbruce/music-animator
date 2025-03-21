import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Image, Folder, imageApi } from '../services/api';
import { useAuth } from './AuthContext';

interface ImageContextType {
  images: Image[];
  folders: Folder[];
  currentFolder: string | null;
  loadingImages: boolean;
  loadingFolders: boolean;
  error: string | null;
  setCurrentFolder: (folderId: string | null) => void;
  createFolder: (name: string, parentId?: string) => Promise<Folder>;
  renameFolder: (folderId: string, newName: string) => Promise<Folder>;
  deleteFolder: (folderId: string) => Promise<void>;
  moveFolder: (folderId: string, newParentId?: string) => Promise<Folder>;
  moveImagesToFolder: (imageIds: string[], folderId?: string) => Promise<void>;
  uploadImage: (file: File, folderId?: string) => Promise<Image>;
  deleteImage: (identifier: string) => Promise<void>;
  fetchImages: (folderId?: string) => Promise<void>;
  fetchFolders: () => Promise<void>;
  fetchFolderImages: (folderId: string) => Promise<Image[]>;
  getCurrentFolderImages: () => Image[];
  getBreadcrumbPath: (folderId: string | null) => Folder[];
  refreshImages: () => Promise<void>;
  refreshFolders: () => Promise<void>;
  getImageUrl: (identifier: string) => string;
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export const useImages = (): ImageContextType => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImages must be used within an ImageProvider');
  }
  return context;
};

interface ImageProviderProps {
  children: ReactNode;
}

export const ImageProvider: React.FC<ImageProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [images, setImages] = useState<Image[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(true);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async (folderId?: string) => {
    if (!user) return;
    
    setLoadingImages(true);
    setError(null);
    
    try {
      const fetchedImages = folderId 
        ? await imageApi.getFolderImages(folderId)
        : await imageApi.getUserImages();
      setImages(fetchedImages);
    } catch (err: any) {
      console.error('Failed to fetch images:', err);
      setError(err.message || 'Failed to fetch images');
    } finally {
      setLoadingImages(false);
    }
  }, [user]);

  const fetchFolders = useCallback(async () => {
    if (!user) return;
    
    setLoadingFolders(true);
    setError(null);
    
    try {
      const fetchedFolders = await imageApi.getFolders();
      setFolders(fetchedFolders);
    } catch (err: any) {
      console.error('Failed to fetch folders:', err);
      setError(err.message || 'Failed to fetch folders');
    } finally {
      setLoadingFolders(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchFolders();
      fetchImages();
    }
  }, [user, fetchFolders, fetchImages]);

  // Refetch images when current folder changes
  useEffect(() => {
    if (user) {
      fetchImages(currentFolder || undefined);
    }
  }, [user, fetchImages, currentFolder]);

  const uploadImage = useCallback(async (file: File, folderId?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoadingImages(true);
    setError(null);
    
    try {
      const targetFolderId = folderId !== undefined 
        ? folderId 
        : (currentFolder !== null ? currentFolder : undefined);
        
      const uploadedImage = await imageApi.uploadImage(file, targetFolderId);
      setImages(prevImages => [...prevImages, uploadedImage]);
      return uploadedImage;
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      setError(err.message || 'Failed to upload image');
      throw err;
    } finally {
      setLoadingImages(false);
    }
  }, [user, currentFolder]);

  const deleteImage = useCallback(async (identifier: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoadingImages(true);
    setError(null);
    
    try {
      await imageApi.deleteImage(identifier);
      setImages(prevImages => prevImages.filter(img => img.identifier !== identifier));
    } catch (err: any) {
      console.error('Failed to delete image:', err);
      setError(err.message || 'Failed to delete image');
      throw err;
    } finally {
      setLoadingImages(false);
    }
  }, [user]);

  const createFolder = useCallback(async (name: string, parentId?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoadingImages(true);
    setError(null);
    
    try {
      const folderParentId = parentId !== undefined 
        ? parentId 
        : (currentFolder !== null ? currentFolder : undefined);
        
      const newFolder = await imageApi.createFolder(name, folderParentId);
      setFolders(prevFolders => [...prevFolders, newFolder]);
      return newFolder;
    } catch (err: any) {
      console.error('Failed to create folder:', err);
      setError(err.message || 'Failed to create folder');
      throw err;
    } finally {
      setLoadingImages(false);
    }
  }, [user, currentFolder]);

  const renameFolder = useCallback(async (folderId: string, newName: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoadingImages(true);
    setError(null);
    
    try {
      const updatedFolder = await imageApi.renameFolder(folderId, newName);
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
      setLoadingImages(false);
    }
  }, [user]);

  const deleteFolder = useCallback(async (folderId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoadingImages(true);
    setError(null);
    
    try {
      await imageApi.deleteFolder(folderId);
      
      // Update current folder if it was deleted
      if (currentFolder === folderId) {
        setCurrentFolder(null);
      }
      
      // Update folders state
      setFolders(prevFolders => prevFolders.filter(folder => folder.id !== folderId));
      
      // Reload images if we're viewing the deleted folder
      await fetchImages(currentFolder === folderId ? undefined : currentFolder || undefined);
    } catch (err: any) {
      console.error('Failed to delete folder:', err);
      setError(err.message || 'Failed to delete folder');
      throw err;
    } finally {
      setLoadingImages(false);
    }
  }, [user, fetchImages, currentFolder]);

  const moveFolder = useCallback(async (folderId: string, newParentId?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoadingImages(true);
    setError(null);
    
    try {
      const updatedFolder = await imageApi.moveFolder(folderId, newParentId);
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
      setLoadingImages(false);
    }
  }, [user]);

  const moveImagesToFolder = useCallback(async (imageIds: string[], folderId?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoadingImages(true);
    setError(null);
    
    try {
      await imageApi.moveImagesToFolder(imageIds, folderId);
      
      // Update local images data through refetch
      await fetchImages(currentFolder || undefined);
    } catch (err: any) {
      console.error('Failed to move images:', err);
      setError(err.message || 'Failed to move images');
      throw err;
    } finally {
      setLoadingImages(false);
    }
  }, [user, fetchImages, currentFolder]);

  const fetchFolderImages = useCallback(async (folderId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoadingImages(true);
    setError(null);
    
    try {
      const folderImages = await imageApi.getFolderImages(folderId);
      return folderImages;
    } catch (err: any) {
      console.error('Failed to fetch folder images:', err);
      setError(err.message || 'Failed to fetch folder images');
      throw err;
    } finally {
      setLoadingImages(false);
    }
  }, [user]);

  const getCurrentFolderImages = useCallback(() => {
    // If no folder is selected (All Images), return all images
    if (currentFolder === null) {
      return images;
    }
    
    // Otherwise, filter images for the current folder only
    return images.filter(image => image.folderId === currentFolder);
  }, [images, currentFolder]);

  const getBreadcrumbPath = useCallback((folderId: string | null) => {
    if (!folderId) return [];
    
    const path: Folder[] = [];
    let currentId = folderId;
    
    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (!folder) break;
      
      path.unshift(folder);
      currentId = folder.parentId || '';
    }
    
    return path;
  }, [folders]);

  const refreshImages = useCallback(async () => {
    await fetchImages(currentFolder || undefined);
  }, [currentFolder, fetchImages]);

  const refreshFolders = useCallback(async () => {
    await fetchFolders();
  }, [fetchFolders]);

  const getImageUrl = useCallback((identifier: string) => {
    return imageApi.getImageUrl(identifier);
  }, []);

  const value = {
    images,
    folders,
    currentFolder,
    loadingImages,
    loadingFolders,
    error,
    fetchImages,
    fetchFolders,
    setCurrentFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFolder,
    moveImagesToFolder,
    uploadImage,
    deleteImage,
    fetchFolderImages,
    getCurrentFolderImages,
    getBreadcrumbPath,
    refreshImages,
    refreshFolders,
    getImageUrl,
  };

  return (
    <ImageContext.Provider value={value}>
      {children}
    </ImageContext.Provider>
  );
}; 