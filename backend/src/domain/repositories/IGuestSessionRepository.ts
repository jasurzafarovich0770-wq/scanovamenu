import { GuestSession } from '@restaurant-saas/shared';

export interface IGuestSessionRepository {
  create(data: {
    restaurantId: string;
    tableNumber: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<GuestSession>;
  
  findByToken(token: string): Promise<GuestSession | null>;
  
  findActiveByRestaurantAndTable(
    restaurantId: string,
    tableNumber: string
  ): Promise<GuestSession | null>;
  
  invalidate(sessionId: string): Promise<void>;
  
  cleanupExpired(): Promise<number>;
}
