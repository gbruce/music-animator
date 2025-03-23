import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  TextField,
  Typography,
  Paper,
  Slider,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  ButtonGroup,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useComfyUI, StatusMessageModifier } from '../contexts/ComfyUIContext';
import { useImages } from '../contexts/ImageContext';
import { useTxt2Img, GeneratedImage } from '../contexts/Txt2ImgContext';
import WorkflowStatusDisplay from './WorkflowStatusDisplay';
import flux from './flux-workflow.json';
import { createLogger } from '../utils/logger';

// Create a logger instance for this component
const logger = createLogger('Txt2ImgPanel.tsx');

// Resolution presets
const PORTRAIT_RESOLUTION = { width: 720, height: 1280 };
const LANDSCAPE_RESOLUTION = { width: 1280, height: 720 };

type OrientationType = 'portrait' | 'landscape';

const Txt2ImgPanel: React.FC = () => {
  // State variables
  const [orientation, setOrientation] = useState<OrientationType>('portrait');
  const [prompt, setPrompt] = useState<string>("a rabbit in a field");
  const [batchCount, setBatchCount] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Use context instead of local state for generated images
  const { 
    generatedImages, 
    setGeneratedImages
  } = useTxt2Img();
  
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

  // Handle generate button click
  const handleGenerate = useCallback(async () => {
    // Don't allow starting a new generation if one is already in progress
    if (isGenerating) return;

    try {
      // Reset the logger timer to measure the generation process
      logger.resetTimer();
      logger.log('Starting image generation process');
      
      // Set local state to prevent multiple generations
      setIsGenerating(true);
      
      // Reset ComfyUI status to ensure a clean start
      resetStatus();
      
      // Create a deep copy of the flux workflow
      const workflowCopy = JSON.parse(JSON.stringify(flux));
      
      // Update the workflow with our parameters
      // Set random seed
      const seedValue = Math.floor(Math.random() * 999999999);
      workflowCopy[25].inputs.noise_seed = seedValue;
      logger.log(`Using seed: ${seedValue}`);
      
      // Set the prompt
      workflowCopy[31].inputs.prompt = prompt;
      logger.log(`Using prompt: "${prompt}"`);
      
      // Set the resolution
      const resolutionSetting = orientation === 'portrait' ? "1152x2560 (9:16) - Portrait Ultra Large" : "2560x1152 (16:9) - Ultra Wide Large";
      workflowCopy[33].inputs.size_selected = resolutionSetting;
      logger.log(`Using resolution: ${resolutionSetting}`);
      
      // Set batch size to 1 for sequential processing
      if (workflowCopy[27] && workflowCopy[27].inputs.batch_size !== undefined) {
        workflowCopy[27].inputs.batch_size = 1;
        logger.log(`Set batch size to 1 for sequential processing. Will generate ${batchCount} images in series.`);
      }
      
      try {
        // Process images one by one
        for (let i = 0; i < batchCount; i++) {
          
          logger.log(`Generating image ${i+1} of ${batchCount}`);
          
          // Update seed for each iteration
          const newSeed = Math.floor(Math.random() * 999999999);
          workflowCopy[25].inputs.noise_seed = newSeed;
          logger.log(`Using new random seed for image ${i+1}: ${newSeed}`);
          
          // Run the workflow and wait for completion
          logger.log(`Sending workflow to ComfyUI for image ${i+1}`);
          
          // Create a message modifier function to add the image count prefix
          const imageCountMessageModifier = (message: string) => {
            return `[Image ${i+1}/${batchCount}] ${message}`;
          };
          
          // Run the workflow with the message modifier
          const response = await runWorkflow(workflowCopy, undefined, imageCountMessageModifier);
          
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
  }, [batchCount, height, prompt, runWorkflow, width, isGenerating, resetStatus, orientation, status, cancelWorkflow, setGeneratedImages]);

  // Remove an image from the generated images list
  const removeImage = useCallback((index: number) => {
    logger.log(`Removing image at index ${index}`);
    setGeneratedImages(prev => prev.filter((_, i) => i !== index));
  }, [setGeneratedImages]);

  // Log component mounted
  useEffect(() => {
    logger.log('Txt2ImgPanel component mounted');
    return () => {
      logger.log('Txt2ImgPanel component unmounted');
    };
  }, []);

  // Determine if the generate button should be disabled
  const isGenerateButtonDisabled = status === 'loading' || status === 'processing';

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
            
            {/* Prompt input */}
            <TextField
              fullWidth
              label="Prompt"
              multiline
              rows={10}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              variant="outlined"
              sx={{ mb: 3 }}
              disabled={isGenerateButtonDisabled}
            />
            
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

export default Txt2ImgPanel; 