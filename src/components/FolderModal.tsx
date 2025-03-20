import React, { useState, useEffect } from 'react';
import { Folder } from '../services/api';
import { timelineStyles as styles } from './styles/TimelineStyles';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  title: string;
  initialName?: string;
}

const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialName = ''
}) => {
  const [folderName, setFolderName] = useState(initialName);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFolderName(initialName);
    }
  }, [isOpen, initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (folderName.trim()) {
      onSubmit(folderName.trim());
      onClose();
    }
  };

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modal} onClick={onClose}>
      <div 
        className={styles.modalContent}
        onClick={e => e.stopPropagation()} 
      >
        <h2 className={styles.modalHeader}>{title}</h2>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div>
            <label htmlFor="folderName" className={styles.modalLabel}>
              Folder Name
            </label>
            <input
              id="folderName"
              type="text"
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              className={styles.modalInput}
              autoFocus
              placeholder="Enter folder name"
              maxLength={50}
            />
          </div>
          
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.modalCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.modalSubmit}
              disabled={!folderName.trim()}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FolderModal; 