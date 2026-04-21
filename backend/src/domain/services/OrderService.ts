import { ORDER_RATE_LIMIT, OrderStatus } from '@restaurant-saas/shared';
import { IOrderRepository, CreateOrderData } from '../repositories/IOrderRepository';
import { IWalletRepository } from '../repositories/IWalletRepository';

export class OrderService {
  constructor(
    private orderRepo: IOrderRepository,
    private walletRepo?: IWalletRepository,
  ) {}

  async createOrder(data: CreateOrderData) {
    if (data.guestSessionId) {
      const recentOrders = await this.orderRepo.countBySessionInLastHour(data.guestSessionId);
      if (recentOrders >= ORDER_RATE_LIMIT) {
        throw new Error('Order rate limit exceeded. Please try again later.');
      }
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    const order = await this.orderRepo.create({
      ...data,
      orderType: data.orderType || 'DINE_IN'
    });

    // To'lovni qayta ishlash — xato bo'lsa order bekor qilinmaydi
    if (this.walletRepo) {
      try {
        await this.walletRepo.processOrderPayment({
          restaurantId: order.restaurantId,
          orderId: order.id,
          subtotal: data.subtotal,
          serviceFee: data.serviceFee ?? 0,
          waiterId: data.waiterId,
          paymentMethod: (data.paymentMethod as 'CASH' | 'CARD') ?? 'CASH',
        });
      } catch (walletErr) {
        // Wallet xatosi order ni bekor qilmaydi — faqat log qilinadi
        console.error('Wallet processing error (non-fatal):', walletErr);
      }
    }

    return order;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    return this.orderRepo.updateStatus(orderId, status);
  }

  async getOrderById(orderId: string) {
    const order = await this.orderRepo.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    return order;
  }

  async getRestaurantOrders(
    restaurantId: string,
    page: number = 1,
    pageSize: number = 20,
    filters?: { status?: OrderStatus; tableNumber?: string }
  ) {
    return this.orderRepo.findByRestaurant(restaurantId, page, pageSize, filters);
  }

  async getOrdersByRestaurant(restaurantId: string) {
    return this.orderRepo.findByRestaurant(restaurantId, 1, 100);
  }

  async getAllOrders() {
    return this.orderRepo.findAll();
  }

  async getOrdersBySession(guestSessionId: string) {
    return this.orderRepo.findBySession(guestSessionId);
  }

  async setWaiterCalled(orderId: string, called: boolean) {
    return this.orderRepo.setWaiterCalled(orderId, called);
  }
}
