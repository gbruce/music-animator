import express from 'express';
import multer from 'multer';
import { imageService } from '../services/api/imageService';
import { authenticateToken } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload a new image
router.post(
  '/upload',
  authenticateToken,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }
      
      const image = await imageService.uploadImage({
        buffer: req.file.buffer,
        filename: req.file.originalname,
        userId: req.user.id,
        imageType: req.file.mimetype
      });
      
      res.status(201).json(image);
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

// Get all images for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const images = await imageService.getUserImages(req.user.id);
    res.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Get image by identifier
router.get('/:identifier', async (req, res) => {
  try {
    const image = await imageService.getImageByIdentifier(req.params.identifier);
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Check if file exists
    if (!fs.existsSync(image.filePath)) {
      return res.status(404).json({ error: 'Image file not found' });
    }
    
    // Set appropriate content type
    res.setHeader('Content-Type', image.imageType);
    
    // Send the file
    res.sendFile(path.resolve(image.filePath));
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// Delete an image
router.delete('/:identifier', authenticateToken, async (req, res) => {
  try {
    const success = await imageService.deleteImage(req.params.identifier);
    
    if (!success) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

export default router; 