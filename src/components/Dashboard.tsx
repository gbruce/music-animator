import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TabNavigation, { Tab } from './TabNavigation';
import TimelineContainer from './TimelineContainer';
import Images from './Images';
import { timelineStyles as styles } from './styles/TimelineStyles';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';

interface DashboardProps {
  activeTab: Tab;
}

const Dashboard: React.FC<DashboardProps> = ({ activeTab: initialActiveTab }) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialActiveTab);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { 
    projects, 
    currentProject, 
    setCurrentProject, 
    createProject, 
    updateProject,
    loading: projectsLoading 
  } = useProjects();
  
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Update active tab when prop changes
  useEffect(() => {
    setActiveTab(initialActiveTab);
  }, [initialActiveTab]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'images') {
      navigate('/images');
    } else {
      navigate('/');
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
      await createProject(newProjectName, 120, 24, 60);
      setNewProjectName('');
      setShowNewProjectForm(false);
    }
  };

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

            <h1 className={styles.heading}>Music Animator</h1>

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
          
          <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
          
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

          {/* Render the content based on active tab */}
          <div className={styles.tabContent}>
            {activeTab === 'projects' ? (
              <TimelineContainer />
            ) : (
              <Images />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 