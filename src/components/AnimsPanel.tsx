import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
} from '@mui/material';
import { useAnims } from '../contexts/AnimsContext';
import { createLogger } from '../utils/logger';
import { timelineStyles as styles } from './styles/TimelineStyles';

// Create a logger instance for this component
const logger = createLogger('AnimsPanel.tsx');

const AnimsPanel: React.FC = () => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use context for managing state
  const { 
    sourceAnim,
    setSourceAnim,
    generatedAnims,
    setGeneratedAnims
  } = useAnims();

  // Handle file drop
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    // Use only the first file and ensure it's a video
    const file = files[0];
    if (!file.type.startsWith('video/mp4')) {
      logger.error('Dropped file is not an MP4 video');
      return;
    }
    
    // Create URL for the video preview
    const videoUrl = URL.createObjectURL(file);
    setSourceAnim(videoUrl);
    logger.log(`Source animation set: ${file.name}`);
  }, [setSourceAnim]);
  
  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  // Handle file selection via click
  const openFileDialog = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  // Handle file selection change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('video/mp4')) {
      logger.error('Selected file is not an MP4 video');
      return;
    }
    
    // Clean up any existing source animation URL
    if (sourceAnim) {
      URL.revokeObjectURL(sourceAnim);
    }

    // Create URL for the video preview
    const videoUrl = URL.createObjectURL(file);
    setSourceAnim(videoUrl);
    logger.log(`Source animation set: ${file.name}`);
    
    // Reset the input to allow selecting the same file again
    e.target.value = '';
  }, [sourceAnim, setSourceAnim]);

  return (
    <div>
      {/* Main content area */}
      <div className={styles.imageContent}>
        {/* Left column with upload area */}
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
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept="video/mp4"
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
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                <line x1="7" y1="2" x2="7" y2="22"/>
                <line x1="17" y1="2" x2="17" y2="22"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <line x1="2" y1="7" x2="7" y2="7"/>
                <line x1="2" y1="17" x2="7" y2="17"/>
                <line x1="17" y1="17" x2="22" y2="17"/>
                <line x1="17" y1="7" x2="22" y2="7"/>
              </svg>
              <p>Drop MP4 or click to select</p>
            </div>
          </div>

          {/* Generated animations grid */}
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              height: '100%', 
              minHeight: '70vh',
              overflow: 'auto'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Generated Animations</Typography>
            </Box>
            
            <Grid container spacing={2}>
              {generatedAnims.length === 0 && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      height: 300,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px dashed #ccc',
                      borderRadius: 1
                    }}
                  >
                    <Typography color="text.secondary">
                      No animations generated yet.
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </div>

        {/* Right side - Preview */}
        <div className={styles.contentPanel}>
          {sourceAnim && (
            <Box sx={{ 
              mb: 2,
              position: 'relative',
              borderRadius: 1,
              overflow: 'hidden'
            }}>
              <video
                src={sourceAnim}
                controls
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  borderRadius: 4,
                }}
              />
            </Box>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimsPanel; 