import React, { useState, useRef, useEffect } from 'react';
import { useImages } from '../contexts/ImageContext';
import { Folder, imageApi } from '../services/api';
import { timelineStyles as styles } from './styles/TimelineStyles';
import { useAuth } from '../contexts/AuthContext';
import FolderTree from './FolderTree';
import FolderModal from './FolderModal';

const Images: React.FC = () => {
  const { 
    images, 
    folders,
    currentFolder, 
    loadingImages,
    loadingFolders,
    error, 
    uploadImage, 
    deleteImage, 
    setCurrentFolder,
    createFolder,
    renameFolder,
    getCurrentFolderImages,
    getBreadcrumbPath,
    getImageUrl,
    moveImagesToFolder
  } = useImages();
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggingImage, setDraggingImage] = useState<string | null>(null);
  
  // Modal states
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'rename'>('create');
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  // Get only images for the current folder
  const currentFolderImages = getCurrentFolderImages();
  
  // Get breadcrumb path
  const breadcrumbPath = getBreadcrumbPath(currentFolder);

  // Log component state
  useEffect(() => {
    console.log('Images component: User', user ? 'exists' : 'not logged in');
    console.log('Images component: Images count', images.length);
    console.log('Images component: Current folder', currentFolder);
    console.log('Images component: Folders count', folders.length);
    console.log('Images component: Loading', loadingImages);
    console.log('Images component: Error', error);
  }, [user, images, folders, currentFolder, loadingImages, error]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Filter for image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setUploadError('Please drop image files only');
      return;
    }

    // Upload each image to the current folder
    try {
      await Promise.all(imageFiles.map(file => uploadImage(file)));
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload images');
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      await Promise.all(files.map(file => uploadImage(file)));
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload images');
    }
  };

  const handleDeleteImage = async (identifier: string) => {
    try {
      await deleteImage(identifier);
    } catch (err: any) {
      console.error('Failed to delete image:', err);
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleAddFolder = () => {
    setModalMode('create');
    setSelectedFolder(null);
    setFolderModalOpen(true);
  };
  
  const handleRenameFolder = (folder: Folder) => {
    setModalMode('rename');
    setSelectedFolder(folder);
    setFolderModalOpen(true);
  };
  
  const handleFolderModalSubmit = async (name: string) => {
    try {
      if (modalMode === 'create') {
        await createFolder(name);
      } else if (modalMode === 'rename' && selectedFolder) {
        await renameFolder(selectedFolder.id, name);
      }
    } catch (err: any) {
      console.error(
        modalMode === 'create' ? 'Failed to create folder:' : 'Failed to rename folder:',
        err
      );
    }
  };
  
  const navigateToBreadcrumb = (folderId: string | null) => {
    setCurrentFolder(folderId);
  };

  // Handle image drag start
  const handleImageDragStart = (e: React.DragEvent<HTMLElement>, imageId: string) => {
    e.dataTransfer.setData('application/image', imageId);
    setDraggingImage(imageId);
    
    // Add dragging class to the element
    const target = e.currentTarget as HTMLElement;
    target.classList.add(styles.imageCardDragging.split(' ')[0]);
    
    // Set a preview image
    const image = images.find(img => img.identifier === imageId);
    if (image) {
      const element = document.createElement('div');
      element.style.position = 'absolute';
      element.style.top = '-1000px';
      element.style.width = '100px';
      element.style.height = '100px';
      element.style.backgroundImage = `url(${getImageUrl(image.identifier)})`;
      element.style.backgroundSize = 'cover';
      element.style.backgroundPosition = 'center';
      element.style.borderRadius = '4px';
      document.body.appendChild(element);
      
      e.dataTransfer.setDragImage(element, 50, 50);
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(element);
      }, 100);
    }
  };

  // Handle image drag end
  const handleImageDragEnd = (e: React.DragEvent<HTMLElement>) => {
    // Remove dragging class
    const target = e.currentTarget as HTMLElement;
    target.classList.remove(styles.imageCardDragging.split(' ')[0]);
    
    setDraggingImage(null);
  };

  // Handle dropping images onto folders
  const handleImageDropOnFolder = async (e: React.DragEvent<HTMLElement>, folderId: string) => {
    const imageId = e.dataTransfer.getData('application/image');
    
    if (!imageId) return;
    
    try {
      // Find the image to get its identifier
      const image = images.find(img => img.identifier === imageId);
      
      if (!image) {
        console.error('Image not found:', imageId);
        return;
      }
      
      // Move the image to the folder using the identifier
      await moveImagesToFolder([image.identifier], folderId);
      console.log(`Moved image ${image.identifier} to folder ${folderId}`);
    } catch (err) {
      console.error('Failed to move image to folder:', err);
    }
  };

  return (
    <div>
      {/* Folder Modal */}
      <FolderModal
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onSubmit={handleFolderModalSubmit}
        title={modalMode === 'create' ? 'Create New Folder' : 'Rename Folder'}
        initialName={selectedFolder?.name}
      />

      {/* Main content area with folder tree and images */}
      <div className={styles.imageContent}>
        {/* Left column with folder tree and upload area */}
        <div className={styles.leftColumn}>
          {/* Upload area */}
          <div
            className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
              multiple
              accept="image/*"
            />
            <div className={styles.dropZoneContent}>
              <svg
                className={styles.uploadIcon}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p>Drop images or click</p>
            </div>
          </div>

          {uploadError && <div className={styles.errorMessage}>{uploadError}</div>}

          <FolderTree 
            onAddFolder={handleAddFolder}
            onRenameFolder={handleRenameFolder}
            handleImageDrop={handleImageDropOnFolder}
          />
        </div>
        
        {/* Image grid section */}
        <div className={styles.contentPanel}>
          {/* Breadcrumbs navigation */}
          <div className={styles.breadcrumbs}>
            {currentFolder && (
              <>
                <span 
                  className={styles.breadcrumbLink}
                  onClick={() => navigateToBreadcrumb(null)}
                >
                  Back to all images
                </span>
                
                {breadcrumbPath.map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    <span className={styles.breadcrumbsSeparator}>/</span>
                    <span 
                      className={
                        index === breadcrumbPath.length - 1
                          ? styles.breadcrumbCurrent
                          : styles.breadcrumbLink
                      }
                      onClick={() => navigateToBreadcrumb(folder.id)}
                    >
                      {folder.name}
                    </span>
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
          
          {/* Folder indicator */}
          {currentFolder && (
            <div className={styles.folderIndicator}>
              {`Viewing only images in "${breadcrumbPath[breadcrumbPath.length - 1]?.name || 'Unknown folder'}"`}
            </div>
          )}
          
          {/* Image grid */}
          {loadingImages ? (
            <div className={styles.loadingContainer}>Loading images...</div>
          ) : (
            <div className={styles.imageGrid}>
              {currentFolderImages.length === 0 ? (
                <div className={styles.noImages}>
                  {currentFolder 
                    ? 'No images in this folder' 
                    : 'No images in your library'}
                </div>
              ) : (
                currentFolderImages.map(image => (
                  <div 
                    key={image.identifier} 
                    className={styles.imageCard}
                    draggable
                    onDragStart={(e) => handleImageDragStart(e, image.identifier)}
                    onDragEnd={handleImageDragEnd}
                  >
                    <img
                      src={getImageUrl(image.identifier)}
                      alt={image.filename}
                      className={styles.imagePreview}
                      draggable={false}
                    />
                    <div className={styles.imageInfo}>
                      <div className={styles.imageName}>{image.filename}</div>
                      <div className={styles.imageDetails}>
                        {Math.round(image.width)} x {Math.round(image.height)} px
                        <span className={styles.imageSeparator}>•</span>
                        {formatFileSize(image.fileSize)}
                      </div>
                    </div>
                    <button
                      className={styles.imageDeleteButton}
                      onClick={() => handleDeleteImage(image.identifier)}
                      aria-label="Delete image"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default Images; 