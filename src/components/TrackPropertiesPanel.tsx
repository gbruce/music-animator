import React from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { useTracks } from '../contexts/TrackContext';
import { useImages } from '../contexts/ImageContext';

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
    } catch (error) {
      console.error(`Failed to update track image at index ${imageIndex}:`, error);
    }
  };

  if (!selectedTrackId) return null;

  // Get track images but don't display them yet
  const trackImages = getTrackImages(selectedTrackId);

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
            Start Beat:
          </label>
          <input
            type="number"
            value={tracks.find(t => t.id === selectedTrackId)?.boxStartBeat}
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
            value={tracks.find(t => t.id === selectedTrackId)?.durationBeats}
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
  );
};

export default TrackPropertiesPanel; 