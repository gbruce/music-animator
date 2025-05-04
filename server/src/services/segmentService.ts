import { PrismaClient, Segment, SegmentImage } from '@prisma/client';

const prisma = new PrismaClient();

export interface SegmentInput {
  draftVideoId?: string;
  upscaleVideoId?: string;
  startFrame: number;
  duration: number;
  images: { imageId: string; order?: number }[];
}

export interface UpdateSegmentInput {
  draftVideoId?: string;
  upscaleVideoId?: string;
  startFrame?: number;
  duration?: number;
  images?: { imageId: string; order?: number }[];
}

export class SegmentService {
  async addSegment(projectId: string, data: SegmentInput): Promise<Segment> {
    const segment = await prisma.segment.create({
      data: {
        projectId,
        draftVideoId: data.draftVideoId,
        upscaleVideoId: data.upscaleVideoId,
        startFrame: data.startFrame,
        duration: data.duration,
        images: {
          create: data.images.map((img, idx) => ({
            imageId: img.imageId,
            order: img.order ?? idx
          }))
        }
      },
      include: { images: true }
    });
    return segment;
  }

  async updateSegment(segmentId: string, data: UpdateSegmentInput): Promise<Segment | null> {
    // Update segment fields
    const segment = await prisma.segment.update({
      where: { id: segmentId },
      data: {
        draftVideoId: data.draftVideoId,
        upscaleVideoId: data.upscaleVideoId,
        startFrame: data.startFrame,
        duration: data.duration
      }
    });
    // If images are provided, update them
    if (data.images) {
      // Remove existing images
      await prisma.segmentImage.deleteMany({ where: { segmentId } });
      // Add new images
      await prisma.segmentImage.createMany({
        data: data.images.map((img, idx) => ({
          segmentId,
          imageId: img.imageId,
          order: img.order ?? idx
        }))
      });
    }
    return prisma.segment.findUnique({ where: { id: segmentId }, include: { images: true } });
  }

  async removeSegment(segmentId: string): Promise<void> {
    await prisma.segmentImage.deleteMany({ where: { segmentId } });
    await prisma.segment.delete({ where: { id: segmentId } });
  }
} 