import { Router } from 'express';
import { TrackController } from '../controllers/trackController';
import { auth } from '../middleware/auth';

const router = Router();
const trackController = new TrackController();

// All track routes are protected
router.post('/projects/:projectId/tracks', auth, trackController.createTrack);
router.get('/projects/:projectId/tracks', auth, trackController.getTracks);
router.get('/tracks/:id', auth, trackController.getTrack);
router.put('/tracks/:id', auth, trackController.updateTrack);
router.delete('/tracks/:id', auth, trackController.deleteTrack);

export default router; 