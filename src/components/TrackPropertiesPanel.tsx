import React from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { useTracks } from '../contexts/TrackContext';

interface Track {
  id: string;
  name: string;
  boxStartBeat: number;
  startFrame: number;
  endFrame: number;
  durationBeats: number;
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

  if (!selectedTrackId) return null;

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