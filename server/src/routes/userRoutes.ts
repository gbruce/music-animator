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

// Add a simple ping endpoint for testing connectivity
router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

export default router; 