import { v4 as uuidv4 } from 'uuid';
import { GUEST_SESSION_DURATION } from '@restaurant-saas/shared';
import { IGuestSessionRepository } from '../../domain/repositories/IGuestSessionRepository';
import { prisma } from '../database';

export class GuestSessionRepository implements IGuestSessionRepository {
  async create(data: {
    restaurantId: string;
    tableNumber: string;
    ipAddress: string;
    userAgent: string;
  }) {
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + GUEST_SESSION_DURATION);

    // Restaurant mavjud bo'lmasa avtomatik yaratish
    const existingRestaurant = await prisma.restaurant.findUnique({ where: { id: data.restaurantId } });
    if (!existingRestaurant) {
      const slug = data.restaurantId.toLowerCase().replace(/[^a-z0-9]/g, '-');
      // Slug band bo'lsa id ni qo'shamiz
      const slugExists = await prisma.restaurant.findUnique({ where: { slug } });
      await prisma.restaurant.create({
        data: {
          id: data.restaurantId,
          name: data.restaurantId,
          slug: slugExists ? `${slug}-${data.restaurantId.slice(-6)}` : slug,
          address: 'N/A',
          phone: 'N/A',
          email: 'N/A',
          ownerId: 'system',
        },
      });
    }

    const session = await prisma.guestSession.create({
      data: {
        sessionToken,
        restaurantId: data.restaurantId,
        tableNumber: data.tableNumber,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt,
      },
    });

    return session as any;
  }

  async findByToken(token: string) {
    const session = await prisma.guestSession.findUnique({
      where: { sessionToken: token },
    });

    return session as any;
  }

  async findActiveByRestaurantAndTable(restaurantId: string, tableNumber: string) {
    const session = await prisma.guestSession.findFirst({
      where: {
        restaurantId,
        tableNumber,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return session as any;
  }

  async invalidate(sessionId: string) {
    await prisma.guestSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  async cleanupExpired() {
    const result = await prisma.guestSession.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        isActive: true,
      },
      data: { isActive: false },
    });

    return result.count;
  }
}
