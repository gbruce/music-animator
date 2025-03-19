import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { WorkflowStatus } from '../contexts/ComfyUIContext';

interface WorkflowStatusDisplayProps {
  status: WorkflowStatus;
  message: string;
  progress: number;
}

const WorkflowStatusDisplay: React.FC<WorkflowStatusDisplayProps> = ({ 
  status, 
  message, 
  progress 
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
      {(status === 'loading' || status === 'processing') && (
        <CircularProgress 
          size={16} 
          sx={{ mr: 1 }} 
          variant={status === 'processing' ? "determinate" : "indeterminate"} 
          value={progress} 
        />
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

export default WorkflowStatusDisplay; 