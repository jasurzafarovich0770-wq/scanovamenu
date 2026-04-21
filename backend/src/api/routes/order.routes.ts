import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { OrderService } from '../../domain/services/OrderService';
import { OrderRepository } from '../../infrastructure/repositories/OrderRepository';
import { WalletRepository } from '../../infrastructure/repositories/WalletRepository';
import { GuestSessionService } from '../../domain/services/GuestSessionService';
import { GuestSessionRepository } from '../../infrastructure/repositories/GuestSessionRepository';
import { guestAuthMiddleware } from '../middleware/guestAuth';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';

const router = Router();

const orderRepo = new OrderRepository();
const walletRepo = new WalletRepository();
const orderService = new OrderService(orderRepo, walletRepo);
const orderController = new OrderController(orderService);

const sessionRepo = new GuestSessionRepository();
const sessionService = new GuestSessionService(sessionRepo);

router.post('/', guestAuthMiddleware(sessionService), orderController.createOrder);
router.get('/restaurant/:restaurantId', authMiddleware, orderController.getOrdersByRestaurant);
router.get('/all', authMiddleware, requireRole('SUPER_ADMIN'), orderController.getAllOrders);
// Guest o'z sessiyasidagi barcha buyurtmalarni ko'rishi
router.get('/my/session', guestAuthMiddleware(sessionService), orderController.getMyOrders);
router.get('/:orderId', orderController.getOrder);
router.patch('/:orderId/status', authMiddleware, requireRole('ADMIN', 'SUPER_ADMIN'), orderController.updateOrderStatus);
router.patch('/:orderId/cancel', guestAuthMiddleware(sessionService), orderController.cancelOrderByGuest);
// Ofitsiant chaqirish
router.post('/:orderId/call-waiter', guestAuthMiddleware(sessionService), orderController.callWaiter);
// Admin ofitsiant chaqiruvini o'chirish
router.delete('/:orderId/call-waiter', authMiddleware, orderController.dismissWaiterCall);

export { router as orderRoutes };
