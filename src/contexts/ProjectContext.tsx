import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, projectApi } from '../services/api';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (name: string, bpm?: number, fps?: number, duration?: number) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedProjects = await projectApi.getProjects();
      setProjects(fetchedProjects);
      
      // Set the first project as current if there's no current project
      if (fetchedProjects.length > 0 && !currentProject) {
        setCurrentProject(fetchedProjects[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (
    name: string,
    bpm = 120,
    fps = 24,
    duration = 60,
  ): Promise<Project> => {
    setLoading(true);
    setError(null);
    
    try {
      const newProject = await projectApi.createProject({
        name,
        bpm,
        fps,
        duration,
      });
      
      setProjects(prev => [newProject, ...prev]);
      setCurrentProject(newProject);
      return newProject;
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      console.error('Error creating project:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id: string, data: Partial<Project>): Promise<Project> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedProject = await projectApi.updateProject(id, data);
      
      setProjects(prev => 
        prev.map(project => project.id === id ? updatedProject : project)
      );
      
      if (currentProject && currentProject.id === id) {
        setCurrentProject(updatedProject);
      }
      
      return updatedProject;
    } catch (err: any) {
      setError(err.message || 'Failed to update project');
      console.error('Error updating project:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await projectApi.deleteProject(id);
      
      const updatedProjects = projects.filter(project => project.id !== id);
      setProjects(updatedProjects);
      
      if (currentProject && currentProject.id === id) {
        setCurrentProject(updatedProjects.length > 0 ? updatedProjects[0] : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
      console.error('Error deleting project:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects when the user changes
  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
    }
  }, [user]);

  const value = {
    projects,
    currentProject,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}; 