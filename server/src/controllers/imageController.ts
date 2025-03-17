import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import sizeOf from 'image-size';

const prisma = new PrismaClient();
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const sizeOfPromise = promisify(sizeOf);

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

export const imageController = {
  // Upload a new image
  async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { buffer, originalname, mimetype } = req.file;
      const userId = req.user.id;

      // Create user-specific directory
      const userDir = path.join(UPLOAD_DIR, userId);
      if (!fs.existsSync(userDir)) {
        await mkdir(userDir, { recursive: true });
      }

      // Generate unique identifier and filename
      const identifier = uuidv4();
      const extension = path.extname(originalname);
      const safeFilename = `${identifier}${extension}`;
      const filePath = path.join(userDir, safeFilename);

      // Get image dimensions
      const dimensions = await sizeOfPromise(buffer);
      
      if (!dimensions.width || !dimensions.height) {
        return res.status(400).json({ error: 'Invalid image file' });
      }

      // Write file to disk
      await writeFile(filePath, buffer);

      // Create image record in database
      const image = await prisma.image.create({
        data: {
          identifier,
          filePath,
          height: dimensions.height,
          width: dimensions.width,
          fileSize: buffer.length,
          imageType: mimetype,
          filename: originalname,
          userId
        }
      });

      res.status(201).json(image);
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  },

  // Get all images for the current user
  async getUserImages(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = req.user.id;
      const images = await prisma.image.findMany({
        where: { userId }
      });
      
      res.json(images);
    } catch (error) {
      console.error('Error fetching user images:', error);
      res.status(500).json({ error: 'Failed to fetch images' });
    }
  },

  // Get image by identifier
  async getImageByIdentifier(req: Request, res: Response) {
    try {
      const { identifier } = req.params;
      const image = await prisma.image.findUnique({
        where: { identifier }
      });
      
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      res.json(image);
    } catch (error) {
      console.error('Error fetching image:', error);
      res.status(500).json({ error: 'Failed to fetch image' });
    }
  },

  // Delete an image
  async deleteImage(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { identifier } = req.params;
      const userId = req.user.id;
      
      // Check if image exists and belongs to user
      const image = await prisma.image.findUnique({
        where: { identifier }
      });
      
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      if (image.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this image' });
      }
      
      // Delete file from disk
      if (fs.existsSync(image.filePath)) {
        await unlink(image.filePath);
      }
      
      // Remove from database
      await prisma.image.delete({
        where: { identifier }
      });
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  }
}; 