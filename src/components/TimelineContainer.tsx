import React, { useState, useEffect } from 'react';
import Timeline from './Timeline';
import { useProjects } from '../contexts/ProjectContext';
import { useTracks } from '../contexts/TrackContext';
import { Box, TextField, Typography, Grid, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

const TimelineContainer: React.FC = () => {
  const { 
    currentProject, 
    updateProject,
    deleteProject
  } = useProjects();
  
  const { selectedTrack } = useTracks();
  
  const [bpm, setBpm] = useState(120);
  const [duration, setDuration] = useState(60); // Duration in seconds
  const [totalBeats, setTotalBeats] = useState(0);
  const [fps, setFps] = useState(24);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Update local state when current project changes
  useEffect(() => {
    if (currentProject) {
      setBpm(currentProject.bpm);
      setFps(currentProject.fps);
      setDuration(currentProject.duration);
    }
  }, [currentProject]);

  // Calculate total beats whenever BPM or duration changes
  useEffect(() => {
    const beatsPerSecond = bpm / 60;
    const newTotalBeats = Math.ceil(beatsPerSecond * duration);
    setTotalBeats(newTotalBeats);
  }, [bpm, duration]);

  const handleBpmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(event.target.value, 10);
    if (!isNaN(newBpm) && newBpm > 0) {
      setBpm(newBpm);
      if (currentProject) {
        updateProject(currentProject.id, { bpm: newBpm });
      }
    }
  };

  const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = parseInt(event.target.value, 10);
    if (!isNaN(newDuration) && newDuration > 0) {
      setDuration(newDuration);
      if (currentProject) {
        updateProject(currentProject.id, { duration: newDuration });
      }
    }
  };

  const handleFpsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setFps(value);
      if (currentProject) {
        updateProject(currentProject.id, { fps: value });
      }
    }
  };

  const handleBeatSelect = (beat: number) => {
    console.log(`Selected beat: ${beat}`);
  };

  const handleDeleteProjectClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (currentProject) {
      try {
        await deleteProject(currentProject.id);
        setDeleteDialogOpen(false);
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  if (!currentProject) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%', 
        p: 3 
      }}>
        <Typography variant="body1" color="text.secondary">
          {currentProject === undefined ? 'Loading project...' : 'No project selected. Please create or select a project.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2, 
        p: 2, 
        bgcolor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            label="BPM"
            type="number"
            size="small"
            inputProps={{ min: 1 }}
            value={bpm}
            onChange={handleBpmChange}
            sx={{ width: 100 }}
          />

          <TextField
            label="FPS"
            type="number"
            size="small"
            inputProps={{ min: 1 }}
            value={fps}
            onChange={handleFpsChange}
            sx={{ width: 100 }}
          />

          <TextField
            label="Duration (sec)"
            type="number"
            size="small"
            inputProps={{ min: 1 }}
            value={duration}
            onChange={handleDurationChange}
            sx={{ width: 150 }}
          />
        </Box>
        
        <Button 
          variant="outlined" 
          color="error" 
          startIcon={<DeleteIcon />}
          onClick={handleDeleteProjectClick}
        >
          Delete Project
        </Button>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Timeline
          bpm={bpm}
          totalBeats={totalBeats}
          onBeatSelect={handleBeatSelect}
          selectedTrack={selectedTrack}
        />
      </Box>

      {/* Delete Project Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the project "{currentProject?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimelineContainer;
