import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { useTheme } from '../contexts/ThemeContext';
import TimelineContainer from './TimelineContainer';
import Images from './Images';
import { Videos } from './Videos';
import Txt2ImgPanel from './Txt2ImgPanel';
import Img2ImgPanel from './Img2ImgPanel';
import { 
  AppBar, 
  Box, 
  Button, 
  Container, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  FormControl, 
  IconButton,
  InputLabel, 
  MenuItem, 
  Paper, 
  Select, 
  Tab, 
  Tabs, 
  TextField, 
  Toolbar, 
  Typography,
  SelectChangeEvent
} from '@mui/material';
import {
  Brightness4 as LightModeIcon,
  Brightness7 as DarkModeIcon,
  Add as AddIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

interface DashboardProps {
  activeTab: 'projects' | 'images' | 'videos' | 'txt2img' | 'img2img';
}

const Dashboard: React.FC<DashboardProps> = ({ activeTab: initialActiveTab }) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'images' | 'videos' | 'txt2img' | 'img2img'>(initialActiveTab);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { 
    projects, 
    currentProject, 
    setCurrentProject, 
    createProject, 
    loading: projectsLoading 
  } = useProjects();
  
  const [openNewProjectDialog, setOpenNewProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectBpm, setNewProjectBpm] = useState(120);
  const [newProjectFps, setNewProjectFps] = useState(24);
  const [newProjectTotalBeats, setNewProjectTotalBeats] = useState(60);

  // Update active tab when prop changes
  useEffect(() => {
    setActiveTab(initialActiveTab);
  }, [initialActiveTab]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'projects' | 'images' | 'videos' | 'txt2img' | 'img2img') => {
    setActiveTab(newValue);
    if (newValue === 'images') {
      navigate('/images');
    } else if (newValue === 'videos') {
      navigate('/videos');
    } else if (newValue === 'txt2img') {
      navigate('/txt2img');
    } else if (newValue === 'img2img') {
      navigate('/img2img');
    } else {
      navigate('/');
    }
  };

  const handleProjectChange = (event: SelectChangeEvent) => {
    const projectId = event.target.value;
    if (projectId === 'new') {
      setOpenNewProjectDialog(true);
    } else {
      const selectedProject = projects.find(p => p.id === projectId);
      if (selectedProject) {
        setCurrentProject(selectedProject);
      }
    }
  };

  const handleOpenNewProjectDialog = () => {
    setOpenNewProjectDialog(true);
  };

  const handleCloseNewProjectDialog = () => {
    setOpenNewProjectDialog(false);
    setNewProjectName('');
  };

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      await createProject(newProjectName, newProjectBpm, newProjectFps, newProjectTotalBeats);
      handleCloseNewProjectDialog();
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      bgcolor: 'background.default', 
      color: 'text.primary'
    }}>
      <AppBar position="static" color="default" elevation={3}>
        <Toolbar>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200, mr: 2 }}>
            <InputLabel id="project-select-label">Project</InputLabel>
            <Select
              labelId="project-select-label"
              id="project-select"
              value={currentProject?.id || ''}
              onChange={handleProjectChange}
              label="Project"
            >
              {projects.length === 0 && (
                <MenuItem value="">No projects</MenuItem>
              )}
              {projects.map(project => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
              <MenuItem value="new">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AddIcon fontSize="small" sx={{ mr: 1 }} />
                  New Project
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Music Animator
          </Typography>

          <IconButton 
            onClick={toggleTheme} 
            color="inherit" 
            sx={{ mr: 2 }}
          >
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                {user.username}
              </Typography>
              <Button 
                variant="outlined" 
                color="inherit" 
                size="small" 
                onClick={logout}
                startIcon={<LogoutIcon />}
              >
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>

        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Projects" value="projects" />
          <Tab label="Images" value="images" />
          <Tab label="Videos" value="videos" />
          <Tab label="Txt2Img" value="txt2img" />
          <Tab label="Img2Img" value="img2img" />
        </Tabs>
      </AppBar>

      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 4 }}>
        {activeTab === 'projects' ? (
          <TimelineContainer />
        ) : activeTab === 'images' ? (
          <Images />
        ) : activeTab === 'videos' ? (
          <Videos />
        ) : activeTab === 'txt2img' ? (
          <Txt2ImgPanel />
        ) : (
          <Img2ImgPanel />
        )}
      </Container>

      {/* New Project Dialog */}
      <Dialog open={openNewProjectDialog} onClose={handleCloseNewProjectDialog}>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Project Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="bpm"
            label="BPM"
            type="number"
            fullWidth
            variant="outlined"
            value={newProjectBpm}
            onChange={(e) => setNewProjectBpm(Number(e.target.value))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="fps"
            label="FPS"
            type="number"
            fullWidth
            variant="outlined"
            value={newProjectFps}
            onChange={(e) => setNewProjectFps(Number(e.target.value))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="total-beats"
            label="Total Beats"
            type="number"
            fullWidth
            variant="outlined"
            value={newProjectTotalBeats}
            onChange={(e) => setNewProjectTotalBeats(Number(e.target.value))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewProjectDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateProject} 
            variant="contained" 
            color="primary"
            disabled={newProjectName.trim() === ''}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 