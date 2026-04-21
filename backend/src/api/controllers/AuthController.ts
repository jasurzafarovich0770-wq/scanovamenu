import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../domain/services/AuthService';
import { AuthRepository } from '../../infrastructure/repositories/AuthRepository';
import { AppError } from '../middleware/errorHandler';
import { JwtPayload } from '../middleware/authMiddleware';

const authService = new AuthService(new AuthRepository());

export class AuthController {
  // POST /api/auth/login
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      if (!username || !password) throw new AppError(400, 'Username va parol kiritilishi shart');
      const result = await authService.login(username, password);
      res.json({ success: true, data: result });
    } catch (err: any) {
      if (err.message === 'ACCOUNT_BLOCKED') {
        return next(new AppError(403, 'Hisobingiz bloklangan. Super admin bilan bog\'laning.'));
      }
      next(err);
    }
  }

  // POST /api/auth/register
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password, role, restaurantId, restaurantName, ownerName, email, phone, tables } = req.body;
      if (!username || !password) throw new AppError(400, 'Username va parol kiritilishi shart');
      const result = await authService.register({
        username, password,
        role: role || 'CUSTOMER',
        restaurantId, restaurantName, ownerName, email, phone, tables,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/auth/me
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user as JwtPayload;
      const data = await authService.getMe(user.userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/auth/profile
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user as JwtPayload;
      const data = await authService.updateProfile(user.userId, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/auth/change-password
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user as JwtPayload;
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) throw new AppError(400, 'Eski va yangi parol kiritilishi shart');
      await authService.changePassword(user.userId, oldPassword, newPassword);
      res.json({ success: true, message: 'Parol muvaffaqiyatli o\'zgartirildi' });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/auth/restaurant/:restaurantId/info  (public)
  static async getRestaurantInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { restaurantId } = req.params;
      const info = await authService.getRestaurantInfo(restaurantId);
      res.json({ success: true, data: info });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/auth/users  (super-admin only)
  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await authService.getAllUsers();
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/auth/users/:id/role
  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      if (!role) throw new AppError(400, 'Role kiritilishi shart');
      const data = await authService.updateUserRole(id, role);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/auth/users/:id/permissions
  static async updatePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      if (!permissions) throw new AppError(400, 'Permissions kiritilishi shart');
      const data = await authService.updatePermissions(id, permissions);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/auth/users/:id
  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await authService.deleteUser(id);
      res.json({ success: true, message: 'Foydalanuvchi o\'chirildi' });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/auth/users/:id/assign-restaurant
  static async assignRestaurant(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { restaurantId, restaurantName } = req.body;
      if (!restaurantId) throw new AppError(400, 'restaurantId kiritilishi shart');
      const data = await authService.assignRestaurant(id, restaurantId, restaurantName);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
