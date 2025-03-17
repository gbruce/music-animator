import { Request, Response } from 'express';
import { ProjectService } from '../services/projectService';

export class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  createProject = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { name, bpm, fps, duration, trackStartBeat, trackDurationBeats } = req.body;
      const project = await this.projectService.createProject({
        name,
        bpm,
        fps,
        duration,
        trackStartBeat,
        trackDurationBeats,
        userId,
      });

      res.status(201).json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getProjects = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const projects = await this.projectService.getProjectsByUserId(userId);
      res.json(projects);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getProject = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const project = await this.projectService.getProjectById(id);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to access this project' });
      }

      res.json(project);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  updateProject = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const project = await this.projectService.getProjectById(id);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to update this project' });
      }

      const { name, bpm, fps, duration, trackStartBeat, trackDurationBeats } = req.body;
      const updatedProject = await this.projectService.updateProject(id, {
        name,
        bpm,
        fps,
        duration,
        trackStartBeat,
        trackDurationBeats,
      });

      res.json(updatedProject);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  deleteProject = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const project = await this.projectService.getProjectById(id);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this project' });
      }

      await this.projectService.deleteProject(id);
      res.json({ message: 'Project deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
} 