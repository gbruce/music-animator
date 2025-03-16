import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { auth } from '../middleware/auth';

const router = Router();
const userController = new UserController();

// Public routes
router.post('/signup', userController.signup);
router.post('/login', userController.login);
router.post('/request-reset', userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword);

// Protected routes
router.get('/profile', auth, userController.getProfile);
router.post('/change-password', auth, userController.changePassword);

export default router; 