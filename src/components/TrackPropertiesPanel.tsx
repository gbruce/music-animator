import React, { useState, useEffect } from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { useTracks } from '../contexts/TrackContext';
import { useImages } from '../contexts/ImageContext';
import { imageApi } from '../services/api';
import { useComfyUIWorkflow } from './ComfyUIWorkflow';
import WorkflowStatusDisplay from './WorkflowStatusDisplay';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Grid, 
  Modal,
  Button,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  Divider,
  InputAdornment
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  AutoFixHigh as GenerateIcon
} from '@mui/icons-material';

interface Track {
  id: string;
  name: string;
  boxStartBeat: number;
  startFrame: number;
  endFrame: number;
  durationBeats: number;
  image1Id?: string | null;
  image2Id?: string | null;
  image3Id?: string | null;
  image4Id?: string | null;
  image5Id?: string | null;
  image6Id?: string | null;
  image7Id?: string | null;
  image8Id?: string | null;
  image9Id?: string | null;
  image10Id?: string | null;
}

interface TrackPropertiesPanelProps {
  selectedTrackId: string | null;
  tracks: Track[];
  bpm: number;
  fps: number;
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  handleFrameChange: (trackId: string, field: 'startFrame' | 'endFrame', value: string) => void;
}

const TrackPropertiesPanel: React.FC<TrackPropertiesPanelProps> = ({
  selectedTrackId,
  tracks,
  bpm,
  fps,
  setTracks,
  handleFrameChange
}) => {
  const { fetchProjects } = useProjects();
  const { updateTrack, deleteTrack } = useTracks();
  const { images } = useImages();
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(-1);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // ComfyUI workflow integration
  const {
    status: workflowStatus,
    statusMessage,
    progress,
    runWorkflow
  } = useComfyUIWorkflow(
    selectedTrackId || '', 
    (result) => {
      console.log('Workflow completed:', result);
      // Here you could handle the result, e.g., save the generated image URL to the track
    }
  );

  // Get the track's images if they exist (without changing the UI)
  const getTrackImages = (trackId: string | null) => {
    if (!trackId) return Array(10).fill(null);
    
    const track = tracks.find(t => t.id === trackId);
    if (!track) return Array(10).fill(null);
    
    return [
      track.image1Id ? images.find(img => img.id === track.image1Id) || null : null,
      track.image2Id ? images.find(img => img.id === track.image2Id) || null : null,
      track.image3Id ? images.find(img => img.id === track.image3Id) || null : null,
      track.image4Id ? images.find(img => img.id === track.image4Id) || null : null,
      track.image5Id ? images.find(img => img.id === track.image5Id) || null : null,
      track.image6Id ? images.find(img => img.id === track.image6Id) || null : null,
      track.image7Id ? images.find(img => img.id === track.image7Id) || null : null,
      track.image8Id ? images.find(img => img.id === track.image8Id) || null : null,
      track.image9Id ? images.find(img => img.id === track.image9Id) || null : null,
      track.image10Id ? images.find(img => img.id === track.image10Id) || null : null,
    ];
  };

  // Update a track's image by index (0-9)
  const updateTrackImage = async (trackId: string, imageIndex: number, imageId: string | null) => {
    if (!trackId) return;

    try {
      const updateData: Record<string, string | null> = {};
      const fieldName = `image${imageIndex + 1}Id` as keyof Track;
      updateData[fieldName] = imageId;

      // Update in local state
      setTracks(prevTracks => 
        prevTracks.map(t =>
          t.id === trackId 
            ? { ...t, [fieldName]: imageId }
            : t
        )
      );
      
      // Update in database
      await updateTrack(trackId, updateData);
      
      // Refresh projects to ensure we have the latest data
      await fetchProjects();
      
      // Reset state and close image selector
      setSelectedImageId(null);
      setShowImageSelector(false);
    } catch (error) {
      console.error(`Failed to update track image at index ${imageIndex}:`, error);
    }
  };

  const handleImageClick = (index: number) => {
    const track = tracks.find(t => t.id === selectedTrackId);
    if (!track) return;
    
    // Initialize with current image ID
    const currentImageId = track[`image${index + 1}Id` as keyof Track] as string | null;
    setSelectedImageId(currentImageId);
    setCurrentImageIndex(index);
    setShowImageSelector(true);
  };

  const handleCloseImageSelector = () => {
    setSelectedImageId(null);
    setShowImageSelector(false);
    setCurrentImageIndex(-1);
  };

  const handleSelectImage = (imageId: string) => {
    setSelectedImageId(imageId);
  };

  const handleConfirmSelection = () => {
    if (selectedTrackId && currentImageIndex >= 0) {
      updateTrackImage(selectedTrackId, currentImageIndex, selectedImageId);
    }
  };

  const handleRemoveImage = () => {
    if (selectedTrackId && currentImageIndex >= 0) {
      updateTrackImage(selectedTrackId, currentImageIndex, null);
    }
  };

  const handleRemoveTrack = async () => {
    if (!selectedTrackId) return;
    
    try {
      await deleteTrack(selectedTrackId);
      // The track will be removed from the UI by the parent component
      await fetchProjects();
    } catch (error) {
      console.error("Failed to delete track:", error);
    }
  };

  const handleStartEditingName = () => {
    if (!track) return;
    setEditedName(track.name);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!selectedTrackId || !editedName.trim()) return;
    
    try {
      // Update in local state
      setTracks(prevTracks => 
        prevTracks.map(t =>
          t.id === selectedTrackId 
            ? { ...t, name: editedName }
            : t
        )
      );
      
      // Update in database
      await updateTrack(selectedTrackId, { name: editedName });
      
      // Refresh projects
      await fetchProjects();
      
      // Exit edit mode
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to update track name:", error);
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
  };

  const handleGenerateImage = () => {
    runWorkflow();
  };

  if (!selectedTrackId) return null;

  // Get track images but don't display them yet
  const trackImages = getTrackImages(selectedTrackId);
  const track = tracks.find(t => t.id === selectedTrackId);
  if (!track) return null;

  return (
    <Box 
      sx={{
        mt: 2,
        p: 2,
        bgcolor: 'background.default',
        borderRadius: 1,
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        {isEditingName ? (
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <TextField
              fullWidth
              size="small"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              autoFocus
              sx={{ mr: 1 }}
            />
            <IconButton size="small" color="primary" onClick={handleSaveName}>
              <SaveIcon />
            </IconButton>
            <IconButton size="small" color="default" onClick={handleCancelEditName}>
              <CloseIcon />
            </IconButton>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight="medium">
                {track.name}
              </Typography>
              <IconButton size="small" onClick={handleStartEditingName} sx={{ ml: 1 }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleRemoveTrack}
            >
              Delete Track
            </Button>
          </>
        )}
      </Box>
      
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Start Beat:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {track.boxStartBeat}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Duration:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {track.durationBeats}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Start Frame:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {track.startFrame}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              End Frame:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {track.endFrame}
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      {/* Image Grid Section with Generate Button */}
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            Track Images
          </Typography>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<GenerateIcon />}
              onClick={handleGenerateImage}
              disabled={workflowStatus === 'loading' || workflowStatus === 'processing'}
            >
              Generate Image
            </Button>
            <WorkflowStatusDisplay 
              status={workflowStatus} 
              message={statusMessage} 
              progress={progress}
            />
          </Box>
        </Box>
        
        <Grid container spacing={1} sx={{ mt: 1 }}>
          {trackImages.map((image, index) => (
            <Grid item xs={12 / 5} key={index}>
              <Paper
                elevation={1}
                sx={{
                  aspectRatio: '1/1',
                  border: theme => `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 2,
                    transform: 'scale(1.02)',
                  }
                }}
                onClick={() => handleImageClick(index)}
              >
                {image ? (
                  <Box
                    component="img"
                    src={imageApi.getImageUrl(image.identifier)}
                    alt={`Track image ${index + 1}`}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary" align="center" p={1}>
                    Image {index + 1}
                  </Typography>
                )}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    fontSize: '10px',
                    px: 0.5,
                    py: 0.2,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    borderRadius: 0.5,
                  }}
                >
                  {index + 1}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Image selector modal */}
      <Modal
        open={showImageSelector}
        onClose={handleCloseImageSelector}
        aria-labelledby="image-selector-modal"
        aria-describedby="select-image-for-track"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxWidth: '800px',
          maxHeight: '80vh',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          boxShadow: 24,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}>
            <Typography variant="h6" id="image-selector-modal">
              Select Image for Slot {currentImageIndex + 1}
            </Typography>
            <IconButton 
              onClick={handleCloseImageSelector}
              size="small"
              edge="end"
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Box sx={{
            p: 2,
            overflowY: 'auto',
            flex: 1,
          }}>
            <Grid container spacing={2}>
              {images.map(img => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={img.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: theme => selectedImageId === img.id ? 
                        `2px solid ${theme.palette.primary.main}` : 
                        `1px solid ${theme.palette.divider}`,
                      transform: selectedImageId === img.id ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.2s',
                      bgcolor: selectedImageId === img.id ? 'action.selected' : 'background.paper',
                    }}
                    onClick={() => handleSelectImage(img.id)}
                  >
                    <CardMedia
                      component="img"
                      height="120"
                      image={imageApi.getImageUrl(img.identifier)}
                      alt={img.filename}
                      sx={{ objectFit: 'contain', p: 1 }}
                    />
                    <Divider />
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant="caption" noWrap>
                        {img.filename}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {images.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" align="center" p={3}>
                    No images available. Upload images in the Images tab.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
          
          <Box sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleRemoveImage}
              startIcon={<DeleteIcon />}
            >
              Remove Image
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleCloseImageSelector}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                disabled={selectedImageId === null}
                onClick={handleConfirmSelection}
              >
                Select
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default TrackPropertiesPanel; 