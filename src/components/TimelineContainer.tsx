import React, { useState, useEffect } from 'react';
import Timeline from './Timeline';
import { timelineStyles as styles } from './styles/TimelineStyles';
import { useProjects } from '../contexts/ProjectContext';
import { useTracks } from '../contexts/TrackContext';

const TimelineContainer: React.FC = () => {
  const { 
    currentProject, 
    updateProject,
  } = useProjects();
  
  const { selectedTrack } = useTracks();
  
  const [bpm, setBpm] = useState(120);
  const [duration, setDuration] = useState(60); // Duration in seconds
  const [totalBeats, setTotalBeats] = useState(0);
  const [fps, setFps] = useState(24);

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

  if (!currentProject) {
    return (
      <div className={styles.loadingContainer}>
        {currentProject === undefined ? 'Loading project...' : 'No project selected. Please create or select a project.'}
      </div>
    );
  }

  return (
    <div>
      <div className={styles.controlsContainer}>
        <div className={styles.controlGroup}>
          <label htmlFor="bpm-input" className={styles.label}>
            BPM:
          </label>
          <input
            id="bpm-input"
            type="number"
            min="1"
            value={bpm}
            onChange={handleBpmChange}
            className={styles.input}
          />
        </div>

        <div className={styles.controlGroup}>
          <label htmlFor="fps-input" className={styles.label}>
            FPS:
          </label>
          <input
            id="fps-input"
            type="number"
            min="1"
            value={fps}
            onChange={handleFpsChange}
            className={styles.input}
          />
        </div>

        <div className={styles.controlGroup}>
          <label htmlFor="duration-input" className={styles.label}>
            Duration:
          </label>
          <input
            id="duration-input"
            type="number"
            min="1"
            value={duration}
            onChange={handleDurationChange}
            className={styles.input}
          />
          <span className={styles.label}>sec</span>
        </div>
      </div>

      <div className={styles.timelineWrapper}>
        <Timeline
          bpm={bpm}
          totalBeats={totalBeats}
          onBeatSelect={handleBeatSelect}
          selectedTrack={selectedTrack}
        />
      </div>
    </div>
  );
};

export default TimelineContainer; 