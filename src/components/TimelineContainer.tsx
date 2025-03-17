import React, { useState, useEffect } from 'react';
import Timeline from './Timeline';
import { timelineStyles as styles } from './styles/TimelineStyles';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { useTracks } from '../contexts/TrackContext';
import { Track } from '../services/api';

const TimelineContainer: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    projects, 
    currentProject, 
    setCurrentProject, 
    createProject, 
    updateProject,
    loading: projectsLoading 
  } = useProjects();
  
  const { selectedTrack } = useTracks();
  
  const [bpm, setBpm] = useState(120);
  const [duration, setDuration] = useState(60); // Duration in seconds
  const [totalBeats, setTotalBeats] = useState(0);
  const [fps, setFps] = useState(24);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

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

  const handleProjectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = event.target.value;
    if (projectId === 'new') {
      setShowNewProjectForm(true);
    } else {
      const selectedProject = projects.find(p => p.id === projectId);
      if (selectedProject) {
        setCurrentProject(selectedProject);
      }
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      await createProject(newProjectName, bpm, fps, duration);
      setNewProjectName('');
      setShowNewProjectForm(false);
    }
  };

  const handleBeatSelect = (beat: number) => {
    console.log(`Selected beat: ${beat}`);
  };

  if (projectsLoading && projects.length === 0) {
    return <div className={styles.loadingContainer}>Loading projects...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.glowEffect}>
        <div className={styles.contentContainer}>
          <div className={styles.topBar}>
            <div className={styles.projectSelectorContainer}>
              <select 
                value={currentProject?.id || ''} 
                onChange={handleProjectChange}
                className={styles.projectDropdown}
              >
                {projects.length === 0 && (
                  <option value="">No projects</option>
                )}
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
                <option value="new">+ New Project</option>
              </select>
            </div>

            {user && (
              <div className={styles.userInfoContainer}>
                <span className={styles.username}>{user.username}</span>
                <button
                  onClick={logout}
                  className={styles.logoutButton}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
          
          <h1 className={styles.heading}>Music Animator Timeline</h1>
          
          {showNewProjectForm && (
            <div className={styles.newProjectForm}>
              <form onSubmit={handleCreateProject}>
                <input
                  type="text"
                  placeholder="Project Name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className={styles.input}
                  required
                />
                <button type="submit" className={styles.createButton}>
                  Create
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowNewProjectForm(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
          
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
      </div>
    </div>
  );
};

export default TimelineContainer; 