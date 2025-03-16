import { Request, Response } from 'express';
import { UserService } from '../services/userService';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  signup = async (req: Request, res: Response) => {
    try {
      const { email, username, password } = req.body;
      const result = await this.userService.createUser({ email, username, password });
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await this.userService.login({ email, password });
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  getProfile = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await this.userService.getUserById(userId);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  changePassword = async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { currentPassword, newPassword } = req.body;
      await this.userService.changePassword(userId, currentPassword, newPassword);
      res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  requestPasswordReset = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const resetToken = await this.userService.requestPasswordReset(email);
      
      // In a production environment, you would send this token via email
      // For development, we'll return it in the response
      res.json({ 
        message: 'Password reset instructions sent to your email',
        resetToken, // Remove this in production
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { email, token, newPassword } = req.body;
      await this.userService.resetPassword(email, token, newPassword);
      res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
} 