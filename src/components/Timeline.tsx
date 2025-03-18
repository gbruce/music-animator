import React, { useState, useRef, useEffect } from 'react';
import { Track as ApiTrack, trackApi } from '../services/api';
import { useProjects } from '../contexts/ProjectContext';
import { useTracks } from '../contexts/TrackContext';
import TrackPropertiesPanel from './TrackPropertiesPanel';

interface Track {
  id: string;
  name: string;
  boxStartBeat: number;
  startFrame: number;
  endFrame: number;
  durationBeats: number;
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
              endFrame: Math.round((apiTrack.startBeat + apiTrack.durationBeats) * framesPerBeat - 1)
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
          endFrame: Math.round((selectedTrack.startBeat + selectedTrack.durationBeats) * framesPerBeat - 1)
        };
        
        setTracks(prevTracks => [...prevTracks, newTrack]);
      }
      
      // Select the track
      setSelectedTrackId(selectedTrack.id);
      
      // Scroll to the track's position - removed to prevent scrolling when selecting tracks
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
        endFrame: Math.round((newApiTrack.startBeat + newApiTrack.durationBeats) * framesPerBeat - 1)
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
  const updateScrollIndicators = () => {
    if (timelineRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = timelineRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
    }
  };

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

  useEffect(() => {
    // Update scroll indicators when timeline content changes
    updateScrollIndicators();
  }, [beatWidth, totalBeats, tracks]);

  return (
    <div 
      className="timeline-container" 
      style={{ width: '100%', padding: '20px 0' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <button
          onClick={addTrack}
          style={{
            padding: '4px 12px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            color: '#666',
            marginRight: '20px',
          }}
        >
          + Add Track
        </button>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {tracks.length > 0 ? `${tracks.length} track(s)` : 'No tracks'}
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', display: 'flex' }}>
        {/* Fixed track names column */}
        <div style={{ 
          width: '170px', 
          flexShrink: 0,
          backgroundColor: 'white',
          zIndex: 3,
          borderRight: '1px solid #ccc'
        }}>
          {/* Empty space for alignment with timeline */}
          <div style={{ height: '41px' }} />
          
          {/* Track name containers */}
          {tracks.map(track => (
            <div
              key={track.id}
              style={{
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
                  }}
                />
              ) : (
                <div 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <div
                    onClick={() => handleNameClick(track.id)}
                    style={{
                      fontSize: '13px',
                      fontWeight: selectedTrackId === track.id ? 'bold' : 'normal',
                      color: selectedTrackId === track.id ? '#1D4ED8' : '#333',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      borderRadius: '2px',
                      backgroundColor: selectedTrackId === track.id ? 'rgba(29, 78, 216, 0.1)' : 'transparent',
                      flexGrow: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {track.name}
                  </div>
                  <button
                    onClick={() => removeTrack(track.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#999',
                      fontSize: '14px',
                      padding: '2px 6px',
                      marginLeft: '4px',
                      borderRadius: '4px',
                    }}
                    title="Remove track"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Scrollable timeline area */}
        <div 
          ref={timelineRef}
          style={{ 
            width: 'calc(100% - 170px)', 
            overflowX: 'auto',
            position: 'relative',
            backgroundColor: 'white',
          }}
          onWheel={handleWheel}
          onMouseDown={handleTimelineMouseDown}
        >
          {/* Scroll indicators */}
          {canScrollLeft && (
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '40px',
                height: '100%',
                background: 'linear-gradient(to right, rgba(0,0,0,0.05), transparent)',
                zIndex: 2,
                pointerEvents: 'none',
              }}
            />
          )}
          {canScrollRight && (
            <div 
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '40px',
                height: '100%',
                background: 'linear-gradient(to left, rgba(0,0,0,0.05), transparent)',
                zIndex: 2,
                pointerEvents: 'none',
              }}
            />
          )}
          
          <div style={{
            width: Math.max(800, totalBeats * beatWidth),
            minWidth: '100%',
          }}>
            {/* Beat markers */}
            <div style={{
              height: '40px',
              display: 'flex',
              borderBottom: '1px solid #ccc',
            }}>
              {Array.from({ length: totalBeats + 1 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: `${beatWidth}px`,
                    height: '100%',
                    position: 'relative',
                    borderRight: i < totalBeats ? '1px solid #ccc' : 'none',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      left: '4px',
                      fontSize: '11px',
                      color: '#666',
                    }}
                  >
                    {i}
                  </div>
                  {i % 4 === 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '16px',
                        left: '4px',
                        fontSize: '10px',
                        color: '#999',
                      }}
                    >
                      {formatTime(i)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Track rows */}
            <div style={{
              width: '100%',
            }}>
              {tracks.map(track => (
                <div
                  key={track.id}
                  style={{
                    position: 'relative',
                    height: `${beatWidth}px`,
                  }}
                >
                  {/* Track box */}
                  <div
                    className="track-box"
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: `${track.boxStartBeat * beatWidth}px`,
                      width: `${track.durationBeats * beatWidth}px`,
                      height: `${beatWidth - 4}px`,
                      backgroundColor: selectedTrackId === track.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(55, 65, 81, 0.1)',
                      border: selectedTrackId === track.id ? '2px solid #3b82f6' : '1px solid rgba(75, 85, 99, 0.5)',
                      borderRadius: '4px',
                      cursor: 'move',
                      zIndex: 2,
                      userSelect: 'none',
                      boxShadow: selectedTrackId === track.id 
                        ? (draggingTrackId === track.id 
                          ? '0 0 0 2px rgba(37, 99, 235, 0.5), 0 4px 6px rgba(0, 0, 0, 0.1)' 
                          : '0 0 0 2px rgba(37, 99, 235, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)')
                        : 'none',
                      transform: draggingTrackId === track.id ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.1s ease-out',
                      pointerEvents: 'auto',
                    }}
                    onMouseDown={(e) => handleBoxMouseDown(e, track.id)}
                    onClick={(e) => handleBoxClick(e, track.id)}
                  />
                  <div
                    className="beat-grid"
                    style={{
                      width: `${totalBeats * beatWidth}px`,
                      height: `${beatWidth}px`,
                      display: 'flex',
                      borderTop: '1px solid #ccc',
                      position: 'relative',
                    }}
                    onClick={handleTimelineClick}
                  >
                    {Array.from({ length: totalBeats }, (_, i) => (
                      <div
                        key={i}
                        className="beat-cell"
                        style={{
                          width: `${beatWidth}px`,
                          height: `${beatWidth}px`,
                          borderRight: '1px solid #ccc',
                          backgroundColor: i % 4 === 0 ? '#f8f8f8' : 'white',
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Track Properties Panel */}
      <TrackPropertiesPanel
        selectedTrackId={selectedTrackId}
        tracks={tracks}
        bpm={bpm}
        fps={fps}
        setTracks={setTracks}
        handleFrameChange={handleFrameChange}
      />
    </div>
  );
};

export default Timeline; 