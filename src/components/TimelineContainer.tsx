import React, { useState, useEffect } from 'react';
import Timeline from './Timeline';
import { timelineStyles as styles } from './styles/TimelineStyles';

const TimelineContainer: React.FC = () => {
  const [bpm, setBpm] = useState(120);
  const [duration, setDuration] = useState(60); // Duration in seconds
  const [totalBeats, setTotalBeats] = useState(0);
  const [fps, setFps] = useState(24);

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
    }
  };

  const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = parseInt(event.target.value, 10);
    if (!isNaN(newDuration) && newDuration > 0) {
      setDuration(newDuration);
    }
  };

  const handleBeatSelect = (beat: number) => {
    console.log(`Selected beat: ${beat}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.glowEffect}>
        <div className={styles.contentContainer}>
          <h1 className={styles.heading}>Music Animator Timeline</h1>
          
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
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value > 0) {
                    setFps(value);
                  }
                }}
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineContainer; 