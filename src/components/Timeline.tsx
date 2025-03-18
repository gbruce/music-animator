import React, { useState, useRef, useEffect } from 'react';
import { Track as ApiTrack, trackApi } from '../services/api';
import { useProjects } from '../contexts/ProjectContext';
import { useTracks } from '../contexts/TrackContext';
import TrackPropertiesPanel from './TrackPropertiesPanel';
import { Box, Button, IconButton, Typography, Paper, Tooltip } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

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

interface TimelineProps {
  bpm: number;
  totalBeats: number;
  onBeatSelect?: (beat: number) => void;
  selectedTrack?: ApiTrack | null;
}

const Timeline: React.FC<TimelineProps> = ({ bpm, totalBeats, onBeatSelect, selectedTrack }) => {
  const { currentProject, fetchProjects } = useProjects();
  const { createTrack, deleteTrack, updateTrack } = useTracks();
  const [currentBeat, setCurrentBeat] = useState(0);
  const [beatWidth, setBeatWidth] = useState(30); // Width of each beat marker in pixels
  const [tracks, setTracks] = useState<Track[]>([]);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [draggingTrackId, setDraggingTrackId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartBeat, setDragStartBeat] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [isTimelineDragging, setIsTimelineDragging] = useState(false);
  const [timelineDragStart, setTimelineDragStart] = useState(0);
  const [timelineScrollStart, setTimelineScrollStart] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isDragThresholdExceeded, setIsDragThresholdExceeded] = useState(false);
  const DRAG_THRESHOLD = 3; // pixels of movement before considered a drag
  const [fps, setFps] = useState(24);
  const [duration, setDuration] = useState(5);

  // Load all tracks when the current project changes
  useEffect(() => {
    if (currentProject && currentProject.tracks) {
      // Fetch the latest project data to ensure we have the most recent track positions
      const loadLatestTracks = async () => {
        try {
          // Convert API tracks to timeline track format
          const framesPerBeat = fps * (60 / bpm);
          const timelineTracks = currentProject.tracks.map(apiTrack => {
            return {
              id: apiTrack.id,
              name: apiTrack.name,
              boxStartBeat: apiTrack.startBeat,
              durationBeats: apiTrack.durationBeats,
              startFrame: Math.round(apiTrack.startBeat * framesPerBeat),
              endFrame: Math.round((apiTrack.startBeat + apiTrack.durationBeats) * framesPerBeat - 1),
              image1Id: apiTrack.image1Id,
              image2Id: apiTrack.image2Id,
              image3Id: apiTrack.image3Id,
              image4Id: apiTrack.image4Id,
              image5Id: apiTrack.image5Id,
              image6Id: apiTrack.image6Id,
              image7Id: apiTrack.image7Id,
              image8Id: apiTrack.image8Id,
              image9Id: apiTrack.image9Id,
              image10Id: apiTrack.image10Id
            };
          });
          
          setTracks(timelineTracks);
          
          // Clear selection when loading a new project
          setSelectedTrackId(null);
        } catch (error) {
          console.error("Failed to load tracks:", error);
        }
      };
      
      loadLatestTracks();
    } else {
      // Clear tracks if no project is selected
      setTracks([]);
    }
  }, [currentProject, bpm, fps]);

  // Update the timeline when the selected API track changes
  useEffect(() => {
    if (selectedTrack) {
      // Find if we already have this track in our local state
      const existingTrack = tracks.find(t => t.id === selectedTrack.id);
      
      if (!existingTrack) {
        // Convert API track to timeline track format
        const framesPerBeat = fps * (60 / bpm);
        const newTrack: Track = {
          id: selectedTrack.id,
          name: selectedTrack.name,
          boxStartBeat: selectedTrack.startBeat,
          durationBeats: selectedTrack.durationBeats,
          startFrame: Math.round(selectedTrack.startBeat * framesPerBeat),
          endFrame: Math.round((selectedTrack.startBeat + selectedTrack.durationBeats) * framesPerBeat - 1),
          image1Id: selectedTrack.image1Id,
          image2Id: selectedTrack.image2Id,
          image3Id: selectedTrack.image3Id,
          image4Id: selectedTrack.image4Id,
          image5Id: selectedTrack.image5Id,
          image6Id: selectedTrack.image6Id,
          image7Id: selectedTrack.image7Id,
          image8Id: selectedTrack.image8Id,
          image9Id: selectedTrack.image9Id,
          image10Id: selectedTrack.image10Id
        };
        
        setTracks(prevTracks => [...prevTracks, newTrack]);
      }
      
      // Select the track
      setSelectedTrackId(selectedTrack.id);
    }
  }, [selectedTrack, bpm, fps, beatWidth]);

  const handleScroll = () => {
    if (timelineRef.current) {
      const scrollLeft = timelineRef.current.scrollLeft;
      const newBeat = Math.floor(scrollLeft / beatWidth);
      setCurrentBeat(newBeat);
      onBeatSelect?.(newBeat);
    }
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    
    // Calculate new beat width
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1; // Zoom out (smaller) or in (larger)
    const newBeatWidth = Math.max(5, Math.min(100, beatWidth * zoomFactor)); // Limit zoom between 5px and 100px
    
    // Get current mouse position relative to timeline
    const rect = timelineRef.current?.getBoundingClientRect();
    const mouseX = event.clientX - (rect?.left || 0);
    
    // Calculate the beat number at mouse position before zoom
    const beatAtMouse = Math.floor((timelineRef.current?.scrollLeft || 0) + mouseX) / beatWidth;
    
    // Update beat width
    setBeatWidth(newBeatWidth);
    
    // Adjust scroll position to keep the beat under mouse cursor at the same position
    if (timelineRef.current) {
      const newScrollLeft = beatAtMouse * newBeatWidth - mouseX;
      timelineRef.current.scrollLeft = newScrollLeft;
    }
  };

  const handleNameClick = (trackId: string) => {
    setEditingTrackId(trackId);
    // Focus the input after it becomes visible
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
      }
    }, 0);
  };

  const handleNameChange = (trackId: string, newName: string) => {
    setTracks(tracks.map(track => 
      track.id === trackId ? { ...track, name: newName } : track
    ));
  };

  const handleNameBlur = async () => {
    if (editingTrackId) {
      const track = tracks.find(t => t.id === editingTrackId);
      if (track) {
        try {
          // Update the track name in the database
          await updateTrack(editingTrackId, { name: track.name });
          
          // Refresh projects to ensure we have the latest data
          await fetchProjects();
        } catch (error) {
          console.error("Failed to update track name:", error);
        }
      }
    }
    setEditingTrackId(null);
  };

  const handleNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleNameBlur();
    }
  };

  const addTrack = async () => {
    if (!currentProject) {
      console.error("No project selected");
      return;
    }
    
    try {
      // Create a new track in the database
      const trackName = `Track ${tracks.length + 1}`;
      const startBeat = 0;
      const durationBeats = 5;
      
      const newApiTrack = await createTrack(trackName, startBeat, durationBeats);
      
      // Convert to timeline track format
      const framesPerBeat = fps * (60 / bpm);
      const newTrack: Track = {
        id: newApiTrack.id,
        name: newApiTrack.name,
        boxStartBeat: newApiTrack.startBeat,
        durationBeats: newApiTrack.durationBeats,
        startFrame: Math.round(newApiTrack.startBeat * framesPerBeat),
        endFrame: Math.round((newApiTrack.startBeat + newApiTrack.durationBeats) * framesPerBeat - 1),
        image1Id: newApiTrack.image1Id,
        image2Id: newApiTrack.image2Id,
        image3Id: newApiTrack.image3Id,
        image4Id: newApiTrack.image4Id,
        image5Id: newApiTrack.image5Id,
        image6Id: newApiTrack.image6Id,
        image7Id: newApiTrack.image7Id,
        image8Id: newApiTrack.image8Id,
        image9Id: newApiTrack.image9Id,
        image10Id: newApiTrack.image10Id
      };
      
      // Add to local state
      setTracks(prevTracks => [...prevTracks, newTrack]);
      
      // Select the new track without scrolling
      setSelectedTrackId(newTrack.id);
      
      // Refresh projects to ensure we have the latest data
      await fetchProjects();
    } catch (error) {
      console.error("Failed to create track:", error);
    }
  };

  const removeTrack = async (trackId: string) => {
    try {
      // Delete the track from the database
      await deleteTrack(trackId);
      
      // Remove from local state
      setTracks(prevTracks => prevTracks.filter(track => track.id !== trackId));
      
      // Clear selection if the deleted track was selected
      if (selectedTrackId === trackId) {
        setSelectedTrackId(null);
      }
      
      // Refresh projects to ensure we have the latest data
      await fetchProjects();
    } catch (error) {
      console.error("Failed to delete track:", error);
    }
  };

  const handleFrameChange = (trackId: string, field: 'startFrame' | 'endFrame', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setTracks(prevTracks =>
        prevTracks.map(track =>
          track.id === trackId
            ? { ...track, [field]: numValue }
            : track
        )
      );
    }
  };

  // Calculate time in minutes:seconds for the current beat
  const formatTime = (beat: number) => {
    const timeInMinutes = beat / bpm;
    const minutes = Math.floor(timeInMinutes);
    const seconds = Math.floor((timeInMinutes - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleBoxClick = (event: React.MouseEvent, trackId: string) => {
    // Prevent default browser behavior
    event.preventDefault();
    // Stop propagation to prevent timeline click
    event.stopPropagation();
    
    // Set the selected track ID
    setSelectedTrackId(trackId);
  };

  const handleTimelineClick = (event: React.MouseEvent) => {
    // Check if we clicked on a box or its parent
    const target = event.target as HTMLElement;
    const boxElement = target.closest('[data-box-id]');
    
    // Only deselect if we're not clicking on a box
    if (!boxElement) {
      setSelectedTrackId(null);
    }
  };

  const handleBoxMouseDown = (event: React.MouseEvent, trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      // Prevent default browser behavior
      event.preventDefault();
      // Stop propagation to prevent timeline drag
      event.stopPropagation();
      
      // Always select the box when clicking on it
      setSelectedTrackId(trackId);
      
      if (event.button === 0) { // Left click
        setDraggingTrackId(trackId);
        setDragStartX(event.clientX);
        setDragStartBeat(track.boxStartBeat);
        setIsDragThresholdExceeded(false);
      }
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (draggingTrackId && timelineRef.current) {
      event.preventDefault();
      event.stopPropagation();
      
      const deltaX = event.clientX - dragStartX;
      const absDeltaX = Math.abs(deltaX);
      
      if (!isDragThresholdExceeded && absDeltaX > DRAG_THRESHOLD) {
        setIsDragThresholdExceeded(true);
      }
      
      if (isDragThresholdExceeded) {
        const track = tracks.find(t => t.id === draggingTrackId);
        if (track) {
          const beatDelta = Math.round(deltaX / beatWidth);
          const newBeat = Math.max(0, Math.min(totalBeats - track.durationBeats, dragStartBeat + beatDelta));
          
          // Calculate frames using FPS and BPM
          const framesPerBeat = fps * (60 / bpm);
          const newStartFrame = Math.round(newBeat * framesPerBeat);
          const newEndFrame = Math.round((newBeat + track.durationBeats) * framesPerBeat - 1);
          
          setTracks(prevTracks => 
            prevTracks.map(t =>
              t.id === draggingTrackId 
                ? { 
                    ...t, 
                    boxStartBeat: newBeat,
                    startFrame: newStartFrame,
                    endFrame: newEndFrame
                  }
                : t
            )
          );
        }
      }
    }
  };

  const handleMouseUp = async (event: MouseEvent) => {
    if (draggingTrackId) {
      event.stopPropagation();
      
      if (isDragThresholdExceeded) {
        // Save the new position to the database
        const track = tracks.find(t => t.id === draggingTrackId);
        if (track) {
          try {
            await updateTrack(draggingTrackId, {
              startBeat: track.boxStartBeat,
              durationBeats: track.durationBeats
            });
            
            // Refresh the projects data to ensure we have the latest track positions
            await fetchProjects();
          } catch (error) {
            console.error("Failed to update track position:", error);
          }
        }
      }
      
      setDraggingTrackId(null);
      setIsDragThresholdExceeded(false);
    }
  };

  const handleTimelineMouseDown = (event: React.MouseEvent) => {
    // Only handle timeline drag if not dragging a box
    if (!draggingTrackId && event.button === 0) { // Left mouse button
      event.preventDefault();
      setIsTimelineDragging(true);
      setTimelineDragStart(event.clientX);
      setTimelineScrollStart(timelineRef.current?.scrollLeft || 0);
    }
  };

  const handleTimelineMouseMove = (event: MouseEvent) => {
    if (isTimelineDragging && timelineRef.current) {
      const delta = timelineDragStart - event.clientX;
      timelineRef.current.scrollLeft = timelineScrollStart + delta;
    }
  };

  const handleTimelineMouseUp = () => {
    setIsTimelineDragging(false);
  };

  // Update scroll indicators
  useEffect(() => {
    const updateScrollIndicators = () => {
      if (timelineRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = timelineRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
      }
    };

    // Update on initial render
    updateScrollIndicators();

    // Add scroll event listener
    const timelineElement = timelineRef.current;
    if (timelineElement) {
      timelineElement.addEventListener('scroll', updateScrollIndicators);
      window.addEventListener('resize', updateScrollIndicators);
    }

    // Clean up event listeners
    return () => {
      if (timelineElement) {
        timelineElement.removeEventListener('scroll', updateScrollIndicators);
        window.removeEventListener('resize', updateScrollIndicators);
      }
    };
  }, []); // Empty dependency array as timelineRef is a ref object

  // Update frames for all tracks when FPS changes
  useEffect(() => {
    setTracks(prevTracks => 
      prevTracks.map(track => {
        const framesPerBeat = fps * (60 / bpm); // Calculate frames per beat based on FPS and BPM
        return {
          ...track,
          startFrame: Math.round(track.boxStartBeat * framesPerBeat),
          endFrame: Math.round((track.boxStartBeat + track.durationBeats) * framesPerBeat - 1)
        };
      })
    );
  }, [fps, bpm, selectedTrackId]);

  useEffect(() => {
    // Add global mouse event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    draggingTrackId,
    dragStartX,
    dragStartBeat,
    beatWidth,
    isDragThresholdExceeded,
    tracks,
    totalBeats
  ]);

  useEffect(() => {
    // Add global mouse event listeners for timeline dragging
    document.addEventListener('mousemove', handleTimelineMouseMove);
    document.addEventListener('mouseup', handleTimelineMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleTimelineMouseMove);
      document.removeEventListener('mouseup', handleTimelineMouseUp);
    };
  }, [
    isTimelineDragging,
    timelineDragStart,
    timelineScrollStart,
    timelineRef.current
  ]);

  return (
    <Box 
      sx={{ 
        width: '100%', 
        padding: '20px 0', 
        bgcolor: 'background.default',
        color: 'text.primary'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <Button
          onClick={addTrack}
          variant="contained"
          color="primary"
          size="small"
          startIcon={<AddIcon />}
          sx={{ marginRight: '20px' }}
        >
          Add Track
        </Button>
        <Typography variant="body2" color="text.secondary">
          {tracks.length > 0 ? `${tracks.length} track(s)` : 'No tracks'}
        </Typography>
      </Box>

      <Box sx={{ position: 'relative', width: '100%', display: 'flex' }}>
        {/* Fixed track names column */}
        <Paper 
          elevation={3} 
          sx={{ 
            width: '170px', 
            flexShrink: 0,
            backgroundColor: 'background.paper',
            zIndex: 3,
            borderRight: '1px solid',
            borderColor: 'divider'
          }}
        >
          {/* Empty space for alignment with timeline */}
          <Box sx={{ height: '41px' }} />
          
          {/* Track name containers */}
          {tracks.map(track => (
            <Box
              key={track.id}
              sx={{
                height: `${beatWidth}px`,
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px 0 4px',
              }}
            >
              {editingTrackId === track.id ? (
                <input
                  type="text"
                  ref={nameInputRef}
                  defaultValue={track.name}
                  onChange={(e) => handleNameChange(track.id, e.target.value)}
                  onBlur={handleNameBlur}
                  onKeyDown={handleNameKeyDown}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '13px',
                    backgroundColor: 'transparent',
                    color: 'inherit'
                  }}
                />
              ) : (
                <Box 
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <Typography
                    onClick={() => handleNameClick(track.id)}
                    sx={{
                      fontSize: '13px',
                      fontWeight: selectedTrackId === track.id ? 'bold' : 'normal',
                      color: selectedTrackId === track.id ? 'primary.main' : 'text.primary',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      borderRadius: '2px',
                      backgroundColor: selectedTrackId === track.id ? 'action.selected' : 'transparent',
                      flexGrow: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {track.name}
                  </Typography>
                  <IconButton
                    onClick={() => removeTrack(track.id)}
                    size="small"
                    color="error"
                    aria-label="delete track"
                    sx={{ padding: '2px' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
          ))}
        </Paper>
        
        {/* Scrollable timeline area */}
        <Box 
          ref={timelineRef}
          sx={{ 
            width: 'calc(100% - 170px)', 
            overflowX: 'auto',
            position: 'relative',
            backgroundColor: 'background.paper',
          }}
          onWheel={handleWheel}
          onMouseDown={handleTimelineMouseDown}
          onScroll={handleScroll}
        >
          {/* Scroll indicators */}
          {canScrollLeft && (
            <Box 
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '40px',
                height: '100%',
                background: theme => `linear-gradient(to right, ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}, transparent)`,
                zIndex: 2,
                pointerEvents: 'none',
              }}
            />
          )}
          {canScrollRight && (
            <Box 
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '40px',
                height: '100%',
                background: theme => `linear-gradient(to left, ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}, transparent)`,
                zIndex: 2,
                pointerEvents: 'none',
              }}
            />
          )}
          
          <Box sx={{
            width: Math.max(800, totalBeats * beatWidth),
            minWidth: '100%',
          }}>
            {/* Beat markers */}
            <Box sx={{
              height: '40px',
              display: 'flex',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}>
              {Array.from({ length: totalBeats + 1 }, (_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: `${beatWidth}px`,
                    height: '100%',
                    position: 'relative',
                    borderRight: i < totalBeats ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      bottom: '2px',
                      left: '4px',
                      color: 'text.secondary',
                    }}
                  >
                    {i}
                  </Typography>
                  {i % 4 === 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        bottom: '16px',
                        left: '4px',
                        color: 'text.disabled',
                        fontSize: '10px',
                      }}
                    >
                      {formatTime(i)}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
            
            {/* Track rows */}
            <Box sx={{ width: '100%' }}>
              {tracks.map(track => (
                <Box
                  key={track.id}
                  sx={{
                    position: 'relative',
                    height: `${beatWidth}px`,
                  }}
                >
                  {/* Track box */}
                  <Box
                    className="track-box"
                    sx={{
                      position: 'absolute',
                      top: '2px',
                      left: `${track.boxStartBeat * beatWidth}px`,
                      width: `${track.durationBeats * beatWidth}px`,
                      height: `${beatWidth - 4}px`,
                      bgcolor: selectedTrackId === track.id ? 'primary.dark' : 'action.hover',
                      border: theme => `2px solid ${selectedTrackId === track.id ? theme.palette.primary.main : theme.palette.divider}`,
                      borderRadius: '4px',
                      cursor: 'move',
                      zIndex: 2,
                      userSelect: 'none',
                      boxShadow: selectedTrackId === track.id 
                        ? (draggingTrackId === track.id 
                          ? 4 
                          : 2)
                        : 'none',
                      transform: draggingTrackId === track.id ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.1s ease-out',
                      pointerEvents: 'auto',
                    }}
                    onMouseDown={(e) => handleBoxMouseDown(e, track.id)}
                    onClick={(e) => handleBoxClick(e, track.id)}
                  />
                  <Box
                    className="beat-grid"
                    sx={{
                      width: `${totalBeats * beatWidth}px`,
                      height: `${beatWidth}px`,
                      display: 'flex',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      position: 'relative',
                    }}
                    onClick={handleTimelineClick}
                  >
                    {Array.from({ length: totalBeats }, (_, i) => (
                      <Box
                        key={i}
                        className="beat-cell"
                        sx={{
                          width: `${beatWidth}px`,
                          height: `${beatWidth}px`,
                          borderRight: '1px solid',
                          borderColor: 'divider',
                          bgcolor: i % 4 === 0 ? 'action.hover' : 'transparent',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Track Properties Panel */}
      <TrackPropertiesPanel
        selectedTrackId={selectedTrackId}
        tracks={tracks}
        bpm={bpm}
        fps={fps}
        setTracks={setTracks}
        handleFrameChange={handleFrameChange}
      />
    </Box>
  );
};

export default Timeline; 