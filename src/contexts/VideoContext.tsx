import React, { createContext, useContext, useState, useCallback } from 'react';
import { Video, videoApi } from '../services/api';

interface VideoContextType {
  videos: Video[];
  loading: boolean;
  currentFolder: string | null;
  setCurrentFolder: (folderId: string | null) => void;
  fetchVideos: (folderId?: string) => Promise<void>;
  uploadVideo: (file: File, folderId?: string) => Promise<void>;
  downloadYouTubeVideo: (url: string, folderId?: string) => Promise<void>;
  deleteVideo: (identifier: string) => Promise<void>;
  moveVideos: (identifiers: string[], folderId: string | null) => Promise<void>;
  downloadProgress: Record<string, number>;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
};

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  const fetchVideos = useCallback(async (folderId?: string) => {
    setLoading(true);
    try {
      const data = await videoApi.list(folderId);
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadVideo = useCallback(async (file: File, folderId?: string) => {
    try {
      const video = await videoApi.upload(file, folderId);
      setVideos(prev => [...prev, video]);
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }, []);

  const downloadYouTubeVideo = useCallback(async (url: string, folderId?: string) => {
    try {
      const video = await videoApi.downloadFromYouTube(url, folderId);
      setVideos(prev => [...prev, video]);
    } catch (error) {
      console.error('Error downloading YouTube video:', error);
      throw error;
    }
  }, []);

  const deleteVideo = useCallback(async (identifier: string) => {
    try {
      await videoApi.delete(identifier);
      setVideos(prev => prev.filter(video => video.identifier !== identifier));
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }, []);

  const moveVideos = useCallback(async (identifiers: string[], folderId: string | null) => {
    try {
      await videoApi.move(identifiers, folderId);
      if (currentFolder !== folderId) {
        setVideos(prev => prev.filter(video => !identifiers.includes(video.identifier)));
      }
    } catch (error) {
      console.error('Error moving videos:', error);
      throw error;
    }
  }, [currentFolder]);

  return (
    <VideoContext.Provider
      value={{
        videos,
        loading,
        currentFolder,
        setCurrentFolder,
        fetchVideos,
        uploadVideo,
        downloadYouTubeVideo,
        deleteVideo,
        moveVideos,
        downloadProgress
      }}
    >
      {children}
    </VideoContext.Provider>
  );
}; 