import React, { useState, useRef, useEffect } from 'react';

interface Track {
  id: string;
  name: string;
  boxStartBeat: number;
  startFrame: number;
  endFrame: number;
}

interface TimelineProps {
  bpm: number;
  totalBeats: number;
  onBeatSelect?: (beat: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ bpm, totalBeats, onBeatSelect }) => {
  const [currentBeat, setCurrentBeat] = useState(0);
  const [beatWidth, setBeatWidth] = useState(30); // Width of each beat marker in pixels
  const [tracks, setTracks] = useState<Track[]>([
    { id: '1', name: 'Track 1', boxStartBeat: 0, startFrame: 0, endFrame: 100 }
  ]);
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

  const handleNameBlur = () => {
    setEditingTrackId(null);
  };

  const handleNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setEditingTrackId(null);
    }
  };

  const addTrack = () => {
    const framesPerBeat = fps * (60 / bpm);
    const newTrack: Track = {
      id: String(tracks.length + 1),
      name: `Track ${tracks.length + 1}`,
      boxStartBeat: 0,
      startFrame: 0,
      endFrame: Math.round(duration * framesPerBeat - 1)
    };
    setTracks([...tracks, newTrack]);
  };

  const removeTrack = (trackId: string) => {
    setTracks(tracks.filter(track => track.id !== trackId));
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
    event.stopPropagation();
    // Toggle selection - if clicking the selected box, deselect it
    setSelectedTrackId(currentId => currentId === trackId ? null : trackId);
  };

  const handleTimelineClick = (event: React.MouseEvent) => {
    // No longer deselect when clicking outside boxes
  };

  const handleBoxMouseDown = (event: React.MouseEvent, trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      event.preventDefault();
      event.stopPropagation(); // Prevent timeline drag from triggering
      
      if (event.button === 0) { // Left click
        setDraggingTrackId(trackId);
        setDragStartX(event.clientX);
        setDragStartBeat(track.boxStartBeat);
        setIsDragThresholdExceeded(false);
        // Auto-select the box when starting a potential drag
        setSelectedTrackId(trackId);
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
          const newBeat = Math.max(0, Math.min(totalBeats - 5, dragStartBeat + beatDelta));
          
          // Calculate frames using FPS and BPM
          const framesPerBeat = fps * (60 / bpm);
          const newStartFrame = Math.round(newBeat * framesPerBeat);
          const newEndFrame = Math.round((newBeat + 5) * framesPerBeat - 1);
          
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

  const handleMouseUp = (event: MouseEvent) => {
    if (draggingTrackId) {
      event.stopPropagation();
      
      // Remove the selection toggle on click since we're auto-selecting on mousedown
      // if (!isDragThresholdExceeded) {
      //   setSelectedTrackId(currentId => currentId === draggingTrackId ? null : draggingTrackId);
      // }
      
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
          endFrame: Math.round((track.boxStartBeat + 5) * framesPerBeat - 1)
        };
      })
    );
  }, [fps, bpm]);

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
    <div className="timeline-container" style={{ width: '100%', padding: '20px 0' }} onClick={handleTimelineClick}>
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
                  ref={nameInputRef}
                  type="text"
                  value={track.name}
                  onChange={(e) => handleNameChange(track.id, e.target.value)}
                  onBlur={handleNameBlur}
                  onKeyDown={handleNameKeyDown}
                  style={{
                    width: '100%',
                    border: '1px solid #ccc',
                    padding: '4px 8px',
                    fontSize: '14px',
                    borderRadius: '4px',
                  }}
                />
              ) : (
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  backgroundColor: '#f8f8f8',
                  border: '1px solid transparent',
                  borderRadius: '4px',
                }}>
                  <div
                    onClick={() => handleNameClick(track.id)}
                    style={{
                      flex: 1,
                      cursor: 'pointer',
                      padding: '4px 8px 4px 4px',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textAlign: 'left',
                    }}
                  >
                    {track.name}
                  </div>
                  <button
                    onClick={() => removeTrack(track.id)}
                    style={{
                      width: '24px',
                      padding: '2px 6px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#666',
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Scrollable timeline and grid area */}
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          {canScrollLeft && (
            <div style={{
              position: 'absolute',
              left: '0',
              top: '20px', // Center over timeline markers (40px height)
              width: '24px',
              height: '24px',
              background: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              zIndex: 2,
              pointerEvents: 'none',
            }}>
              ←
            </div>
          )}
          {canScrollRight && (
            <div style={{
              position: 'absolute',
              right: '0',
              top: '20px', // Center over timeline markers (40px height)
              width: '24px',
              height: '24px',
              background: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              zIndex: 2,
              pointerEvents: 'none',
            }}>
              →
            </div>
          )}
          <div
            ref={timelineRef}
            className="timeline-scroll"
            style={{
              width: '100%',
              overflowX: 'auto',
              backgroundColor: '#f0f0f0',
              padding: '10px 0',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              cursor: isTimelineDragging ? 'grabbing' : 'grab',
            }}
            onScroll={(e) => {
              handleScroll();
              updateScrollIndicators();
            }}
            onWheel={handleWheel}
            onMouseDown={handleTimelineMouseDown}
          >
            <style>
              {`
                .timeline-scroll::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>
            <div>
              {/* Timeline markers */}
              <div
                className="timeline-content"
                style={{
                  width: `${totalBeats * beatWidth}px`,
                  height: '40px',
                  position: 'relative',
                  marginBottom: '1px',
                }}
              >
                {Array.from({ length: totalBeats }, (_, i) => (
                  <div
                    key={i}
                    className="beat-marker"
                    style={{
                      position: 'absolute',
                      left: `${i * beatWidth}px`,
                      height: i % 4 === 0 ? '20px' : '10px',
                      width: '1px',
                      backgroundColor: i % 4 === 0 ? '#333' : '#999',
                      top: '0',
                    }}
                  >
                    {i % 4 === 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '25px',
                          left: '-15px',
                          fontSize: '12px',
                        }}
                      >
                        {i}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Beat grids */}
              {tracks.map(track => (
                <div
                  key={track.id}
                  style={{
                    position: 'relative',
                  }}
                >
                  {/* Box overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${track.boxStartBeat * beatWidth}px`,
                      top: '2px',
                      bottom: '2px',
                      width: `${5 * beatWidth - 4}px`,
                      backgroundColor: selectedTrackId === track.id ? '#2563eb' : '#4a90e2',
                      opacity: selectedTrackId === track.id ? 1 : 0.6,
                      borderRadius: '4px',
                      zIndex: selectedTrackId === track.id ? 2 : 1,
                      margin: '0 2px',
                      cursor: 'move',
                      userSelect: 'none',
                      border: selectedTrackId === track.id ? '2px solid #1e40af' : '1px solid rgba(74, 144, 226, 0.3)',
                      boxShadow: selectedTrackId === track.id 
                        ? (draggingTrackId === track.id 
                          ? '0 0 0 2px rgba(37, 99, 235, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2)' 
                          : '0 0 0 2px rgba(37, 99, 235, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)')
                        : 'none',
                      transform: draggingTrackId === track.id ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.1s ease-out',
                    }}
                    onMouseDown={(e) => handleBoxMouseDown(e, track.id)}
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

      {/* Properties Panel */}
      {selectedTrackId && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#f8f8f8',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '12px',
            color: '#333',
          }}>
            Properties: {tracks.find(t => t.id === selectedTrackId)?.name}
          </div>
          <div style={{
            display: 'flex',
            gap: '16px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <label style={{
                fontSize: '13px',
                color: '#666',
              }}>
                Start Frame:
              </label>
              <input
                type="number"
                value={tracks.find(t => t.id === selectedTrackId)?.startFrame}
                onChange={(e) => handleFrameChange(selectedTrackId, 'startFrame', e.target.value)}
                style={{
                  width: '80px',
                  padding: '4px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              />
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <label style={{
                fontSize: '13px',
                color: '#666',
              }}>
                End Frame:
              </label>
              <input
                type="number"
                value={tracks.find(t => t.id === selectedTrackId)?.endFrame}
                onChange={(e) => handleFrameChange(selectedTrackId, 'endFrame', e.target.value)}
                style={{
                  width: '80px',
                  padding: '4px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline; 