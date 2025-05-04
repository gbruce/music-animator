import { Request, Response } from 'express';
import { SegmentService } from '../services/segmentService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const segmentService = new SegmentService();

export const segmentController = {
  async addSegment(req: Request, res: Response) {
    console.log('addSegment',req.body);
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Not authenticated' });
      const { projectId } = req.params;
      // Check project ownership
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return res.status(404).json({ error: 'Project not found' });
      if (project.userId !== user.id) return res.status(403).json({ error: 'Not authorized' });
      const segment = await segmentService.addSegment(projectId, req.body);
      res.status(201).json(segment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async updateSegment(req: Request, res: Response) {
    console.log('updateSegment',req.body);
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Not authenticated' });
      const { segmentId } = req.params;
      const segment = await prisma.segment.findUnique({ where: { id: segmentId }, include: { project: true } });
      if (!segment) return res.status(404).json({ error: 'Segment not found' });
      if (segment.project.userId !== user.id) return res.status(403).json({ error: 'Not authorized' });
      const updated = await segmentService.updateSegment(segmentId, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async removeSegment(req: Request, res: Response) {
    console.log('removeSegment',req.body);
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Not authenticated' });
      const { segmentId } = req.params;
      const segment = await prisma.segment.findUnique({ where: { id: segmentId }, include: { project: true } });
      if (!segment) return res.status(404).json({ error: 'Segment not found' });
      if (segment.project.userId !== user.id) return res.status(403).json({ error: 'Not authorized' });
      await segmentService.removeSegment(segmentId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}; 