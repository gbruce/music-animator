import React, { useState } from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { useTracks } from '../contexts/TrackContext';
import { useImages } from '../contexts/ImageContext';
import { imageApi } from '../services/api';

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
  const { updateTrack } = useTracks();
  const { images } = useImages();
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(-1);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

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

  if (!selectedTrackId) return null;

  // Get track images but don't display them yet
  const trackImages = getTrackImages(selectedTrackId);
  const track = tracks.find(t => t.id === selectedTrackId);

  return (
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
        Properties: {track?.name}
      </div>
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '16px',
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
            Start Beat:
          </label>
          <input
            type="number"
            value={track?.boxStartBeat}
            onChange={async (e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value >= 0) {
                const track = tracks.find(t => t.id === selectedTrackId);
                if (!track) return;
                
                const framesPerBeat = fps * (60 / bpm);
                const newStartFrame = Math.round(value * framesPerBeat);
                const newEndFrame = Math.round((value + track.durationBeats) * framesPerBeat - 1);
                
                setTracks(prevTracks => 
                  prevTracks.map(t =>
                    t.id === selectedTrackId 
                      ? { 
                          ...t, 
                          boxStartBeat: value,
                          startFrame: newStartFrame,
                          endFrame: newEndFrame
                        }
                      : t
                  )
                );
                
                // Update in database
                try {
                  await updateTrack(selectedTrackId, {
                    startBeat: value,
                    durationBeats: track.durationBeats
                  });
                  
                  // Refresh projects to ensure we have the latest data
                  await fetchProjects();
                } catch (error) {
                  console.error("Failed to update track position:", error);
                }
              }
            }}
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
            Duration (beats):
          </label>
          <input
            type="number"
            min="1"
            value={track?.durationBeats}
            onChange={async (e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value >= 1) {
                const track = tracks.find(t => t.id === selectedTrackId);
                if (!track) return;
                
                const framesPerBeat = fps * (60 / bpm);
                const newEndFrame = Math.round((track.boxStartBeat + value) * framesPerBeat - 1);
                
                setTracks(prevTracks => 
                  prevTracks.map(t =>
                    t.id === selectedTrackId 
                      ? { 
                          ...t, 
                          durationBeats: value,
                          endFrame: newEndFrame
                        }
                      : t
                  )
                );
                
                // Update in database
                try {
                  await updateTrack(selectedTrackId, {
                    durationBeats: value
                  });
                  
                  // Refresh projects to ensure we have the latest data
                  await fetchProjects();
                } catch (error) {
                  console.error("Failed to update track duration:", error);
                }
              }
            }}
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
            Start Frame:
          </label>
          <input
            type="number"
            value={track?.startFrame}
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
            value={track?.endFrame}
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
      
      {/* Image Grid Section */}
      <div style={{ marginTop: '16px' }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#333',
        }}>
          Track Images
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '10px',
        }}>
          {trackImages.map((image, index) => (
            <div
              key={index}
              style={{
                width: '100%',
                aspectRatio: '1/1',
                border: '1px solid #ccc',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                backgroundColor: '#fff',
                position: 'relative',
                cursor: 'pointer',
              }}
              onClick={() => handleImageClick(index)}
            >
              {image ? (
                <img
                  src={imageApi.getImageUrl(image.identifier)}
                  alt={`Track image ${index + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div style={{
                  color: '#aaa',
                  fontSize: '12px',
                  padding: '4px',
                  textAlign: 'center',
                }}>
                  Image {index + 1}
                </div>
              )}
              <div style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                fontSize: '10px',
                padding: '2px 4px',
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                borderRadius: '2px',
              }}>
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image selector modal */}
      {showImageSelector && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            width: '80%',
            maxWidth: '800px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0 }}>Select Image for Slot {currentImageIndex + 1}</h3>
              <button 
                onClick={handleCloseImageSelector}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{
              padding: '16px',
              overflowY: 'auto',
              flex: 1,
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '12px',
              }}>
                {images.map(img => (
                  <div
                    key={img.id}
                    style={{
                      border: selectedImageId === img.id ? '2px solid #2196F3' : '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      backgroundColor: selectedImageId === img.id ? '#e3f2fd' : 'white',
                    }}
                    onClick={() => handleSelectImage(img.id)}
                  >
                    <img
                      src={imageApi.getImageUrl(img.identifier)}
                      alt={img.filename}
                      style={{
                        width: '100%',
                        height: '100px',
                        objectFit: 'contain',
                      }}
                    />
                    <div style={{
                      fontSize: '12px',
                      marginTop: '4px',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%',
                    }}>
                      {img.filename.length > 15 ? img.filename.substring(0, 15) + '...' : img.filename}
                    </div>
                  </div>
                ))}
                {images.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px' }}>
                    No images available. Upload images in the Images tab.
                  </div>
                )}
              </div>
            </div>
            
            <div style={{
              padding: '16px',
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <button
                onClick={handleRemoveImage}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Remove Image
              </button>
              <div style={{
                display: 'flex',
                gap: '10px',
              }}>
                <button
                  onClick={handleCloseImageSelector}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSelection}
                  disabled={selectedImageId === null}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: selectedImageId === null ? '#cccccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedImageId === null ? 'not-allowed' : 'pointer',
                  }}
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackPropertiesPanel; 