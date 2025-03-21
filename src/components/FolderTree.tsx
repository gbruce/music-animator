import React, { useState, useEffect, useRef } from 'react';
import { Folder, imageApi } from '../services/api';
import { useImages } from '../contexts/ImageContext';
import { timelineStyles as styles } from './styles/TimelineStyles';
import { useAuth } from '../contexts/AuthContext';
import FolderItem from './FolderItem';

// Fix for timeout ref
type TimeoutRef = ReturnType<typeof setTimeout> | null;

interface FolderTreeProps {
  onAddFolder: () => void;
  onRenameFolder: (folder: Folder) => void;
  handleImageDrop?: (e: React.DragEvent<HTMLElement>, folderId: string) => void;
}

const FolderTree: React.FC<FolderTreeProps> = ({ onAddFolder, onRenameFolder, handleImageDrop }) => {
  const { user } = useAuth();
  const { folders, currentFolder, setCurrentFolder, deleteFolder, moveFolder } = useImages();
  const [draggingFolder, setDraggingFolder] = useState<string | null>(null);
  const [dropTargetFolder, setDropTargetFolder] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<TimeoutRef>(null);

  // Load user's folder preferences
  useEffect(() => {
    const loadFolders = async () => {
      if (!user) return;
      
      try {
        // Use getFolders instead of getUserFolderPreferences
        const userFolders = await imageApi.getFolders();
        
        // You can still maintain the open folders state from localStorage
        const userId = user.id || 'anonymous';
        const key = `folder-prefs-${userId}`;
        const savedState = localStorage.getItem(key);
        
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            if (Array.isArray(parsed)) {
              setOpenFolders(new Set(parsed));
            }
          } catch (e) {
            console.error('Error parsing saved folder state:', e);
          }
        }
      } catch (err) {
        console.error('Error loading folders:', err);
      }
    };
    
    loadFolders();
  }, [user]);

  // Save open folders to localStorage with debouncing
  useEffect(() => {
    if (!user || openFolders.size === 0) return;
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce saving to avoid excessive storage operations
    saveTimeoutRef.current = setTimeout(() => {
      // Just save to localStorage - no API call
      const userId = user.id || 'anonymous';
      const key = `folder-prefs-${userId}`;
      localStorage.setItem(key, JSON.stringify(Array.from(openFolders)));
    }, 1000); // 1 second debounce
    
    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [openFolders, user]);

  // Build a hierarchical folder structure for rendering
  const buildFolderHierarchy = (parentId: string | null = null): Folder[] => {
    return folders
      .filter(folder => folder.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Root level folders
  const rootFolders = buildFolderHierarchy(null);

  const handleFolderClick = (folderId: string) => {
    setCurrentFolder(folderId);
  };

  const handleAddRootFolder = () => {
    onAddFolder();
  };

  const toggleFolder = (folderId: string, isOpen: boolean) => {
    setOpenFolders(prev => {
      const newOpenFolders = new Set(prev);
      if (isOpen) {
        newOpenFolders.add(folderId);
      } else {
        newOpenFolders.delete(folderId);
      }
      return newOpenFolders;
    });
  };

  const handleDragStart = (e: React.DragEvent<HTMLElement>, folderId: string) => {
    e.stopPropagation(); // Prevent parent elements from also starting drag
    setDraggingFolder(folderId);
    
    // Required for Firefox
    e.dataTransfer.setData('text/plain', folderId);
    
    // Set a visual drag image
    const dragImage = document.createElement('div');
    dragImage.textContent = folders.find(f => f.id === folderId)?.name || 'Folder';
    dragImage.style.backgroundColor = '#2a3441';
    dragImage.style.color = 'white';
    dragImage.style.padding = '4px 8px';
    dragImage.style.borderRadius = '4px';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Clean up the element after drag ends
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Skip if trying to drag onto itself or if target is already the parent
    if (folderId === draggingFolder) return;
    
    const draggedFolder = folders.find(f => f.id === draggingFolder);
    if (draggedFolder?.parentId === folderId) return;
    
    // Prevent circular references (can't drop a folder into its descendant)
    const isDescendantOfDraggedFolder = (targetId: string, sourceId: string): boolean => {
      const folder = folders.find(f => f.id === targetId);
      if (!folder || !folder.parentId) return false;
      if (folder.parentId === sourceId) return true;
      return isDescendantOfDraggedFolder(folder.parentId, sourceId);
    };
    
    if (draggingFolder && isDescendantOfDraggedFolder(folderId, draggingFolder)) return;
    
    setDropTargetFolder(folderId);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetFolder(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLElement>, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggingFolder || draggingFolder === targetFolderId) {
      setDraggingFolder(null);
      setDropTargetFolder(null);
      return;
    }
    
    // Prevent circular references
    const isDescendantOfDraggedFolder = (targetId: string, sourceId: string): boolean => {
      const folder = folders.find(f => f.id === targetId);
      if (!folder || !folder.parentId) return false;
      if (folder.parentId === sourceId) return true;
      return isDescendantOfDraggedFolder(folder.parentId, sourceId);
    };
    
    if (isDescendantOfDraggedFolder(targetFolderId, draggingFolder)) {
      setDraggingFolder(null);
      setDropTargetFolder(null);
      return;
    }
    
    try {
      console.log(`Moving folder ${draggingFolder} to parent ${targetFolderId}`);
      await moveFolder(draggingFolder, targetFolderId);
    } catch (err) {
      console.error('Failed to move folder:', err);
    }
    
    setDraggingFolder(null);
    setDropTargetFolder(null);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingFolder(null);
    setDropTargetFolder(null);
  };

  const handleRootDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggingFolder) return;
    
    try {
      // Move to root level (no parent)
      console.log(`Moving folder ${draggingFolder} to root`);
      await moveFolder(draggingFolder, undefined);
    } catch (err) {
      console.error('Failed to move folder to root:', err);
    }
    
    setDraggingFolder(null);
    setDropTargetFolder(null);
  };

  // Auto-expand drop target folders
  useEffect(() => {
    if (dropTargetFolder) {
      setOpenFolders(prev => {
        const newOpenFolders = new Set(prev);
        newOpenFolders.add(dropTargetFolder);
        return newOpenFolders;
      });
    }
  }, [dropTargetFolder]);

  // Clean up deleted folders from openFolders
  useEffect(() => {
    // Get all folder IDs that exist
    const existingFolderIds = new Set(folders.map(folder => folder.id));
    
    // Check if there are any openFolders that no longer exist
    let hasOrphans = false;
    const orphanedFolders = Array.from(openFolders).filter(id => !existingFolderIds.has(id));
    
    if (orphanedFolders.length > 0) {
      setOpenFolders(prev => {
        const newOpenFolders = new Set(prev);
        orphanedFolders.forEach(id => newOpenFolders.delete(id));
        return newOpenFolders;
      });
    }
  }, [folders, openFolders]);

  return (
    <div 
      className={styles.folderTreeContainer}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleRootDrop}
    >
      <div className={styles.folderTreeSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>FOLDERS</div>
          <button
            className={styles.inlineFolderButton}
            onClick={handleAddRootFolder}
            aria-label="Add new folder"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
        <div className={styles.folderTree}>
          {rootFolders.map((folder) => (
            <FolderItem 
              key={folder.id} 
              folder={folder}
              level={0}
              openFolders={openFolders}
              currentFolder={currentFolder}
              dropTargetFolder={dropTargetFolder}
              folders={folders}
              toggleFolder={toggleFolder}
              handleFolderClick={handleFolderClick}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              deleteFolder={deleteFolder}
              onRenameFolder={onRenameFolder}
              handleImageDrop={handleImageDrop}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FolderTree; 