import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import sizeOf from 'image-size';
import crypto from 'crypto';
import sharp from 'sharp';

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
  async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No image file provided' });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Generate a unique identifier for the image
      const identifier = crypto.randomBytes(16).toString('hex');
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const filename = `${identifier}${fileExt}`;
      const filePath = path.join(UPLOAD_DIR, filename);

      // Get image dimensions using sharp
      const metadata = await sharp(req.file.buffer).metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;

      // Save the file to disk
      fs.writeFileSync(filePath, req.file.buffer);

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
      const image = await prisma.image.create({
        data: {
          identifier,
          filePath,
          height,
          width,
          fileSize: req.file.size,
          imageType: req.file.mimetype,
          filename: req.file.originalname,
          userId,
          folderId
        }
      });

      res.status(201).json({
        id: image.id,
        identifier: image.identifier,
        filename: image.filename,
        width: image.width,
        height: image.height,
        fileSize: image.fileSize,
        imageType: image.imageType,
        uploadDate: image.uploadDate,
        folderId: image.folderId
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  },

  // Get all images for the current user
  async getUserImages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get the optional folderId query parameter
      const folderId = req.query.folderId as string | undefined;
      
      const images = await prisma.image.findMany({
        where: {
          userId,
          folderId: folderId || null
        },
        orderBy: {
          uploadDate: 'desc'
        }
      });

      res.json(images);
    } catch (error) {
      console.error('Error getting user images:', error);
      res.status(500).json({ error: 'Failed to get user images' });
    }
  },

  // Get image by identifier
  async getImageByIdentifier(req: Request, res: Response): Promise<void> {
    try {
      const { identifier } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const image = await prisma.image.findFirst({
        where: {
          identifier,
          userId
        }
      });

      if (!image) {
        res.status(404).json({ error: 'Image not found' });
        return;
      }

      res.json(image);
    } catch (error) {
      console.error('Error getting image:', error);
      res.status(500).json({ error: 'Failed to get image' });
    }
  },

  // Delete an image
  async deleteImage(req: Request, res: Response): Promise<void> {
    try {
      const { identifier } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Find the image to get the file path
      const image = await prisma.image.findFirst({
        where: {
          identifier,
          userId
        }
      });

      if (!image) {
        res.status(404).json({ error: 'Image not found' });
        return;
      }

      // Delete the database record
      await prisma.image.delete({
        where: {
          id: image.id
        }
      });

      // Delete the file from disk
      if (fs.existsSync(image.filePath)) {
        fs.unlinkSync(image.filePath);
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  },
  
  // Move images to a folder
  async moveImagesToFolder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { imageIds, folderId } = req.body;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      
      if (!Array.isArray(imageIds) || imageIds.length === 0) {
        res.status(400).json({ error: 'Image IDs are required' });
        return;
      }
      
      // Check if folder exists and belongs to the user (if not null)
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
      
      // Update all the specified images
      await prisma.image.updateMany({
        where: {
          id: { in: imageIds },
          userId
        },
        data: {
          folderId: folderId || null
        }
      });
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error moving images to folder:', error);
      res.status(500).json({ error: 'Failed to move images' });
    }
  }
}; 