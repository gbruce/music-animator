import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';

export interface UserInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class UserService {
  async createUser(data: UserInput) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    try {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          password: hashedPassword,
        },
      });

      const { password, ...userWithoutPassword } = user;
      const token = this.generateToken(user.id);

      return { user: userWithoutPassword, token };
    } catch (error: any) {
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
          throw new Error('Email already exists');
        }
        if (error.meta?.target?.includes('username')) {
          throw new Error('Username already exists');
        }
      }
      throw error;
    }
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      throw new Error('Invalid email or password');
    }

    const { password, resetToken, resetTokenExpiry, ...userWithoutPassword } = user;
    const token = this.generateToken(user.id);

    return { user: userWithoutPassword, token };
  }

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const { password, resetToken, resetTokenExpiry, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('No user found with this email');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // In a real application, you would send this token via email
    // For development, we'll just return it
    return resetToken;
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        email,
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  }

  private generateToken(userId: string) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
  }
} 