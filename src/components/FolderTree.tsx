import React, { useState, useRef } from 'react';
import { Folder } from '../services/api';
import { useImages } from '../contexts/ImageContext';
import { timelineStyles as styles } from './styles/TimelineStyles';

interface FolderTreeProps {
  onAddFolder: () => void;
  onRenameFolder: (folder: Folder) => void;
}

const FolderTree: React.FC<FolderTreeProps> = ({ onAddFolder, onRenameFolder }) => {
  const { folders, currentFolder, setCurrentFolder, deleteFolder, moveFolder } = useImages();
  const [draggingFolder, setDraggingFolder] = useState<string | null>(null);
  const [dropTargetFolder, setDropTargetFolder] = useState<string | null>(null);

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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, folderId: string) => {
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, folderId: string) => {
    e.preventDefault();
    
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

  const handleDragLeave = () => {
    setDropTargetFolder(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetFolderId: string) => {
    e.preventDefault();
    
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
      await moveFolder(draggingFolder, targetFolderId);
    } catch (err) {
      console.error('Failed to move folder:', err);
    }
    
    setDraggingFolder(null);
    setDropTargetFolder(null);
  };

  const handleDragEnd = () => {
    setDraggingFolder(null);
    setDropTargetFolder(null);
  };

  const handleRootDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (!draggingFolder) return;
    
    try {
      // Move to root level (no parent)
      await moveFolder(draggingFolder, undefined);
    } catch (err) {
      console.error('Failed to move folder to root:', err);
    }
    
    setDraggingFolder(null);
    setDropTargetFolder(null);
  };

  // Recursive component for folder tree
  const FolderItem = ({ folder, level = 0 }: { folder: Folder; level?: number }) => {
    const [isOpen, setIsOpen] = useState(false);
    const children = buildFolderHierarchy(folder.id);
    const hasChildren = children.length > 0;
    
    const isSelected = currentFolder === folder.id;
    const isDragTarget = dropTargetFolder === folder.id;
    
    return (
      <div>
        <div
          className={`${styles.folderItem} ${isSelected ? styles.folderItemSelected : ''} ${isDragTarget ? styles.draggingOver : ''}`}
          onClick={() => handleFolderClick(folder.id)}
          draggable
          onDragStart={(e) => handleDragStart(e, folder.id)}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
          onDragEnd={handleDragEnd}
          style={{ paddingLeft: `${level * 8 + 8}px` }}
        >
          <span 
            className={styles.folderIcon} 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            {hasChildren ? (
              isOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              )
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"></path>
              </svg>
            )}
          </span>
          
          <span className={styles.folderName}>
            {folder.name}
          </span>
          
          <div className={styles.folderActions}>
            <button 
              className={styles.folderActionButton}
              onClick={(e) => {
                e.stopPropagation();
                onRenameFolder(folder);
              }}
              aria-label="Rename folder"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            
            <button 
              className={styles.folderActionButtonDanger}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to delete the folder "${folder.name}"? All images inside will be removed from the folder.`)) {
                  deleteFolder(folder.id);
                }
              }}
              aria-label="Delete folder"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        
        {isOpen && hasChildren && (
          <div className={styles.folderChildren}>
            {children.map((childFolder) => (
              <FolderItem 
                key={childFolder.id} 
                folder={childFolder} 
                level={level + 1} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={styles.folderTreeContainer}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleRootDrop}
    >
      <div className={styles.folderTree}>
        <div
          className={`${styles.folderItem} ${!currentFolder ? styles.folderItemSelected : ''}`}
          onClick={() => setCurrentFolder(null)}
        >
          <span className={styles.folderIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </span>
          <span className={styles.folderName}>All Images</span>
        </div>
      
        {rootFolders.map((folder) => (
          <FolderItem key={folder.id} folder={folder} />
        ))}
      </div>
      
      <button
        className={styles.addFolderButton}
        onClick={handleAddRootFolder}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          <line x1="12" y1="11" x2="12" y2="17"></line>
          <line x1="9" y1="14" x2="15" y2="14"></line>
        </svg>
        Add Folder
      </button>
    </div>
  );
};

export default FolderTree; 