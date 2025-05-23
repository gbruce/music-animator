import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { Client } from '@stable-canvas/comfyui-client';

import { createLogger } from '../utils/logger';
const logger = createLogger('ComfyUIContext.tsx');


// ComfyUI workflow status type
export type WorkflowStatus = 'idle' | 'loading' | 'processing' | 'success' | 'error' | 'cancelled';

// Message modifier function type
export type StatusMessageModifier = (message: string) => string;

interface ComfyUIContextType {
  status: WorkflowStatus;
  progress: number;
  statusMessage: string;
  runWorkflow: (workflow: any, onBeforeQueueing?: (client: Client) => Promise<void>, onComplete?: (result: any) => void, messageModifier?: StatusMessageModifier) => Promise<any>;
  cancelWorkflow: () => void;
  resetStatus: () => void;
}

const ComfyUIContext = createContext<ComfyUIContextType | undefined>(undefined);

export const ComfyUIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<WorkflowStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Reference to the current client instance
  const clientRef = useRef<Client | null>(null);
  // Cancellation flag
  const isCancelledRef = useRef<boolean>(false);

  // Reset status to idle
  const resetStatus = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setStatusMessage('');
    isCancelledRef.current = false;
  }, []);

  // Cancel the current workflow
  const cancelWorkflow = useCallback(() => {
    logger.log('Cancelling workflow');
    isCancelledRef.current = true;
    
    if (clientRef.current) {
      // Since there's no direct cancel method, we'll rely on our flag
      // and update the UI immediately to reflect cancellation
      logger.log('Setting cancelled state');
      setStatus('cancelled');
      setStatusMessage('Generation cancelled by user');
      
      // Try to clean up the connection
      try {
        clientRef.current.interrupt().then(() => {
          if (!clientRef.current) return;

          clientRef.current.disconnect();
          clientRef.current = null;
        });
        
      } catch (error) {
        logger.error('Error disconnecting client during cancel', error);
      }
    }
  }, []);

  // Function to run a workflow
  const runWorkflow = useCallback(async (
    workflow: any, 
    onBeforeQueueing?: (client: Client) => Promise<void>,
    onComplete?: (result: any) => void,
    messageModifier?: StatusMessageModifier
  ) => {
    try {
      // Reset cancellation flag
      isCancelledRef.current = false;
      
      setStatus('loading');
      
      // Apply message modifier if provided
      const initialMessage = 'Preparing workflow...';
      setStatusMessage(messageModifier ? messageModifier(initialMessage) : initialMessage);


      // Create and initialize ComfyUI client
      const comfyClient = new Client({
        api_host: 'localhost:8188'
      });
      
      // Store reference to the client
      clientRef.current = comfyClient;
      
      comfyClient.connect({websocket: {enabled: true}});

      logger.log('Enqueuing workflow');

      // Check if cancelled before enqueueing
      if (isCancelledRef.current) {
        logger.log('Workflow cancelled before enqueuing');
        setStatus('cancelled');
        setStatusMessage(messageModifier ? messageModifier('Generation cancelled by user') : 'Generation cancelled by user');
        return null;
      }

      if (onBeforeQueueing) {
        await onBeforeQueueing(comfyClient);
      }

      const onProgress = (max: number, value: number) => {
        // Check if cancelled during processing
        if (isCancelledRef.current) {
          return;
        }
        
        const percentage = Math.round((value / max) * 100);
        setProgress(percentage);
        setStatus('processing');
            
        // Apply message modifier if provided
        const progressMessage = `Processing: ${percentage}%`;
        setStatusMessage(messageModifier ? messageModifier(progressMessage) : progressMessage);
      };

      let response;
      // Enqueue the workflow
      response = await comfyClient.enqueue(
        workflow,
        {
          workflow: {},
          progress: ({ max, value}) => {
            onProgress(max, value);
          },
        }
      );

      if (response.images.length === 0 && response.prompt_id) {
        const unsub = comfyClient.on('progress',  ({ max, value}) => {
          onProgress(max, value);
        });
        response = await comfyClient.getPromptResult(response.prompt_id);
        unsub();
      }

      // Check if cancelled after completion but before updating UI
      if (isCancelledRef.current) {
        logger.log('Workflow was cancelled during processing');
        setStatus('cancelled');
        setStatusMessage(messageModifier ? messageModifier('Generation cancelled by user') : 'Generation cancelled by user');
      } else {
        setStatus('success');
        
        // Apply message modifier if provided
        const successMessage = 'Process completed successfully!';
        setStatusMessage(messageModifier ? messageModifier(successMessage) : successMessage);
        
        if (onComplete) {
          onComplete(response);
        }
      }
      
      comfyClient.disconnect();
      clientRef.current = null;
      return response;
    } catch (error) {
      // Check if this was a cancellation
      if (isCancelledRef.current) {
        logger.log('Workflow execution was cancelled');
        setStatus('cancelled');
        setStatusMessage(messageModifier ? messageModifier('Generation cancelled by user') : 'Generation cancelled by user');
        return null;
      }
      
      logger.error('Error running ComfyUI workflow:', error);
      setStatus('error');
      
      // Apply message modifier if provided
      const errorMessage = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setStatusMessage(messageModifier ? messageModifier(errorMessage) : errorMessage);
      
      // Clean up the client reference
      if (clientRef.current) {
        try {
          clientRef.current.disconnect();
        } catch (disconnectError) {
          logger.error('Error disconnecting client after error', disconnectError);
        }
        clientRef.current = null;
      }
      
      throw error;
    }
  }, []);

  const value = {
    status,
    progress,
    statusMessage,
    runWorkflow,
    cancelWorkflow,
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