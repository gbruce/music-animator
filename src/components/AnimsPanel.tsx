import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Button,
  CircularProgress,
} from '@mui/material';
import { useAnims } from '../contexts/AnimsContext';
import { createLogger } from '../utils/logger';
import { timelineStyles as styles } from './styles/TimelineStyles';
import { guess as guessBPM } from 'web-audio-beat-detector';
import { TimerOutlined as BPMIcon } from '@mui/icons-material';
import { imageApi, videoApi } from '../services/api';
import { createOneShotAnimation, AnimationConfig, OneShotAnimation, CreateOneShotAnimationParams } from '../types/oneShotAnimation';
import { runAnimationWorkflow } from '../comfy/utils';

// Create a logger instance for this component
const logger = createLogger('AnimsPanel.tsx');

// Create a function to handle the animation creation
async function createAnimation(bpm: number, totalDurationSeconds: number): Promise<OneShotAnimation> {
  const config: AnimationConfig = {
    bpm,
    orientation: 'portrait', // TODO: Make this configurable
    totalDurationSeconds,
    beatInterval: 8 // TODO: Make this configurable
  };

  const params: CreateOneShotAnimationParams = {
    config,
    imageService: {
      getRandomImages: imageApi.getRandomImages.bind(imageApi)
    }
  };

  return createOneShotAnimation(params);
}

const AnimsPanel: React.FC = () => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<{ max: number; value: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [detectedBPM, setDetectedBPM] = useState<number | null>(null);
  const [animationDuration, setAnimationDuration] = useState<number>(10);
  
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
    
    // Use only the first file and ensure it's an audio file
    const file = files[0];
    if (!file.type.startsWith('audio/')) {
      logger.error('Dropped file is not an audio file (MP3/WAV)');
      return;
    }
    
    // Create URL for the audio preview
    const audioUrl = URL.createObjectURL(file);
    setSourceAnim(audioUrl);
    setAudioFile(file);
    logger.log(`Source audio set: ${file.name}`);
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
    if (!file.type.startsWith('audio/')) {
      logger.error('Selected file is not an audio file (MP3/WAV)');
      return;
    }
    
    // Clean up any existing source animation URL
    if (sourceAnim) {
      URL.revokeObjectURL(sourceAnim);
    }

    // Reset BPM when new file is selected
    setDetectedBPM(null);

    // Create URL for the audio preview
    const audioUrl = URL.createObjectURL(file);
    setSourceAnim(audioUrl);
    setAudioFile(file);
    logger.log(`Source audio set: ${file.name}`);
    
    // Reset the input to allow selecting the same file again
    e.target.value = '';
  }, [sourceAnim, setSourceAnim]);

  const handleGenerateAnimation = useCallback(async () => {
    if (!sourceAnim || !audioFile) return;
    try {
      setIsGenerating(true);
      logger.log('Starting BPM detection...');

      // Create AudioContext if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      // Fetch the audio file
      const response = await fetch(sourceAnim);
      const arrayBuffer = await response.arrayBuffer();

      // Decode the audio data
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

      // Detect BPM
      const result = await guessBPM(audioBuffer);

      let bpm: number | null = null;
      if (typeof result.bpm === 'number' && result.bpm > 0) {
        bpm = result.bpm;
        setDetectedBPM(bpm);
        logger.log(`Detected BPM: ${bpm}`);
      } else {
        logger.error('Could not detect BPM');
        setDetectedBPM(null);
        setIsGenerating(false);
        return;
      }

      logger.log('Starting animation generation...');
      // Create the one shot animation
      const animation = await createAnimation(bpm, animationDuration);
      logger.log(`Animation sequence created:  ${JSON.stringify(animation)}`);

      // Process each segment with ComfyUI
      for (const segment of animation.segments) {
        logger.log(`Processing segment starting at frame ${segment.startFrame}`);
        let response;
        try {
          response = await runAnimationWorkflow(
            segment.startFrame,
            segment.images,
            segment.durationInFrames,
            audioFile,
            (max, value) => {
              setGenerationProgress({ max, value });
            }
          );

          // Upload the returned video and image blobs to the API
          if (response && response.videoUrl && response.workflowUrl && response.promptId) {
            const filenameBase = `${response.promptId}-${segment.startFrame}-${segment.durationInFrames}`;

            // Fetch blobs from object URLs
            const videoBlob = await fetch(response.videoUrl).then(r => r.blob());

            // Upload video
            await videoApi.uploadGeneratedVideo(videoBlob, `${filenameBase}.mp4`);
          }

          // Add the generated animation to the list
          // TODO: Get the actual URL from the ComfyUI response
          setGeneratedAnims(prev => [...prev, {
            url: 'placeholder-url',
            added: false,
            selected: false
          }]);
        } catch (error) {
          logger.error('Error processing segment:', error);
          // Continue with other segments even if one fails
        }
      }

      logger.log('Animation generation completed');
    } catch (error) {
      logger.error('Animation generation failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  }, [sourceAnim, audioFile, setGeneratedAnims, animationDuration]);

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
              accept="audio/mp3,audio/wav"
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
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
              <p>Drop audio file (MP3/WAV) or click to select</p>
            </div>
          </div>

          {/* Show detected BPM if available */}
          {detectedBPM && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" color="primary">
                BPM: {detectedBPM.toFixed(1)}
              </Typography>
            </Box>
          )}

          {/* Animation Duration Input */}
          <Box sx={{ mt: 2 }}>
            <label htmlFor="animation-duration-input">
              <Typography variant="body2" color="text.secondary">
                Animation Duration (seconds):
              </Typography>
            </label>
            <input
              id="animation-duration-input"
              type="number"
              min={1}
              value={animationDuration}
              onChange={e => setAnimationDuration(Number(e.target.value))}
              style={{ width: 80, marginTop: 4, color: '#000' }}
            />
          </Box>

          {/* Generate Animation Button */}
          {audioFile && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleGenerateAnimation}
                disabled={isGenerating || !audioFile}
                startIcon={isGenerating ? <CircularProgress size={20} /> : null}
                fullWidth
              >
                {isGenerating ? 'Generating Animation...' : 'Generate Animation'}
              </Button>
              {isGenerating && generationProgress && (
                <Box sx={{ width: '100%', mt: 1 }}>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Processing frame {generationProgress.value} of {generationProgress.max}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Generated animations grid */}
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              height: '100%', 
              minHeight: '70vh',
              overflow: 'auto',
              mt: 2
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
              <audio
                src={sourceAnim}
                controls
                style={{
                  width: '100%',
                  display: 'block',
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