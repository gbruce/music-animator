import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { promisify } from 'util';
import ytdl from '@distube/ytdl-core';
import { getVideoDurationInSeconds } from 'get-video-duration';

const prisma = new PrismaClient();
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

// Base directory for storing uploaded files
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
const initializeStorage = async (): Promise<void> => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to initialize storage directory:', error);
    throw error;
  }
};

// Initialize storage on startup
initializeStorage().catch(console.error);

export const videoController = {
  // Upload a new video from file
  async uploadVideo(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No video file provided' });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Generate a unique identifier for the video
      const identifier = crypto.randomBytes(16).toString('hex');
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const filename = `${identifier}${fileExt}`;
      
      // Create a directory for this video
      const videoDir = path.join(UPLOAD_DIR, identifier);
      await mkdir(videoDir, { recursive: true });
      
      // Save the video file
      const videoPath = path.join(videoDir, filename);
      await writeFile(videoPath, req.file.buffer);

      // Get video duration
      const duration = await getVideoDurationInSeconds(videoPath);

      // Extract folder ID from request if present
      const folderId = req.body.folderId || null;
      
      // Check if folder exists and belongs to the user (if folderId is provided)
      if (folderId) {
        const folder = await prisma.folder.findUnique({
          where: { id: folderId }
        });
        
        if (!folder) {
          res.status(404).json({ error: 'Folder not found' });
          return;
        }
        
        if (folder.userId !== userId) {
          res.status(403).json({ error: 'Access denied to folder' });
          return;
        }
      }

      // Create a record in the database
      const video = await prisma.video.create({
        data: {
          identifier,
          filePath: videoPath,
          duration,
          fileSize: req.file.size,
          videoType: req.file.mimetype,
          filename: req.file.originalname,
          userId,
          folderId
        }
      });

      res.status(201).json({
        id: video.id,
        identifier: video.identifier,
        filename: video.filename,
        duration: video.duration,
        fileSize: video.fileSize,
        videoType: video.videoType,
        uploadDate: video.uploadDate,
        folderId: video.folderId
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      res.status(500).json({ error: 'Failed to upload video' });
    }
  },

  // Download and save a YouTube video
  async downloadYouTubeVideo(req: Request, res: Response): Promise<void> {
    try {
      const { url } = req.body;
      if (!url) {
        res.status(400).json({ error: 'YouTube URL is required' });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get video info
      const info = await ytdl.getInfo(url);
      const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highest' });

      // Generate a unique identifier for the video
      const identifier = crypto.randomBytes(16).toString('hex');
      const fileExt = '.mp4';
      const filename = `${identifier}${fileExt}`;
      
      // Create a directory for this video
      const videoDir = path.join(UPLOAD_DIR, identifier);
      await mkdir(videoDir, { recursive: true });
      
      // Save the video file
      const videoPath = path.join(videoDir, filename);

      // Download and save the video
      await new Promise<void>((resolve, reject) => {
        const videoStream = ytdl(url, { format: videoFormat });
        const writeStream = fs.createWriteStream(videoPath);
        
        videoStream.pipe(writeStream);
        
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
        videoStream.on('error', reject);
      });

      // Get video duration and file size
      const duration = await getVideoDurationInSeconds(videoPath);
      const fileSize = fs.statSync(videoPath).size;

      // Extract folder ID from request if present
      const folderId = req.body.folderId || null;
      
      // Check if folder exists and belongs to the user (if folderId is provided)
      if (folderId) {
        const folder = await prisma.folder.findUnique({
          where: { id: folderId }
        });
        
        if (!folder) {
          res.status(404).json({ error: 'Folder not found' });
          return;
        }
        
        if (folder.userId !== userId) {
          res.status(403).json({ error: 'Access denied to folder' });
          return;
        }
      }

      // Create a record in the database
      const video = await prisma.video.create({
        data: {
          identifier,
          filePath: videoPath,
          duration,
          fileSize,
          videoType: 'video/mp4',
          filename: `${info.videoDetails.title}.mp4`,
          userId,
          folderId
        }
      });

      res.status(201).json({
        id: video.id,
        identifier: video.identifier,
        filename: video.filename,
        duration: video.duration,
        fileSize: video.fileSize,
        videoType: video.videoType,
        uploadDate: video.uploadDate,
        folderId: video.folderId,
        youtubeInfo: {
          title: info.videoDetails.title,
          author: info.videoDetails.author,
          lengthSeconds: info.videoDetails.lengthSeconds,
        }
      });

    } catch (error) {
      console.error('Error downloading YouTube video:', error);
      res.status(500).json({ error: 'Failed to download YouTube video' });
    }
  },

  // Get all videos for the current user
  async getUserVideos(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const folderId = req.query.folderId as string | undefined;

      const videos = await prisma.video.findMany({
        where: {
          userId,
          folderId: folderId || undefined,
        },
        orderBy: {
          uploadDate: 'desc'
        }
      });

      res.json(videos);
    } catch (error) {
      console.error('Error getting user videos:', error);
      res.status(500).json({ error: 'Failed to get user videos' });
    }
  },

  // Get video by identifier
  async getVideoByIdentifier(req: Request, res: Response): Promise<void> {
    try {
      const { identifier } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const video = await prisma.video.findFirst({
        where: {
          identifier,
          userId
        }
      });

      if (!video) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }

      res.json(video);
    } catch (error) {
      console.error('Error getting video:', error);
      res.status(500).json({ error: 'Failed to get video' });
    }
  },

  // Delete a video
  async deleteVideo(req: Request, res: Response): Promise<void> {
    try {
      const { identifier } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Find the video to get the file path
      const video = await prisma.video.findFirst({
        where: {
          identifier,
          userId
        }
      });

      if (!video) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }

      // Delete the database record
      await prisma.video.delete({
        where: {
          id: video.id
        }
      });

      // Delete the video directory and all its contents
      const videoDir = path.dirname(video.filePath);
      if (fs.existsSync(videoDir)) {
        fs.rmSync(videoDir, { recursive: true, force: true });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting video:', error);
      res.status(500).json({ error: 'Failed to delete video' });
    }
  },
  
  // Move videos to a folder
  async moveVideosToFolder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { videoIds, folderId } = req.body;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      if (!Array.isArray(videoIds) || videoIds.length === 0) {
        res.status(400).json({ error: 'Video IDs are required' });
        return;
      }
      
      // Check if folder exists and belongs to the user
      if (folderId) {
        const folder = await prisma.folder.findFirst({
          where: {
            id: folderId,
            userId
          }
        });
        
        if (!folder) {
          res.status(404).json({ error: 'Folder not found' });
          return;
        }
      }
      
      // Update all videos
      await prisma.video.updateMany({
        where: {
          id: {
            in: videoIds
          },
          userId
        },
        data: {
          folderId
        }
      });
      
      res.status(200).json({ message: 'Videos moved successfully' });
    } catch (error) {
      console.error('Error moving videos:', error);
      res.status(500).json({ error: 'Failed to move videos' });
    }
  }
}; 