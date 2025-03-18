import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Track {
  id: string;
  name: string;
  startBeat: number;
  durationBeats: number;
  projectId: string;
  image1Id?: string | null;
  image2Id?: string | null;
  image3Id?: string | null;
  image4Id?: string | null;
  image5Id?: string | null;
  image6Id?: string | null;
  image7Id?: string | null;
  image8Id?: string | null;
  image9Id?: string | null;
  image10Id?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTrackDto {
  name: string;
  startBeat?: number;
  durationBeats?: number;
  projectId: string;
  image1Id?: string | null;
  image2Id?: string | null;
  image3Id?: string | null;
  image4Id?: string | null;
  image5Id?: string | null;
  image6Id?: string | null;
  image7Id?: string | null;
  image8Id?: string | null;
  image9Id?: string | null;
  image10Id?: string | null;
}

export interface UpdateTrackDto {
  name?: string;
  startBeat?: number;
  durationBeats?: number;
  image1Id?: string | null;
  image2Id?: string | null;
  image3Id?: string | null;
  image4Id?: string | null;
  image5Id?: string | null;
  image6Id?: string | null;
  image7Id?: string | null;
  image8Id?: string | null;
  image9Id?: string | null;
  image10Id?: string | null;
}

export class TrackService {
  async createTrack(data: CreateTrackDto): Promise<Track> {
    // Create the base data object
    const createData: any = {
      name: data.name,
      startBeat: data.startBeat ?? 0,
      durationBeats: data.durationBeats ?? 16,
      projectId: data.projectId,
    };

    // Only add image fields if they are provided
    if (data.image1Id !== undefined) createData.image1Id = data.image1Id;
    if (data.image2Id !== undefined) createData.image2Id = data.image2Id;
    if (data.image3Id !== undefined) createData.image3Id = data.image3Id;
    if (data.image4Id !== undefined) createData.image4Id = data.image4Id;
    if (data.image5Id !== undefined) createData.image5Id = data.image5Id;
    if (data.image6Id !== undefined) createData.image6Id = data.image6Id;
    if (data.image7Id !== undefined) createData.image7Id = data.image7Id;
    if (data.image8Id !== undefined) createData.image8Id = data.image8Id;
    if (data.image9Id !== undefined) createData.image9Id = data.image9Id;
    if (data.image10Id !== undefined) createData.image10Id = data.image10Id;

    return prisma.track.create({
      data: createData,
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