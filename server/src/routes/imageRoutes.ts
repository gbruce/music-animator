import express from 'express';
import { auth } from '../middleware/auth';
import multer from 'multer';
import { imageController } from '../controllers/imageController';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Routes that require authentication
router.use(auth);

// Upload a new image
router.post('/upload', upload.single('image'), imageController.uploadImage);

// Get all images for the current user
router.get('/', imageController.getUserImages);

// Get image by identifier
router.get('/:identifier', imageController.getImageByIdentifier);

// Delete an image
router.delete('/:identifier', imageController.deleteImage);

// Move images to a folder
router.post('/move', imageController.moveImagesToFolder);

export default router; 