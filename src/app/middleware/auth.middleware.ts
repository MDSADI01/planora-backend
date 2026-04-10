import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth/jwt.util';
import { Role } from '../../generated/prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

export const authorization = (...roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'You are not authorized',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyToken(token) as { userId: string; role: string };
      req.user = decoded;
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    if (roles.length && !roles.includes(req.user.role as Role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden! You are not authorized to access this page',
      });
    }
    
    next();
  };
};
