import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../../domain/services/OrderService';
import { OrderStatus } from '@restaurant-saas/shared';
import { AppError } from '../middleware/errorHandler';
import { AuthRepository } from '../../infrastructure/repositories/AuthRepository';

const authRepo = new AuthRepository();

export class OrderController {
  constructor(private orderService: OrderService) {}

  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const guestSession = (req as any).guestSession;
      const { items, paymentMethod, orderType, specialInstructions, waiterId, serviceFeePercent: clientFeePercent } = req.body;

      if (!items || items.length === 0) {
        throw new AppError(400, 'Order items required');
      }

      const subtotal = items.reduce((sum: number, item: any) =>
        sum + (item.price * item.quantity), 0
      );

      // Service fee ni backend da hisoblash
      let serviceFeePercent = 10;
      try {
        const restaurantUser = await authRepo.findByRestaurantId(guestSession.restaurantId);
        if (restaurantUser?.serviceFeePercent !== undefined) {
          serviceFeePercent = restaurantUser.serviceFeePercent;
        } else if (clientFeePercent !== undefined && clientFeePercent >= 0) {
          // Backend da foydalanuvchi yo'q — client dan kelgan foizni ishlatamiz
          serviceFeePercent = Number(clientFeePercent);
        }
      } catch {
        if (clientFeePercent !== undefined && clientFeePercent >= 0) {
          serviceFeePercent = Number(clientFeePercent);
        }
      }

      const serviceFee = Math.round(subtotal * serviceFeePercent / 100);
      const total = subtotal + serviceFee;

      const order = await this.orderService.createOrder({
        restaurantId: guestSession.restaurantId,
        tableNumber: guestSession.tableNumber,
        guestSessionId: guestSession.id,
        waiterId: waiterId || undefined,
        items,
        subtotal,
        serviceFee,
        tax: 0,
        total,
        paymentMethod: paymentMethod || 'CASH',
        orderType: orderType || 'DINE_IN',
        specialInstructions,
      });

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order placed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const order = await this.orderService.getOrderById(orderId);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!Object.values(OrderStatus).includes(status)) {
        throw new AppError(400, 'Invalid order status');
      }

      const order = await this.orderService.updateOrderStatus(orderId, status);

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  getOrdersByRestaurant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.params;
      const user = (req as any).user;

      if (user.role === 'ADMIN' && user.restaurantId !== restaurantId) {
        throw new AppError(403, 'Ruxsat yo\'q');
      }

      const result = await this.orderService.getOrdersByRestaurant(restaurantId);
      const { OrderRepository } = await import('../../infrastructure/repositories/OrderRepository');

      // PaginatedResponse yoki array bo'lishi mumkin
      const rawOrders: any[] = (result as any).data ?? (result as any);
      const ordersWithFlag = rawOrders.map((o: any) => ({
        ...o,
        waiterCalled: OrderRepository.isWaiterCalled(o.id),
      }));

      res.json({
        success: true,
        data: (result as any).data
          ? { ...(result as any), data: ordersWithFlag }
          : ordersWithFlag,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await this.orderService.getAllOrders();

      res.json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  };

  getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const guestSession = (req as any).guestSession;
      const orders = await this.orderService.getOrdersBySession(guestSession.id);
      res.json({ success: true, data: orders });
    } catch (error) { next(error); }
  };

  cancelOrderByGuest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const guestSession = (req as any).guestSession;

      const order = await this.orderService.getOrderById(orderId);

      // Faqat o'z sessiyasiga tegishli buyurtmani bekor qila oladi
      if (order.guestSessionId !== guestSession.id) {
        throw new AppError(403, 'Bu buyurtmani bekor qilish huquqingiz yo\'q');
      }

      if (order.status !== 'PENDING') {
        throw new AppError(400, 'Faqat kutilayotgan buyurtmani bekor qilish mumkin');
      }

      const updated = await this.orderService.updateOrderStatus(orderId, 'CANCELLED' as any);

      res.json({
        success: true,
        data: updated,
        message: 'Buyurtma bekor qilindi',
      });
    } catch (error) {
      next(error);
    }
  };

  callWaiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const guestSession = (req as any).guestSession;

      const order = await this.orderService.getOrderById(orderId);

      if (order.guestSessionId !== guestSession.id) {
        throw new AppError(403, 'Ruxsat yo\'q');
      }

      await this.orderService.setWaiterCalled(orderId, true);

      res.json({ success: true, message: 'Ofitsiant chaqirildi' });
    } catch (error) {
      next(error);
    }
  };

  dismissWaiterCall = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const { OrderRepository } = await import('../../infrastructure/repositories/OrderRepository');
      OrderRepository.clearWaiterCall(orderId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}
