import React, { useState, useRef, useEffect } from 'react';
import { useImages } from '../contexts/ImageContext';
import { Image, imageApi } from '../services/api';
import { timelineStyles as styles } from './styles/TimelineStyles';
import { useAuth } from '../contexts/AuthContext';

const Images: React.FC = () => {
  const { images, loading, error, uploadImage, deleteImage, fetchImages } = useImages();
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Log component state
  useEffect(() => {
    console.log('Images component: User', user ? 'exists' : 'not logged in');
    console.log('Images component: Images count', images.length);
    console.log('Images component: Loading', loading);
    console.log('Images component: Error', error);
  }, [user, images, loading, error]);

  // Force fetch images when component mounts
  useEffect(() => {
    console.log('Images component: Mounting, fetching images');
    fetchImages().catch(err => {
      console.error('Failed to fetch images on mount:', err);
    });
  }, [fetchImages]);

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

    // Upload each image
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

  return (
    <div className={styles.container}>
      <div className={styles.glowEffect}>
        <div className={styles.contentContainer}>
          <h1 className={styles.heading}>Image Manager</h1>

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
              <p>Drag and drop images here or click to browse</p>
            </div>
          </div>

          {uploadError && <div className={styles.errorMessage}>{uploadError}</div>}

          {/* Image grid */}
          {loading ? (
            <div className={styles.loadingContainer}>Loading images...</div>
          ) : (
            <div className={styles.imageGrid}>
              {images.length === 0 ? (
                <div className={styles.noImages}>No images uploaded yet</div>
              ) : (
                images.map(image => (
                  <div key={image.identifier} className={styles.imageCard}>
                    <img
                      src={imageApi.getImageUrl(image.identifier)}
                      alt={image.filename}
                      className={styles.imagePreview}
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