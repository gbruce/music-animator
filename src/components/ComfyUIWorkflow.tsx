import React, { useState, useEffect, useCallback } from 'react';
import { Client, Workflow } from '@stable-canvas/comfyui-client';
import { Box, Typography, CircularProgress } from '@mui/material';

// Status type definition
export type WorkflowStatus = 'idle' | 'loading' | 'processing' | 'success' | 'error';

// Initialize ComfyUI client
const client = new Client({
  api_host: 'localhost:8188'
});
client.connect();

// Define a simple workflow
const generateImageWorkflow = () => {
  const workflow = new Workflow();
  
  // Create workflow nodes
  const [emptyLatent] = workflow.node("EmptyLatentImage", {
    width: 512,
    height: 512,
    batch_size: 1
  });
  
  const [model, clip, vae] = workflow.node("CheckpointLoaderSimple", {
    ckpt_name: "v1-5-pruned-emaonly.safetensors" // Use a model that exists in your ComfyUI models folder
  });
  
  const [positivePrompt] = workflow.node("CLIPTextEncode", {
    text: "beautiful landscape, mountains, sunset, high quality, detailed",
    clip
  });
  
  const [negativePrompt] = workflow.node("CLIPTextEncode", {
    text: "blurry, low quality, watermark",
    clip
  });
  
  const [sampledLatent] = workflow.node("KSampler", {
    seed: Math.floor(Math.random() * 1000000),
    steps: 20,
    cfg: 7,
    sampler_name: "euler_ancestral",
    scheduler: "normal",
    denoise: 1,
    model,
    positive: positivePrompt,
    negative: negativePrompt,
    latent_image: emptyLatent
  });
  
  const [decodedImage] = workflow.node("VAEDecode", {
    samples: sampledLatent,
    vae
  });
  
  workflow.node("SaveImage", {
    images: decodedImage,
    filename_prefix: `track-image-${Date.now()}`
  });
  
  return workflow;
};

// Custom hook to use ComfyUI workflow
export const useComfyUIWorkflow = (trackId: string, onComplete?: (result: any) => void) => {
  const [status, setStatus] = useState<WorkflowStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [result, setResult] = useState<any>(null);

  // Function to run the workflow
  const runWorkflow = useCallback(async () => {
    try {
      setStatus('loading');
      setStatusMessage('Preparing workflow...');
      
      // Create workflow and get an instance
      const workflow = generateImageWorkflow();
      const instance = workflow.instance(client);
    
      // Subscribe to progress events
      instance.on('execution_start', () => {
        setStatus('processing');
        setStatusMessage('Processing started...');
      });
      
      instance.on('execution_cached', () => {
        setStatusMessage('Using cached results...');
      });
      
      instance.on('executing', (data: any) => {
        const { node } = data;
        setStatusMessage(`Executing node: ${node}...`);
      });
      
      instance.on('progress', (data: any) => {
        const { value, max } = data;
        const percentage = Math.round((value / max) * 100);
        setProgress(percentage);
        setStatusMessage(`Processing: ${percentage}%`);
      });
      
      // Enqueue the workflow
      await instance.enqueue();
      
      // Wait for the result
      const response = await instance.wait();
      
      setResult(response);
      setStatus('success');
      setStatusMessage('Process completed successfully!');
      
      if (onComplete) {
        onComplete(response);
      }
      
    } catch (error) {
      console.error('Error running ComfyUI workflow:', error);
      setStatus('error');
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [onComplete, trackId]);

  // Clean up function
  useEffect(() => {
    return () => {
      // Clean up any resources if needed
    };
  }, []);

  return {
    status,
    statusMessage,
    progress,
    result,
    runWorkflow
  };
};

// Status display component
export const WorkflowStatusDisplay: React.FC<{ status: WorkflowStatus; message: string; progress: number }> = ({ 
  status, 
  message, 
  progress 
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
      {(status === 'loading' || status === 'processing') && (
        <CircularProgress size={16} sx={{ mr: 1 }} variant={status === 'processing' ? "determinate" : "indeterminate"} value={progress} />
      )}
      <Typography 
        variant="body2" 
        color={
          status === 'idle' ? 'text.secondary' : 
          status === 'loading' || status === 'processing' ? 'info.main' :
          status === 'success' ? 'success.main' : 'error.main'
        }
      >
        {message || (status === 'idle' ? 'Ready to generate' : '')}
      </Typography>
    </Box>
  );
}; 