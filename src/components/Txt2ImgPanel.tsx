import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Slider,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
} from '@mui/material';

type GenerationStatus = 'idle' | 'generating' | 'completed' | 'error';

const Txt2ImgPanel: React.FC = () => {
  // State variables
  const [seed, setSeed] = useState<number>(0);
  const [width, setWidth] = useState<number>(720);
  const [height, setHeight] = useState<number>(1280);
  const [prompt, setPrompt] = useState<string>("a rabbit in a field");
  const [batchCount, setBatchCount] = useState<number>(1);
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to generate');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // Generate random seed function
  const generateRandomSeed = () => {
    const randomSeed = Math.floor(Math.random() * 999999999);
    setSeed(randomSeed);
  };

  // Mock function to simulate image generation
  const handleGenerate = () => {
    setStatus('generating');
    setStatusMessage('Starting generation process...');
    setProgress(0);
    
    // Simulate generation process with progress updates
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);
      setStatusMessage(`Generating: ${currentProgress}% complete`);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setStatus('completed');
        setStatusMessage('Generation completed successfully!');
        
        // Add a placeholder image to the grid (in a real app, this would be the generated image)
        const placeholderImageUrl = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;
        setGeneratedImages(prev => [...prev, placeholderImageUrl]);
      }
    }, 300);
  };

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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              {status === 'generating' && (
                <CircularProgress size={16} sx={{ mr: 1 }} value={progress} variant="determinate" />
              )}
              <Typography 
                variant="body2" 
                color={
                  status === 'idle' ? 'text.secondary' : 
                  status === 'generating' ? 'info.main' :
                  status === 'completed' ? 'success.main' : 'error.main'
                }
              >
                {statusMessage}
              </Typography>
            </Box>
            
            {/* Generate button */}
            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleGenerate}
              disabled={status === 'generating'}
              sx={{ mb: 3 }}
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
                      disabled={status === 'generating'}
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
                  disabled={status === 'generating'}
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
                  disabled={status === 'generating'}
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
              disabled={status === 'generating'}
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
              disabled={status === 'generating'}
              sx={{ mb: 3 }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Txt2ImgPanel; 