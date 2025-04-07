import express from 'express';
import { auth } from '../middleware/auth';
import multer from 'multer';
import { videoController } from '../controllers/videoController';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Routes that require authentication
router.use(auth);

// Upload a new video from file
router.post('/upload', upload.single('video'), videoController.uploadVideo);

// Download and save a YouTube video
router.post('/youtube', videoController.downloadYouTubeVideo);

// Get all videos for the current user
router.get('/', videoController.getUserVideos);

// Get video by identifier
router.get('/:identifier', videoController.getVideoByIdentifier);

// Delete a video
router.delete('/:identifier', videoController.deleteVideo);

// Move videos to a folder
router.post('/move', videoController.moveVideosToFolder);

export default router; 