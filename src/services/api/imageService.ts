import { Image, IImage } from './models/Image';
import { v4 as uuidv4 } from 'uuid';
import { saveFile, deleteFile } from '../fileStorage';
import sizeOf from 'image-size';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const sizeOfPromise = promisify(sizeOf);

export interface ImageUploadParams {
  buffer: Buffer;
  filename: string;
  userId: string;
  imageType: string;
}

export interface ImageMetadata {
  id: string;
  identifier: string;
  filePath: string;
  height: number;
  width: number;
  fileSize: number;
  imageType: string;
  uploadDate: Date;
  filename: string;
  userId: string;
}

export const imageService = {
  // Upload a new image
  async uploadImage(params: ImageUploadParams): Promise<ImageMetadata> {
    const { buffer, filename, userId, imageType } = params;
    
    // Generate a unique identifier
    const identifier = uuidv4();
    
    // Save file to disk
    const filePath = await saveFile(buffer, filename, userId);
    
    // Get image dimensions
    const dimensions = await sizeOfPromise(buffer);
    
    // Create image record in database
    const image = new Image({
      userId,
      identifier,
      filePath,
      height: dimensions.height || 0,
      width: dimensions.width || 0,
      fileSize: buffer.length,
      imageType,
      filename
    });
    
    await image.save();
    
    return {
      id: image._id.toString(),
      identifier: image.identifier,
      filePath: image.filePath,
      height: image.height,
      width: image.width,
      fileSize: image.fileSize,
      imageType: image.imageType,
      uploadDate: image.uploadDate,
      filename: image.filename,
      userId: image.userId
    };
  },
  
  // Get image by identifier
  async getImageByIdentifier(identifier: string): Promise<ImageMetadata | null> {
    const image = await Image.findOne({ identifier });
    
    if (!image) {
      return null;
    }
    
    return {
      id: image._id.toString(),
      identifier: image.identifier,
      filePath: image.filePath,
      height: image.height,
      width: image.width,
      fileSize: image.fileSize,
      imageType: image.imageType,
      uploadDate: image.uploadDate,
      filename: image.filename,
      userId: image.userId
    };
  },
  
  // Get all images for a user
  async getUserImages(userId: string): Promise<ImageMetadata[]> {
    const images = await Image.find({ userId });
    
    return images.map(image => ({
      id: image._id.toString(),
      identifier: image.identifier,
      filePath: image.filePath,
      height: image.height,
      width: image.width,
      fileSize: image.fileSize,
      imageType: image.imageType,
      uploadDate: image.uploadDate,
      filename: image.filename,
      userId: image.userId
    }));
  },
  
  // Delete an image
  async deleteImage(identifier: string): Promise<boolean> {
    const image = await Image.findOne({ identifier });
    
    if (!image) {
      return false;
    }
    
    // Delete file from disk
    await deleteFile(image.filePath);
    
    // Remove from database
    await Image.deleteOne({ identifier });
    
    return true;
  },
  
  // Get image file path
  async getImageFilePath(identifier: string): Promise<string | null> {
    const image = await Image.findOne({ identifier });
    
    if (!image) {
      return null;
    }
    
    return image.filePath;
  },
  
  // Check if an image exists
  async imageExists(identifier: string): Promise<boolean> {
    const image = await Image.findOne({ identifier });
    return !!image;
  }
}; 