import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth/jwt.util';
import { Role } from '../../generated/prisma/client';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string;
      role: string;
    };
  }
}

export const authorization = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'You are not authorized',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'You are not authorized',
      });
      return;
    }

    let decoded: { userId: string; role: string };

    try {
      decoded = verifyToken(token) as { userId: string; role: string };
      req.user = decoded;
    } catch {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }

    if (roles.length && !roles.includes(decoded.role as Role)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden! You are not authorized to access this page',
      });
      return;
    }
    
    next();
  };
};
