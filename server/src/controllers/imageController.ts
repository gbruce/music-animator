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

// Don't use promisify with sizeOf as it already has a callback pattern
// const sizeOfPromise = promisify(sizeOf);

// Create a proper promise-based wrapper for sizeOf
const sizeOfPromise = (buffer: Buffer) => {
  return new Promise((resolve, reject) => {
    try {
      // Use synchronous version which is more reliable with buffers
      const dimensions = sizeOf(buffer);
      resolve(dimensions);
    } catch (error) {
      reject(error);
    }
  });
};

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
      console.log('Upload image handler called');
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { buffer, originalname, mimetype } = req.file;
      const userId = req.user.id;
      
      console.log(`Processing image: ${originalname} (${buffer.length} bytes)`);

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

      console.log('Getting image dimensions...');
      let dimensions;
      try {
        // Use synchronous version to avoid callback issues
        dimensions = sizeOf(buffer);
        console.log('Image dimensions:', dimensions);
      } catch (err) {
        console.error('Error getting image dimensions:', err);
        return res.status(400).json({ error: 'Could not determine image dimensions' });
      }
      
      if (!dimensions || !dimensions.width || !dimensions.height) {
        return res.status(400).json({ error: 'Invalid image file' });
      }

      // Write file to disk
      console.log('Writing file to disk...');
      await writeFile(filePath, buffer);
      console.log('File written successfully');

      // Create image record in database
      console.log('Creating database record...');
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
      console.log('Database record created');

      res.status(201).json(image);
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  },

  // Get all images for the current user
  async getUserImages(req: Request, res: Response) {
    try {
      console.log('getUserImages called');
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = req.user.id;
      console.log('Fetching images for user:', userId);
      
      const images = await prisma.image.findMany({
        where: { userId }
      });
      
      console.log(`Found ${images.length} images`);
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