import { Request, Response, NextFunction } from 'express';
import { GuestSessionService } from '../../domain/services/GuestSessionService';
import { AppError } from '../middleware/errorHandler';

export class GuestController {
  constructor(private sessionService: GuestSessionService) {}

  createSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId, tableNumber } = req.body;

      if (!restaurantId || !tableNumber) {
        throw new AppError(400, 'Restaurant ID and table number required');
      }

      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const session = await this.sessionService.createSession({
        restaurantId,
        tableNumber,
        ipAddress,
        userAgent,
      });

      res.json({
        success: true,
        data: {
          sessionToken: session.sessionToken,
          restaurantId: session.restaurantId,
          tableNumber: session.tableNumber,
          expiresAt: session.expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  validateSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;

      const session = await this.sessionService.validateSession(token);

      res.json({
        success: true,
        data: {
          isValid: true,
          restaurantId: session.restaurantId,
          tableNumber: session.tableNumber,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
