import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

interface FolderContextType {
  folders: Folder[];
  loading: boolean;
  fetchFolders: () => Promise<void>;
  createFolder: (name: string, parentId?: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  moveFolder: (id: string, parentId: string | null) => Promise<void>;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export const useFolder = () => {
  const context = useContext(FolderContext);
  if (!context) {
    throw new Error('useFolder must be used within a FolderProvider');
  }
  return context;
};

export const FolderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchFolders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/folders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch folders');
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createFolder = useCallback(async (name: string, parentId?: string) => {
    if (!token) return;
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, parentId })
      });
      if (!response.ok) throw new Error('Failed to create folder');
      await fetchFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }, [token, fetchFolders]);

  const deleteFolder = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete folder');
      setFolders(prev => prev.filter(folder => folder.id !== id));
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }, [token]);

  const moveFolder = useCallback(async (id: string, parentId: string | null) => {
    if (!token) return;
    try {
      const response = await fetch(`/api/folders/${id}/move`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ parentId })
      });
      if (!response.ok) throw new Error('Failed to move folder');
      await fetchFolders();
    } catch (error) {
      console.error('Error moving folder:', error);
      throw error;
    }
  }, [token, fetchFolders]);

  return (
    <FolderContext.Provider value={{
      folders,
      loading,
      fetchFolders,
      createFolder,
      deleteFolder,
      moveFolder
    }}>
      {children}
    </FolderContext.Provider>
  );
}; 