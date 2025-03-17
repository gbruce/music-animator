import { Request, Response } from 'express';
import { TrackService } from '../services/trackService';
import { ProjectService } from '../services/projectService';

export class TrackController {
  private trackService: TrackService;
  private projectService: ProjectService;

  constructor() {
    this.trackService = new TrackService();
    this.projectService = new ProjectService();
  }

  createTrack = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { projectId } = req.params;
      const { name, startBeat, durationBeats } = req.body;

      // Verify the project exists and belongs to the user
      const project = await this.projectService.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to access this project' });
      }

      const track = await this.trackService.createTrack({
        name,
        startBeat,
        durationBeats,
        projectId,
      });

      res.status(201).json(track);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getTracks = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { projectId } = req.params;

      // Verify the project exists and belongs to the user
      const project = await this.projectService.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to access this project' });
      }

      const tracks = await this.trackService.getTracksByProjectId(projectId);
      res.json(tracks);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getTrack = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const track = await this.trackService.getTrackById(id);

      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }

      // Verify the project exists and belongs to the user
      const project = await this.projectService.getProjectById(track.projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to access this track' });
      }

      res.json(track);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  updateTrack = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const track = await this.trackService.getTrackById(id);

      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }

      // Verify the project exists and belongs to the user
      const project = await this.projectService.getProjectById(track.projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to update this track' });
      }

      const { name, startBeat, durationBeats } = req.body;
      const updatedTrack = await this.trackService.updateTrack(id, {
        name,
        startBeat,
        durationBeats,
      });

      res.json(updatedTrack);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  deleteTrack = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const track = await this.trackService.getTrackById(id);

      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }

      // Verify the project exists and belongs to the user
      const project = await this.projectService.getProjectById(track.projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (project.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this track' });
      }

      await this.trackService.deleteTrack(id);
      res.json({ message: 'Track deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
} 