import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';

interface JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Auth middleware called');
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader);
    
    const token = authHeader?.replace('Bearer ', '');
    console.log('Token extracted:', token ? 'Token exists' : 'No token');

    if (!token) {
      throw new Error('No token provided');
    }

    console.log('Verifying token with secret:', JWT_SECRET.substring(0, 3) + '...');
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log('Token decoded, userId:', decoded.userId);
    
    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Set the user on the request object
    req.user = user;
    console.log('User set on request object');
    
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({ error: 'Please authenticate' });
  }
}; 