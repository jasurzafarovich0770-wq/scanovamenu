import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/restaurant/:restaurantId/info', AuthController.getRestaurantInfo);

// Protected routes
router.get('/me', authMiddleware, AuthController.getMe);
router.patch('/profile', authMiddleware, AuthController.updateProfile);
router.post('/change-password', authMiddleware, AuthController.changePassword);

// Super admin only
router.get('/users', authMiddleware, requireRole('SUPER_ADMIN'), AuthController.getAllUsers);
router.patch('/users/:id/role', authMiddleware, requireRole('SUPER_ADMIN'), AuthController.updateUserRole);
router.patch('/users/:id/permissions', authMiddleware, requireRole('SUPER_ADMIN'), AuthController.updatePermissions);
router.patch('/users/:id/assign-restaurant', authMiddleware, requireRole('SUPER_ADMIN'), AuthController.assignRestaurant);
router.delete('/users/:id', authMiddleware, requireRole('SUPER_ADMIN'), AuthController.deleteUser);

export { router as authRoutes };
