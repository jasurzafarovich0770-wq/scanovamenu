import { Order, OrderStatus, PaginatedResponse } from '@restaurant-saas/shared';

export interface CreateOrderData {
  restaurantId: string;
  tableNumber: string;
  userId?: string;
  guestSessionId?: string;
  waiterId?: string;
  items: any[];
  subtotal: number;
  serviceFee?: number;
  tax: number;
  total: number;
  paymentMethod: string;
  orderType?: string;
  specialInstructions?: string;
}

export interface IOrderRepository {
  create(data: CreateOrderData): Promise<Order>;
  
  findById(id: string): Promise<Order | null>;
  
  findByRestaurant(
    restaurantId: string,
    page: number,
    pageSize: number,
    filters?: { status?: OrderStatus; tableNumber?: string }
  ): Promise<PaginatedResponse<Order>>;
  
  updateStatus(orderId: string, status: OrderStatus): Promise<Order>;
  
  countBySessionInLastHour(sessionId: string): Promise<number>;
  
  findAll(): Promise<Order[]>;

  findBySession(guestSessionId: string): Promise<Order[]>;

  setWaiterCalled(orderId: string, called: boolean): Promise<void>;
}
