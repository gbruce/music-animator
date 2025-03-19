import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Client } from '@stable-canvas/comfyui-client';

// ComfyUI workflow status type
export type WorkflowStatus = 'idle' | 'loading' | 'processing' | 'success' | 'error';

interface ComfyUIContextType {
  status: WorkflowStatus;
  progress: number;
  statusMessage: string;
  runWorkflow: (workflow: any, onComplete?: (result: any) => void) => Promise<any>;
  resetStatus: () => void;
}

const ComfyUIContext = createContext<ComfyUIContextType | undefined>(undefined);

export const ComfyUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<WorkflowStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Reset status to idle
  const resetStatus = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setStatusMessage('');
  }, []);

  // Function to run a workflow
  const runWorkflow = useCallback(async (workflow: any, onComplete?: (result: any) => void) => {
    try {
      setStatus('loading');
      setStatusMessage('Preparing workflow...');

      // Create and initialize ComfyUI client
        const comfyClient = new Client({
            api_host: 'localhost:8188'
        });
      comfyClient.connect();
  
      // Reset cache before running workflow
      comfyClient.resetCache();
      
      // Enqueue the workflow
      const response = await comfyClient.enqueue(
        workflow,
        {
          progress: ({ max, value}) => {
            const percentage = Math.round((value / max) * 100);
            setProgress(percentage);
            setStatus('processing');
            setStatusMessage(`Processing: ${percentage}%`);
          },
        }
      );

      setStatus('success');
      setStatusMessage('Process completed successfully!');
      
      if (onComplete) {
        onComplete(response);
      }
      
      comfyClient.disconnect();
      return response;
    } catch (error) {
      console.error('Error running ComfyUI workflow:', error);
      setStatus('error');
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, []);

  const value = {
    status,
    progress,
    statusMessage,
    runWorkflow,
    resetStatus
  };

  return (
    <ComfyUIContext.Provider value={value}>
      {children}
    </ComfyUIContext.Provider>
  );
};

export const useComfyUI = () => {
  const context = useContext(ComfyUIContext);
  if (context === undefined) {
    throw new Error('useComfyUI must be used within a ComfyUIProvider');
  }
  return context;
}; 