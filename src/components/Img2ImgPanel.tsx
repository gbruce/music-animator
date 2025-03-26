import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Paper,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  ButtonGroup,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useComfyUI, StatusMessageModifier } from '../contexts/ComfyUIContext';
import { Client } from '@stable-canvas/comfyui-client';
import { useImages } from '../contexts/ImageContext';
import { useImg2Img } from '../contexts/Img2ImgContext';
import WorkflowStatusDisplay from './WorkflowStatusDisplay';
import img2imgWorkflow from './img2img-workflow.json';
import { createLogger } from '../utils/logger';

// Create a logger instance for this component
const logger = createLogger('Img2ImgPanel.tsx');

// Resolution presets
const PORTRAIT_RESOLUTION = { width: 720, height: 1280 };
const LANDSCAPE_RESOLUTION = { width: 1280, height: 720 };

type OrientationType = 'portrait' | 'landscape';

const Img2ImgPanel: React.FC = () => {
  // State variables
  const [orientation, setOrientation] = useState<OrientationType>('portrait');
  const [batchCount, setBatchCount] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Keep track of the source image file name so we can upload it to ComfyUI
  const [sourceImageFileName, setSourceImageFileName] = useState<string | null>(null);
  
  // Use context instead of local state for generated images
  const { 
    generatedImages, 
    setGeneratedImages,
    sourceImage,
    setSourceImage
  } = useImg2Img();
  
  // Images context for saving to main gallery
  const { uploadImage } = useImages();
  
  // Derived width and height based on orientation
  const { width, height } = orientation === 'portrait' ? PORTRAIT_RESOLUTION : LANDSCAPE_RESOLUTION;
  
  // Use the global ComfyUI context
  const { status, statusMessage, progress, runWorkflow, cancelWorkflow, resetStatus } = useComfyUI();

  // Reset generation state when status changes to success, error, or cancelled
  useEffect(() => {
    if (status === 'success' || status === 'error' || status === 'cancelled') {
      logger.log(`Workflow status changed to: ${status}`);
      setIsGenerating(false);
    }
  }, [status]);

  // Handle orientation change
  const handleOrientationChange = (_event: React.MouseEvent<HTMLElement>, newOrientation: OrientationType | null) => {
    if (newOrientation !== null) {
      logger.log(`Orientation changed to: ${newOrientation}`);
      setOrientation(newOrientation);
    }
  };

  // Handle cancel button click
  const handleCancel = useCallback(() => {
    logger.log('User clicked cancel button');
    cancelWorkflow();
  }, [cancelWorkflow]);

  // Handle file drop
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    // Use only the first file and ensure it's an image
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      logger.error('Dropped file is not an image');
      return;
    }
    
    // Store the original file for upload to ComfyUI later
    // @ts-ignore - Adding a custom property to store the original file
    window._lastSourceFile = file;
    
    // Create URL for the image preview
    const imageUrl = URL.createObjectURL(file);
    setSourceImage(imageUrl);
    setSourceImageFileName(file.name);
    logger.log(`Source image set: ${file.name}`);
  }, [setSourceImage]);
  
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
    if (!file.type.startsWith('image/')) {
      logger.error('Selected file is not an image');
      return;
    }
    
    // Store the original file for upload to ComfyUI later
    // @ts-ignore - Adding a custom property to store the original file
    window._lastSourceFile = file;

    // Clean up any existing source image URL
    if (sourceImage) {
      URL.revokeObjectURL(sourceImage);
    }

    // Create URL for the image preview
    const imageUrl = URL.createObjectURL(file);
    setSourceImage(imageUrl);
    setSourceImageFileName(file.name);
    logger.log(`Source image set: ${file.name}`);
    
    // Reset the input to allow selecting the same file again
    e.target.value = '';
  }, [setSourceImage]);
  
  // Clear source image
  const clearSourceImage = useCallback(() => {
    if (sourceImage) {
      URL.revokeObjectURL(sourceImage);
    }
    setSourceImage(null);
    setSourceImageFileName(null);
    // Clear the stored file reference
    // @ts-ignore
    window._lastSourceFile = null;
    logger.log('Source image cleared');
  }, [sourceImage, setSourceImage]);

  // Handle generate button click
  const handleGenerate = useCallback(async () => {
    // Don't allow starting a new generation if one is already in progress
    if (isGenerating) return;
    
    // Ensure there's a source image
    if (!sourceImage) {
      logger.error('No source image selected');
      return;
    }

    try {
      // Reset the logger timer to measure the generation process
      logger.resetTimer();
      logger.log('Starting image generation process');
      
      // Set local state to prevent multiple generations
      setIsGenerating(true);
      
      // Reset ComfyUI status to ensure a clean start
      resetStatus();
      
      // Create a deep copy of the workflow
      const workflowCopy = JSON.parse(JSON.stringify(img2imgWorkflow));
      
      // Set the resolution
      // const resolutionSetting = orientation === 'portrait' ? "1152x2560 (9:16) - Portrait Ultra Large" : "2560x1152 (16:9) - Ultra Wide Large";
      // workflowCopy[33].inputs.size_selected = resolutionSetting;
      // logger.log(`Using resolution: ${resolutionSetting}`);
      
      // // Set batch size to 1 for sequential processing
      // if (workflowCopy[27] && workflowCopy[27].inputs.batch_size !== undefined) {
      //   workflowCopy[27].inputs.batch_size = 1;
      //   logger.log(`Set batch size to 1 for sequential processing. Will generate ${batchCount} images in series.`);
      // }
      
      try {
        // Variable to store the uploaded image name for reuse
        let uploadedImageName: string | null = null;
        
        // Process images one by one
        for (let i = 0; i < batchCount; i++) {
          
          logger.log(`Generating image ${i+1} of ${batchCount}`);
          
          // Update seed for each iteration
          const newSeed = Math.floor(Math.random() * 999999999);
          workflowCopy[30].inputs.seed = newSeed;
          logger.log(`Using new random seed for image ${i+1}: ${newSeed}`);

          workflowCopy[23].inputs.swap_dimensions = orientation === 'portrait' ? 'Off' : 'On';
          
          // Create a message modifier function to add the image count prefix
          const imageCountMessageModifier = (message: string) => {
            return `[Image ${i+1}/${batchCount}] ${message}`;
          };
          
          // Only set the onBeforeQueueing callback for the first iteration
          let onBeforeQueueing = undefined;
          
          // If this is the first iteration or we don't have an uploaded image name yet
          if (i === 0 || !uploadedImageName) {
            onBeforeQueueing = async (client: Client) => {
              try {
                logger.log(`Uploading source image to ComfyUI for image ${i+1}`);
                
                // Use the stored file if available
                // @ts-ignore
                const sourceFile = window._lastSourceFile;
                
                if (!sourceFile) {
                  throw new Error('Source file not available');
                }
                
                // Create form data for the upload
                const formData = new FormData();
                formData.append('image', sourceFile);
                
                // Make a direct POST request to the ComfyUI upload endpoint
                const uploadResponse = await client.fetchApi('/api/upload/image', {
                  method: 'POST',
                  body: formData,
                });
                
                if (!uploadResponse.ok) {
                  throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
                }
                
                const uploadResult = await uploadResponse.json();
                
                if (!uploadResult || !uploadResult.name) {
                  throw new Error('Failed to get upload result from ComfyUI');
                }
                
                // Cache the uploaded image name for future iterations
                uploadedImageName = uploadResult.name;
                
                logger.log(`Image uploaded successfully to ComfyUI: ${uploadedImageName}`);
                
                // Update the LoadImage node with the uploaded image name
                if (workflowCopy[28] && workflowCopy[28].class_type === "LoadImage") {
                  workflowCopy[28].inputs.image = uploadedImageName;
                  logger.log(`Updated LoadImage node with image: ${uploadedImageName}`);
                } else {
                  logger.warn('Could not find LoadImage node in workflow');
                }
              } catch (error) {
                logger.error('Error uploading image to ComfyUI', error);
                throw error;
              }
            };
          } else {
            // For subsequent iterations, just update the image name in the workflow
            logger.log(`Reusing previously uploaded image: ${uploadedImageName}`);
            if (workflowCopy[28] && workflowCopy[28].class_type === "LoadImage") {
              workflowCopy[28].inputs.image = uploadedImageName;
            }
          }
          
          // Run the workflow with the message modifier and image upload function
          const response = await runWorkflow(workflowCopy, onBeforeQueueing, undefined, imageCountMessageModifier);
          
          // If the response is null, it means the generation was cancelled
          if (response === null) {
            logger.log('Generation was cancelled during workflow execution');
            break;
          }
          
          // Process the result when workflow completes
          logger.log(`Workflow for image ${i+1} completed successfully`);
          
          // Process image from the response
          if (response && response.images && response.images.length > 0) {
            logger.log(`Processing image ${i+1}`);

            for (const image of response.images) {
              if (image.type === "url") {
                const { data: url } = image;
                logger.log(`Fetching image ${i+1} from URL: ${url}`);
                const res = await fetch(url);
                const blob = await res.blob();
                const imageUrl = URL.createObjectURL(blob);
                setGeneratedImages(prev => [...prev, { url: imageUrl, added: false, selected: false }]);
                logger.log(`Image ${i+1} added to gallery`);
              }
            }
          } else {
            // Fallback to placeholder
            logger.warn(`No image data received for image ${i+1}, using placeholder`);
            const placeholderImageUrl = `https://picsum.photos/${width}/${height}?random=${Date.now() + i}`;
            setGeneratedImages(prev => [...prev, { url: placeholderImageUrl, added: false, selected: false }]);
          }
        }
        
        if (status !== 'cancelled') {
          logger.log(`All ${batchCount} images have been generated and added to the gallery`);
        }
      } catch (error) {
        logger.error('Error processing workflow', error);
      } finally {
        // Make sure isGenerating is reset after workflow is complete
        logger.log('Generation process completed');
        setIsGenerating(false);
      }
    } catch (error) {
      logger.error('Error generating images', error);
      setIsGenerating(false);
    }
  }, [batchCount, height, sourceImage, sourceImageFileName, runWorkflow, width, isGenerating, resetStatus, orientation, status, cancelWorkflow, setGeneratedImages]);

  // Remove an image from the generated images list
  const removeImage = useCallback((index: number) => {
    logger.log(`Removing image at index ${index}`);
    setGeneratedImages(prev => prev.filter((_, i) => i !== index));
  }, [setGeneratedImages]);

  // Log component mounted
  useEffect(() => {
    logger.log('Img2ImgPanel component mounted');
    return () => {
      logger.log('Img2ImgPanel component unmounted');
    };
  }, [sourceImage]);

  // Determine if the generate button should be disabled
  const isGenerateButtonDisabled = status === 'loading' || status === 'processing' || !sourceImage;

  // Determine if the cancel button should be shown
  const shouldShowCancelButton = status === 'loading' || status === 'processing';

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Grid container spacing={4}>
        {/* Left side - Image grid */}
        <Grid item xs={12} md={8}>
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
              <Typography variant="h6">Generated Images</Typography>
            </Box>
            
            <Grid container spacing={2}>
              {generatedImages.length > 0 ? (
                generatedImages.map((img, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 1, 
                        position: 'relative',
                        border: theme => img.added ? `2px solid ${theme.palette.success.main}` : '1px solid rgba(0,0,0,0.12)',
                        '&:hover': {
                          boxShadow: 6
                        },
                      }}
                    >
                      {img.added && (
                        <Tooltip title="Added to gallery">
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: 'success.main',
                              color: 'white',
                              borderRadius: '50%',
                              width: 24,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 1,
                            }}
                          >
                            ✓
                          </Box>
                        </Tooltip>
                      )}
                      
                      <Box 
                        component="img"
                        src={img.url}
                        alt={`Generated image ${index + 1}`}
                        sx={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: 1,
                          display: 'block'
                        }}
                      />
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 1
                      }}>
                        <Typography variant="caption">
                          Image {index + 1}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {!img.added && (
                            <Tooltip title="Add to gallery">
                              <IconButton 
                                size="small"
                                onClick={async () => {
                                  try {
                                    const response = await fetch(img.url);
                                    const blob = await response.blob();
                                    const filename = `generated-${Date.now()}.png`;
                                    const file = new File([blob], filename, { type: 'image/png' });
                                    await uploadImage(file, undefined);
                                    setGeneratedImages(prev => 
                                      prev.map((i, idx) => 
                                        idx === index ? {...i, added: true} : i
                                      )
                                    );
                                  } catch (error) {
                                    logger.error('Error adding image to gallery:', error);
                                  }
                                }}
                              >
                                <Box sx={{ 
                                  fontSize: '20px',
                                  lineHeight: 1, 
                                  width: 20, 
                                  height: 20, 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center' 
                                }}>
                                  +
                                </Box>
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          <Tooltip title="Remove from panel">
                            <IconButton 
                              size="small"
                              color="error"
                              onClick={() => removeImage(index)}
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
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))
              ) : (
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
                      No images generated yet. Use the controls on the right to generate images.
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Right side - Controls */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2 }}>
            {/* Status display */}
            <WorkflowStatusDisplay 
              status={status} 
              message={statusMessage} 
              progress={progress} 
            />
            
            {/* Generate/Cancel buttons */}
            {shouldShowCancelButton ? (
              <ButtonGroup fullWidth variant="contained" sx={{ mb: 3, mt: 2 }}>
                <Button 
                  disabled={true}
                  sx={{ opacity: 0.5 }}
                >
                  Generate
                </Button>
                <Button 
                  color="error"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </ButtonGroup>
            ) : (
              <Button 
                variant="contained" 
                fullWidth 
                onClick={handleGenerate}
                disabled={isGenerateButtonDisabled}
                sx={{ mb: 3, mt: 2 }}
              >
                Generate
              </Button>
            )}
            
            {/* Resolution orientation toggle */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <ToggleButtonGroup
                  value={orientation}
                  exclusive
                  onChange={handleOrientationChange}
                  aria-label="image orientation"
                  size="small"
                  disabled={isGenerateButtonDisabled}
                  sx={{ mr: 2 }}
                >
                  <ToggleButton value="portrait" aria-label="portrait orientation">
                    Portrait
                  </ToggleButton>
                  <ToggleButton value="landscape" aria-label="landscape orientation">
                    Landscape
                  </ToggleButton>
                </ToggleButtonGroup>
                <Typography variant="body2" color="text.secondary">
                  {width} × {height}
                </Typography>
              </Box>
            </Box>
            
            {/* Image drop zone */}
            <Box sx={{ mb: 3 }}>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              
              {sourceImage ? (
                <Box sx={{ 
                  mb: 2,
                  position: 'relative',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  <Box 
                    component="img"
                    src={sourceImage}
                    alt="Source image"
                    sx={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      borderRadius: 1,
                    }}
                  />
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={clearSourceImage}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      minWidth: 'auto',
                      width: 32,
                      height: 32,
                      p: 0,
                    }}
                  >
                    ×
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    border: theme => isDragging 
                      ? `2px dashed ${theme.palette.primary.main}` 
                      : '2px dashed rgba(0,0,0,0.2)',
                    borderRadius: 1,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    bgcolor: isDragging ? 'rgba(0,0,0,0.05)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 200,
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={openFileDialog}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: 'rgba(0,0,0,0.3)', marginBottom: 16 }}
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Drag & drop or click to select
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Supported formats: JPG, PNG, WEBP
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* Batch count */}
            <Typography id="batch-count-slider" gutterBottom>
              Batch Count: {batchCount} (Max: 20)
            </Typography>
            <Slider
              value={batchCount}
              onChange={(_, newValue) => setBatchCount(newValue as number)}
              aria-labelledby="batch-count-slider"
              valueLabelDisplay="auto"
              step={1}
              marks
              min={1}
              max={20}
              disabled={isGenerateButtonDisabled}
              sx={{ mb: 3 }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Img2ImgPanel;
