import React from 'react';
import { Folder } from '../services/api';
import { timelineStyles as styles } from './styles/TimelineStyles';

interface FolderItemProps {
  folder: Folder;
  level?: number;
  openFolders: Set<string>;
  currentFolder: string | null;
  dropTargetFolder: string | null;
  folders: Folder[];
  toggleFolder: (folderId: string, isOpen: boolean) => void;
  handleFolderClick: (folderId: string) => void;
  handleDragStart: (e: React.DragEvent<HTMLElement>, folderId: string) => void;
  handleDragEnd: (e: React.DragEvent<HTMLElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLElement>, folderId: string) => void;
  handleDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLElement>, targetFolderId: string) => void;
  deleteFolder: (folderId: string) => Promise<void>;
  onRenameFolder: (folder: Folder) => void;
  handleImageDrop?: (e: React.DragEvent<HTMLElement>, folderId: string) => void;
}

// Build a hierarchical folder structure for rendering
const buildFolderHierarchy = (folders: Folder[], parentId: string | null = null): Folder[] => {
  return folders
    .filter(folder => folder.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
};

const FolderItem: React.FC<FolderItemProps> = ({ 
  folder, 
  level = 0,
  openFolders,
  currentFolder,
  dropTargetFolder,
  folders,
  toggleFolder,
  handleFolderClick,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  deleteFolder,
  onRenameFolder,
  handleImageDrop
}) => {
  const isOpen = openFolders.has(folder.id);
  const children = buildFolderHierarchy(folders, folder.id);
  const hasChildren = children.length > 0;
  
  const isSelected = currentFolder === folder.id;
  const isDragTarget = dropTargetFolder === folder.id;
  
  // Folder icon based on open/closed state
  const getFolderIcon = () => {
    if (hasChildren) {
      return isOpen ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6l2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z"></path>
          <line x1="6" y1="14" x2="18" y2="14"></line>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6l2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z"></path>
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6l2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z"></path>
        </svg>
      );
    }
  };
  
  // Handle drag events
  const onDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if this is a folder drag or an image drag based on data type
    const dataType = e.dataTransfer.types[0];
    
    if (dataType === 'application/folder') {
      // It's a folder being dragged
      handleDragOver(e, folder.id);
    } else if (dataType === 'application/image') {
      // It's an image being dragged
      e.currentTarget.classList.add(styles.draggingOver.split(' ')[0]);
    }
  };
  
  const onDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove highlight regardless of drag type
    e.currentTarget.classList.remove(styles.draggingOver.split(' ')[0]);
    
    // If it's a folder drag, also call the folder drag leave handler
    if (e.dataTransfer.types.includes('application/folder')) {
      handleDragLeave(e);
    }
  };
  
  const onDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove highlight
    e.currentTarget.classList.remove(styles.draggingOver.split(' ')[0]);
    
    // Check data type to determine what's being dropped
    if (e.dataTransfer.types.includes('application/folder')) {
      // It's a folder being dropped
      handleDrop(e, folder.id);
    } else if (e.dataTransfer.types.includes('application/image') && handleImageDrop) {
      // It's an image being dropped
      handleImageDrop(e, folder.id);
    }
  };
  
  return (
    <div>
      <div
        className={`${styles.folderItem} ${isSelected ? styles.folderItemSelected : ''} ${isDragTarget ? styles.draggingOver : ''}`}
        onClick={() => handleFolderClick(folder.id)}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{ paddingLeft: `${level * 16}px` }}
      >
        <div style={{ width: '16px', display: 'flex', justifyContent: 'center' }}>
          {hasChildren && (
            <span 
              className={styles.folderToggle} 
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id, !isOpen);
              }}
            >
              {isOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              )}
            </span>
          )}
        </div>
        
        <span 
          className={styles.folderIcon}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/folder', folder.id);
            handleDragStart(e, folder.id);
          }}
          onDragEnd={handleDragEnd}
        >
          {getFolderIcon()}
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
      )}
    </div>
  );
};

export default FolderItem; 