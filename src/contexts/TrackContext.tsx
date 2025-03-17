import React, { createContext, useContext, useState, useEffect } from 'react';
import { Track, trackApi } from '../services/api';
import { useProjects } from './ProjectContext';

interface TrackContextType {
  tracks: Track[];
  selectedTrack: Track | null;
  loading: boolean;
  error: string | null;
  createTrack: (name: string, startBeat?: number, durationBeats?: number) => Promise<Track>;
  updateTrack: (id: string, data: Partial<Track>) => Promise<Track>;
  deleteTrack: (id: string) => Promise<void>;
  selectTrack: (track: Track | null) => void;
}

const TrackContext = createContext<TrackContextType | undefined>(undefined);

export const TrackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentProject } = useProjects();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update tracks when the current project changes
  useEffect(() => {
    if (currentProject) {
      setTracks(currentProject.tracks || []);
      setSelectedTrack(null);
    } else {
      setTracks([]);
      setSelectedTrack(null);
    }
  }, [currentProject]);

  const createTrack = async (
    name: string,
    startBeat = 0,
    durationBeats = 16
  ): Promise<Track> => {
    if (!currentProject) {
      throw new Error('No project selected');
    }

    setLoading(true);
    setError(null);
    
    try {
      const newTrack = await trackApi.createTrack(currentProject.id, {
        name,
        startBeat,
        durationBeats
      });
      
      setTracks(prev => [...prev, newTrack]);
      setSelectedTrack(newTrack);
      return newTrack;
    } catch (err: any) {
      setError(err.message || 'Failed to create track');
      console.error('Error creating track:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTrack = async (id: string, data: Partial<Track>): Promise<Track> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedTrack = await trackApi.updateTrack(id, data);
      
      setTracks(prev => 
        prev.map(track => track.id === id ? updatedTrack : track)
      );
      
      if (selectedTrack && selectedTrack.id === id) {
        setSelectedTrack(updatedTrack);
      }
      
      return updatedTrack;
    } catch (err: any) {
      setError(err.message || 'Failed to update track');
      console.error('Error updating track:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTrack = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await trackApi.deleteTrack(id);
      
      setTracks(prev => prev.filter(track => track.id !== id));
      
      if (selectedTrack && selectedTrack.id === id) {
        setSelectedTrack(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete track');
      console.error('Error deleting track:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const selectTrack = (track: Track | null) => {
    setSelectedTrack(track);
  };

  const value = {
    tracks,
    selectedTrack,
    loading,
    error,
    createTrack,
    updateTrack,
    deleteTrack,
    selectTrack
  };

  return <TrackContext.Provider value={value}>{children}</TrackContext.Provider>;
};

export const useTracks = () => {
  const context = useContext(TrackContext);
  if (context === undefined) {
    throw new Error('useTracks must be used within a TrackProvider');
  }
  return context;
}; 