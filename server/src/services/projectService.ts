import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Project {
  id: string;
  name: string;
  bpm: number;
  fps: number;
  duration: number;
  trackStartBeat: number;
  trackDurationBeats: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDto {
  name: string;
  bpm?: number;
  fps?: number;
  duration?: number;
  trackStartBeat?: number;
  trackDurationBeats?: number;
  userId: string;
}

export interface UpdateProjectDto {
  name?: string;
  bpm?: number;
  fps?: number;
  duration?: number;
  trackStartBeat?: number;
  trackDurationBeats?: number;
}

export class ProjectService {
  async createProject(data: CreateProjectDto): Promise<Project> {
    return prisma.project.create({
      data: {
        name: data.name,
        bpm: data.bpm || 120,
        fps: data.fps || 24,
        duration: data.duration || 60,
        trackStartBeat: data.trackStartBeat || 0,
        trackDurationBeats: data.trackDurationBeats || 120,
        userId: data.userId,
      },
    }) as unknown as Project;
  }

  async getProjectById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
    }) as unknown as Project | null;
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Project[];
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data,
    }) as unknown as Project;
  }

  async deleteProject(id: string): Promise<Project> {
    return prisma.project.delete({
      where: { id },
    }) as unknown as Project;
  }
} 