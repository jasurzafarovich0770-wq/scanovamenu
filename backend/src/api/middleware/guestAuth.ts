import { Request, Response, NextFunction } from 'express';
import { GuestSessionService } from '../../domain/services/GuestSessionService';
import { AppError } from './errorHandler';

export const guestAuthMiddleware = (sessionService: GuestSessionService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers['x-guest-token'] as string;

      if (!token) {
        throw new AppError(401, 'Guest session token required');
      }

      const session = await sessionService.validateSession(token);

      // Session yangilangan bo'lsa — yangi tokenni header orqali qaytarish
      if ((session as any)._renewed) {
        res.setHeader('x-new-guest-token', session.sessionToken);
      }

      (req as any).guestSession = session;
      next();
    } catch (error: any) {
      // Session topilmasa ham 401 emas, balki yangi session yaratishni taklif qilish
      if (error.message === 'Session not found') {
        next(new AppError(401, 'Session not found. Please scan QR code again.'));
      } else {
        next(new AppError(401, error.message));
      }
    }
  };
};
