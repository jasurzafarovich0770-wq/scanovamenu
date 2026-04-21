import { v4 as uuidv4 } from 'uuid';
import { OrderStatus } from '@restaurant-saas/shared';
import { IOrderRepository, CreateOrderData } from '../../domain/repositories/IOrderRepository';
import { prisma } from '../database';

export class OrderRepository implements IOrderRepository {
  async create(data: CreateOrderData) {
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // waiterId mavjudligini tekshirish — yo'q bo'lsa null qilamiz
    let validWaiterId: string | null = null;
    if (data.waiterId) {
      const waiter = await prisma.waiter.findUnique({ where: { id: data.waiterId } });
      validWaiterId = waiter ? data.waiterId : null;
    }

    const order = await (prisma.order.create as any)({
      data: {
        orderNumber,
        restaurantId: data.restaurantId,
        tableNumber: data.tableNumber,
        userId: data.userId,
        guestSessionId: data.guestSessionId,
        waiterId: validWaiterId,
        items: data.items,
        subtotal: data.subtotal,
        serviceFee: data.serviceFee ?? 0,
        tax: data.tax,
        total: data.total,
        paymentMethod: data.paymentMethod as any,
        orderType: data.orderType as any,
        specialInstructions: data.specialInstructions,
      },
    });

    return order as any;
  }

  async findById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        guestSession: { select: { id: true, tableNumber: true } },
      },
    });

    return order as any;
  }

  async findByRestaurant(
    restaurantId: string,
    page: number,
    pageSize: number,
    filters?: { status?: OrderStatus; tableNumber?: string }
  ) {
    const where: any = { restaurantId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.tableNumber) {
      where.tableNumber = filters.tableNumber;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          guestSession: { select: { id: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders as any,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return order as any;
  }

  async countBySessionInLastHour(sessionId: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    return prisma.order.count({
      where: {
        guestSessionId: sessionId,
        createdAt: { gte: oneHourAgo },
      },
    });
  }

  async findAll() {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, name: true } },
        guestSession: { select: { id: true } },
      },
    });
    return orders as any;
  }

  async findBySession(guestSessionId: string) {
    const orders = await prisma.order.findMany({
      where: { guestSessionId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
    return orders as any;
  }

  // In-memory waiter call tracking (session-level, no DB migration needed)
  private static waiterCalls = new Map<string, boolean>();

  async setWaiterCalled(orderId: string, called: boolean): Promise<void> {
    OrderRepository.waiterCalls.set(orderId, called);
  }

  static isWaiterCalled(orderId: string): boolean {
    return OrderRepository.waiterCalls.get(orderId) ?? false;
  }

  static clearWaiterCall(orderId: string): void {
    OrderRepository.waiterCalls.delete(orderId);
  }
}
