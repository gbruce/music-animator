import { Router } from 'express';
import { segmentController } from '../controllers/segmentController';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/projects/:projectId/segments', auth, segmentController.addSegment);
router.patch('/:segmentId', auth, segmentController.updateSegment);
router.delete('/:segmentId', auth, segmentController.removeSegment);

export default router; 