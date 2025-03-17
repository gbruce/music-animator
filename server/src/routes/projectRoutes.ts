import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { auth } from '../middleware/auth';

const router = Router();
const projectController = new ProjectController();

// All project routes are protected
router.post('/', auth, projectController.createProject);
router.get('/', auth, projectController.getProjects);
router.get('/:id', auth, projectController.getProject);
router.put('/:id', auth, projectController.updateProject);
router.delete('/:id', auth, projectController.deleteProject);

export default router; 