import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Track {
  id: string;
  name: string;
  startBeat: number;
  durationBeats: number;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTrackDto {
  name: string;
  startBeat?: number;
  durationBeats?: number;
  projectId: string;
}

export interface UpdateTrackDto {
  name?: string;
  startBeat?: number;
  durationBeats?: number;
}

export class TrackService {
  async createTrack(data: CreateTrackDto): Promise<Track> {
    return prisma.track.create({
      data: {
        name: data.name,
        startBeat: data.startBeat ?? 0,
        durationBeats: data.durationBeats ?? 16,
        projectId: data.projectId,
      },
    }) as unknown as Track;
  }

  async getTrackById(id: string): Promise<Track | null> {
    return prisma.track.findUnique({
      where: { id },
    }) as unknown as Track | null;
  }

  async getTracksByProjectId(projectId: string): Promise<Track[]> {
    return prisma.track.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    }) as unknown as Track[];
  }

  async updateTrack(id: string, data: UpdateTrackDto): Promise<Track> {
    return prisma.track.update({
      where: { id },
      data,
    }) as unknown as Track;
  }

  async deleteTrack(id: string): Promise<Track> {
    return prisma.track.delete({
      where: { id },
    }) as unknown as Track;
  }
} 