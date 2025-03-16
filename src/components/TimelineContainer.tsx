import React, { useState, useEffect } from 'react';
import Timeline from './Timeline';

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
    <div className="timeline-container" style={{ padding: '20px' }}>
      <div style={{ 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label htmlFor="bpm-input" style={{ marginRight: '10px' }}>
            Beats Per Minute:
          </label>
          <input
            id="bpm-input"
            type="number"
            min="1"
            value={bpm}
            onChange={handleBpmChange}
            style={{
              padding: '5px',
              width: '80px',
              marginRight: '20px'
            }}
          />
          <label htmlFor="fps-input" style={{ marginRight: '10px' }}>
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
            style={{
              padding: '5px',
              width: '80px',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label htmlFor="duration-input" style={{ marginRight: '10px' }}>
            Duration (seconds):
          </label>
          <input
            id="duration-input"
            type="number"
            min="1"
            value={duration}
            onChange={handleDurationChange}
            style={{
              padding: '5px',
              width: '80px',
            }}
          />
        </div>
      </div>
      <Timeline
        bpm={bpm}
        totalBeats={totalBeats}
        onBeatSelect={handleBeatSelect}
      />
    </div>
  );
};

export default TimelineContainer; 