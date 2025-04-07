import React, { useState } from 'react';
import { useFolder } from '../contexts/FolderContext';

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

interface FolderBrowserProps {
  folders: Folder[];
  currentFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onMove?: (folderId: string | null) => void;
}

export const FolderBrowser: React.FC<FolderBrowserProps> = ({
  folders,
  currentFolder,
  onFolderSelect,
  onMove
}) => {
  const { createFolder, deleteFolder } = useFolder();
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName, currentFolder || undefined);
      setNewFolderName('');
      setIsCreateDialogOpen(false);
      alert('Folder created successfully');
    } catch (error) {
      alert('Failed to create folder');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await deleteFolder(id);
      if (currentFolder === id) {
        onFolderSelect(null);
      }
      alert('Folder deleted successfully');
    } catch (error) {
      alert('Failed to delete folder');
    }
  };

  const getChildFolders = (parentId: string | null) => {
    return folders.filter(folder => folder.parentId === parentId);
  };

  const renderFolderList = (parentId: string | null, level = 0) => {
    const childFolders = getChildFolders(parentId);

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {childFolders.map(folder => (
          <li key={folder.id} style={{ marginBottom: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                paddingLeft: `${level * 20}px`,
                backgroundColor: currentFolder === folder.id ? '#e6e6e6' : 'transparent',
                cursor: 'pointer'
              }}
              onClick={() => onFolderSelect(folder.id)}
            >
              <span style={{ marginRight: '8px' }}>📁</span>
              <span style={{ flex: 1 }}>{folder.name}</span>
              {onMove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(folder.id);
                  }}
                  style={{ marginRight: '8px' }}
                >
                  Move Here
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(folder.id);
                }}
              >
                🗑️
              </button>
            </div>
            {renderFolderList(folder.id, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div>
      <button
        onClick={() => setIsCreateDialogOpen(true)}
        style={{ marginBottom: '16px' }}
      >
        + New Folder
      </button>

      {isCreateDialogOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '4px',
              minWidth: '300px'
            }}
          >
            <h3 style={{ marginTop: 0 }}>Create New Folder</h3>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '16px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </button>
              <button onClick={handleCreateFolder}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {renderFolderList(null)}
    </div>
  );
}; 