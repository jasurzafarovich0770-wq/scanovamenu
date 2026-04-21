import { v4 as uuidv4 } from 'uuid';
import { GUEST_SESSION_DURATION } from '@restaurant-saas/shared';
import { IGuestSessionRepository } from '../repositories/IGuestSessionRepository';

export class GuestSessionService {
  constructor(private sessionRepo: IGuestSessionRepository) {}

  async createSession(data: {
    restaurantId: string;
    tableNumber: string;
    ipAddress: string;
    userAgent: string;
  }) {
    // Check for existing active session
    const existing = await this.sessionRepo.findActiveByRestaurantAndTable(
      data.restaurantId,
      data.tableNumber
    );

    if (existing && existing.expiresAt > new Date()) {
      return existing;
    }

    // Create new session
    return this.sessionRepo.create(data);
  }

  async validateSession(token: string) {
    const session = await this.sessionRepo.findByToken(token);
    
    if (!session) {
      throw new Error('Session not found');
    }

    // Session muddati o'tgan yoki nofaol bo'lsa — avtomatik yangilash
    if (!session.isActive || session.expiresAt < new Date()) {
      // Eski sessionni nofaol qilish
      await this.sessionRepo.invalidate(session.id);
      
      // Xuddi shu restoran va stol uchun yangi session yaratish
      const newSession = await this.sessionRepo.create({
        restaurantId: session.restaurantId,
        tableNumber: session.tableNumber,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      });
      
      return { ...newSession, _renewed: true };
    }

    return session;
  }

  async closeTableSession(restaurantId: string, tableNumber: string) {
    const session = await this.sessionRepo.findActiveByRestaurantAndTable(
      restaurantId,
      tableNumber
    );

    if (session) {
      await this.sessionRepo.invalidate(session.id);
    }
  }
}
