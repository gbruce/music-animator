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
} from '@mui/material';
import { useComfyUI } from '../contexts/ComfyUIContext';
import WorkflowStatusDisplay from './WorkflowStatusDisplay';
import flux from './flux-workflow.json';

const Txt2ImgPanel: React.FC = () => {
  // State variables
  const [seed, setSeed] = useState<number>(0);
  const [width, setWidth] = useState<number>(720);
  const [height, setHeight] = useState<number>(1280);
  const [prompt, setPrompt] = useState<string>("a rabbit in a field");
  const [batchCount, setBatchCount] = useState<number>(1);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Use the global ComfyUI context
  const { status, statusMessage, progress, runWorkflow, resetStatus } = useComfyUI();

  // Reset generation state when status changes to success or error
  useEffect(() => {
    if (status === 'success' || status === 'error') {
      setIsGenerating(false);
    }
  }, [status]);

  // Generate random seed function
  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 999999999);
    setSeed(randomSeed);
  };

  // Handle generate button click
  const handleGenerate = useCallback(async () => {
    // Don't allow starting a new generation if one is already in progress
    if (isGenerating) return;

    try {
      // Set local state to prevent multiple generations
      setIsGenerating(true);
      
      // Reset ComfyUI status to ensure a clean start
      resetStatus();
      
      // Create a deep copy of the flux workflow
      const workflowCopy = JSON.parse(JSON.stringify(flux));
      
      // Update the workflow with our parameters
      // Set the seed
      workflowCopy[25].inputs.noise_seed = seed === 0 ? Math.floor(Math.random() * 999999999) : seed;
      
      // Set the prompt
      workflowCopy[31].inputs.prompt = prompt;
      
      // Set batch size if supported
      if (workflowCopy[27] && workflowCopy[27].inputs.batch_size !== undefined) {
        workflowCopy[27].inputs.batch_size = batchCount;
      }
      
      try {
        // Run the workflow and wait for completion
        const response = await runWorkflow(workflowCopy);
        
        // Process the result when workflow completes
        console.log('Workflow completed:', response);

        // Process images from the response
        if (response && response.images) {
          for (const image of response.images) {
            if(image.type === "url"){
              const { data: url } = image;
              const res = await fetch(url);
              const blob = await res.blob();
              const imageUrl = URL.createObjectURL(blob);
              setGeneratedImages(prev => [...prev, imageUrl]);
            }
          }
        } else {
          // Fallback to placeholder for now
          const placeholderImageUrl = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;
          setGeneratedImages(prev => [...prev, placeholderImageUrl]);
        }
      } catch (error) {
        console.error('Error processing workflow:', error);
      } finally {
        // Make sure isGenerating is reset after workflow is complete
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Error generating images:', error);
      setIsGenerating(false);
    }
  }, [batchCount, height, prompt, runWorkflow, seed, width, isGenerating, resetStatus]);

  // Determine if the generate button should be disabled
  const isGenerateButtonDisabled = status === 'loading' || status === 'processing' || isGenerating;

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
            <Typography variant="h6" gutterBottom>Generated Images</Typography>
            
            <Grid container spacing={2}>
              {generatedImages.length > 0 ? (
                generatedImages.map((imgUrl, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 1, 
                        position: 'relative',
                        '&:hover': {
                          boxShadow: 6
                        }
                      }}
                    >
                      <Box 
                        component="img"
                        src={imgUrl}
                        alt={`Generated image ${index + 1}`}
                        sx={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: 1,
                          display: 'block'
                        }}
                      />
                      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                        Image {index + 1}
                      </Typography>
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
            <Typography variant="h6" gutterBottom>Text to Image Controls</Typography>
            
            {/* Status display */}
            <WorkflowStatusDisplay 
              status={status} 
              message={statusMessage} 
              progress={progress} 
            />
            
            {/* Generate button */}
            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleGenerate}
              disabled={isGenerateButtonDisabled}
              sx={{ mb: 3, mt: 2 }}
            >
              Generate
            </Button>
            
            {/* Seed input */}
            <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
              <InputLabel htmlFor="seed-input">Seed (0 for random)</InputLabel>
              <OutlinedInput
                id="seed-input"
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                endAdornment={
                  <InputAdornment position="end">
                    <Button 
                      size="small" 
                      onClick={generateRandomSeed}
                      disabled={isGenerateButtonDisabled}
                    >
                      Random
                    </Button>
                  </InputAdornment>
                }
                label="Seed (0 for random)"
              />
            </FormControl>
            
            {/* Resolution controls */}
            <Typography variant="subtitle2" gutterBottom>Resolution</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  variant="outlined"
                  size="small"
                  disabled={isGenerateButtonDisabled}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  variant="outlined"
                  size="small"
                  disabled={isGenerateButtonDisabled}
                />
              </Grid>
            </Grid>
            
            {/* Prompt input */}
            <TextField
              fullWidth
              label="Prompt"
              multiline
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              variant="outlined"
              sx={{ mb: 3 }}
              disabled={isGenerateButtonDisabled}
            />
            
            {/* Batch count */}
            <Typography id="batch-count-slider" gutterBottom>
              Batch Count: {batchCount}
            </Typography>
            <Slider
              value={batchCount}
              onChange={(_, newValue) => setBatchCount(newValue as number)}
              aria-labelledby="batch-count-slider"
              valueLabelDisplay="auto"
              step={1}
              marks
              min={1}
              max={10}
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