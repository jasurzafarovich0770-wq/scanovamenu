import { Router } from 'express';
import { guestRoutes } from './guest.routes';
import { orderRoutes } from './order.routes';
import { menuRoutes } from './menu.routes';
import { verifyRoutes } from './verify.routes';
import { waiterRoutes } from './waiter.routes';
import { authRoutes } from './auth.routes';
import { subscriptionRoutes } from './subscription.routes';
import { authMiddleware } from '../middleware/authMiddleware';
import { activeMiddleware } from '../middleware/activeMiddleware';
import { upload, uploadFile, handleMulterError } from '../controllers/UploadController';

const router = Router();

// Public / guest routes — no paywall check
router.use('/auth', authRoutes);
router.use('/guest', guestRoutes);
router.use('/verify', verifyRoutes);
router.use('/subscriptions', subscriptionRoutes);

// Protected routes — authMiddleware then activeMiddleware (paywall)
// /menu and /waiters are fully auth-protected
router.use('/menu', authMiddleware, activeMiddleware, menuRoutes);
router.use('/waiters', authMiddleware, activeMiddleware, waiterRoutes);

// /orders has mixed auth (some guest, some admin routes).
// Individual routes handle their own authMiddleware; we add activeMiddleware
// here so it runs after any auth is resolved. It skips gracefully if no user.
router.use('/orders', activeMiddleware, orderRoutes);

// Upload route — auth protected, no paywall check needed
router.post('/upload', authMiddleware, upload.single('file'), handleMulterError, uploadFile);

// Webhook stubs — Click / Payme future integration
router.post('/webhooks/click', (_req, res) => res.json({ success: true }));
router.post('/webhooks/payme', (_req, res) => res.json({ success: true }));

export { router as apiRoutes };
