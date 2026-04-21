import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { AppError } from './errorHandler';

export interface JwtPayload {
  userId: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';
  restaurantId?: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Token taqdim etilmadi'));
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    (req as any).user = payload;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError(401, 'Token muddati tugagan. Qayta kiring.'));
    }
    next(new AppError(401, 'Token yaroqsiz'));
  }
};

export const requireRole = (...roles: JwtPayload['role'][]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as JwtPayload;
    if (!user || !roles.includes(user.role)) {
      return next(new AppError(403, 'Ruxsat yo\'q'));
    }
    next();
  };
