import React, { createContext, useContext, useState, useEffect } from 'react';
import { Image, imageApi } from '../services/api';
import { useAuth } from './AuthContext';

interface ImageContextType {
  images: Image[];
  loading: boolean;
  error: string | null;
  fetchImages: () => Promise<void>;
  uploadImage: (file: File) => Promise<Image>;
  deleteImage: (identifier: string) => Promise<void>;
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export const ImageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedImages = await imageApi.getUserImages();
      setImages(fetchedImages);
    } catch (err: any) {
      console.error('Failed to fetch images:', err);
      setError(err.message || 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      const uploadedImage = await imageApi.uploadImage(file);
      setImages(prevImages => [...prevImages, uploadedImage]);
      return uploadedImage;
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      setError(err.message || 'Failed to upload image');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (identifier: string) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    setError(null);
    
    try {
      await imageApi.deleteImage(identifier);
      setImages(prevImages => prevImages.filter(img => img.identifier !== identifier));
    } catch (err: any) {
      console.error('Failed to delete image:', err);
      setError(err.message || 'Failed to delete image');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load images when user changes
  useEffect(() => {
    console.log('ImageContext: User changed', user ? 'User exists' : 'No user');
    if (user) {
      console.log('ImageContext: Fetching images for user', user.id);
      fetchImages();
    } else {
      console.log('ImageContext: No user, clearing images');
      setImages([]);
    }
  }, [user]);

  const value = {
    images,
    loading,
    error,
    fetchImages,
    uploadImage,
    deleteImage,
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