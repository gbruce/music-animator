import { useCallback } from 'react';
import { useComfyUI } from '../contexts/ComfyUIContext';
import flux from './flux-workflow.json';
import { Client } from '@stable-canvas/comfyui-client';

// Custom hook to use ComfyUI workflow with the global client
export const useComfyUIWorkflow = (trackId: string, onBeforeQueueing?: (client: Client) => Promise<void>) => {
  const { status, statusMessage, progress, runWorkflow } = useComfyUI();

  // Function to run the workflow
  const runTrackWorkflow = useCallback(async () => {
    try {
      // Modify workflow with random seed
      const workflowCopy = JSON.parse(JSON.stringify(flux));
      workflowCopy[25].inputs.noise_seed = Math.floor(Math.random() * 1000);
      
      // Run the workflow using the global client
      return await runWorkflow(workflowCopy, onBeforeQueueing);
    } catch (error) {
      console.error('Error running track workflow:', error);
      throw error;
    }
  }, [onBeforeQueueing, runWorkflow, trackId]);

  return {
    status,
    statusMessage,
    progress,
    runWorkflow: runTrackWorkflow
  };
}; 