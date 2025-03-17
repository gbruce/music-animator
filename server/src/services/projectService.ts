import { PrismaClient } from '@prisma/client';
import { Track } from './trackService';

const prisma = new PrismaClient();

export interface Project {
  id: string;
  name: string;
  bpm: number;
  fps: number;
  duration: number;
  userId: string;
  tracks: Track[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDto {
  name: string;
  bpm?: number;
  fps?: number;
  duration?: number;
  userId: string;
}

export interface UpdateProjectDto {
  name?: string;
  bpm?: number;
  fps?: number;
  duration?: number;
}

export class ProjectService {
  async createProject(data: CreateProjectDto): Promise<Project> {
    return prisma.project.create({
      data: {
        name: data.name,
        bpm: data.bpm || 120,
        fps: data.fps || 24,
        duration: data.duration || 60,
        userId: data.userId,
      },
      include: {
        tracks: true,
      },
    }) as unknown as Project;
  }

  async getProjectById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
      include: {
        tracks: true,
      },
    }) as unknown as Project | null;
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    console.log('getProjectsByUserId', userId);
    return prisma.project.findMany({
      where: { userId },
      include: {
        tracks: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as unknown as Project[];
  }

  async updateProject(id: string, data: UpdateProjectDto): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data,
      include: {
        tracks: true,
      },
    }) as unknown as Project;
  }

  async deleteProject(id: string): Promise<Project> {
    return prisma.project.delete({
      where: { id },
      include: {
        tracks: true,
      },
    }) as unknown as Project;
  }
} 