import { Router } from 'express';
import { SubscriptionController } from '../controllers/SubscriptionController';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';

const router = Router();
const ctrl = new SubscriptionController();

// Public: narx
router.get('/pricing', ctrl.getPricing);
router.patch('/pricing', authMiddleware, requireRole('SUPER_ADMIN'), ctrl.updatePricing);

// Admin: o'z to'lovlari
router.post('/', authMiddleware, ctrl.submitPayment);
router.get('/me', authMiddleware, ctrl.getMyPayments);

// Super Admin
router.get('/', authMiddleware, requireRole('SUPER_ADMIN'), ctrl.getAllPayments);
router.patch('/:id/review', authMiddleware, requireRole('SUPER_ADMIN'), ctrl.reviewPayment);
router.patch('/users/:id/block', authMiddleware, requireRole('SUPER_ADMIN'), ctrl.toggleBlock);

export { router as subscriptionRoutes };
