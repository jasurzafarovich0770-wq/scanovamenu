import { prisma } from '../database';
import { Prisma } from '@prisma/client';
import { IAuthRepository, AuthUser } from '../../domain/repositories/IAuthRepository';

function mapUser(u: any): AuthUser {
  return {
    id: u.id,
    username: u.username,
    passwordHash: u.passwordHash,
    role: u.role as AuthUser['role'],
    restaurantId: u.restaurantId,
    restaurantName: u.restaurantName,
    ownerName: u.ownerName,
    email: u.email,
    phone: u.phone,
    tables: u.tables ?? 0,
    cardNumber: u.cardNumber,
    serviceFeePercent: u.serviceFeePercent ?? 10,
    permissions: u.permissions as Record<string, boolean> | null,
    isActive: u.isActive ?? false,
    blocked: u.blocked ?? false,
  };
}

export class AuthRepository implements IAuthRepository {
  async findByUsername(username: string): Promise<AuthUser | null> {
    const u = await prisma.appUser.findUnique({ where: { username: username.toLowerCase() } });
    return u ? mapUser(u) : null;
  }

  async findByEmailOrPhone(identifier: string): Promise<AuthUser | null> {
    const clean = identifier.toLowerCase().trim();
    const u = await prisma.appUser.findFirst({
      where: {
        OR: [
          { email: clean },
          { phone: clean },
          { phone: clean.replace(/\D/g, '') },
          { phone: '+' + clean.replace(/\D/g, '') },
        ],
      },
    });
    return u ? mapUser(u) : null;
  }

  async findById(id: string): Promise<AuthUser | null> {
    const u = await prisma.appUser.findUnique({ where: { id } });
    return u ? mapUser(u) : null;
  }

  async create(data: Omit<AuthUser, 'id'>): Promise<AuthUser> {
    const u = await prisma.appUser.create({
      data: {
        username: data.username.toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role,
        restaurantId: data.restaurantId,
        restaurantName: data.restaurantName,
        ownerName: data.ownerName,
        email: data.email,
        phone: data.phone,
        tables: data.tables ?? 0,
        cardNumber: data.cardNumber,
        serviceFeePercent: data.serviceFeePercent ?? 10,
        permissions: data.permissions === null ? Prisma.JsonNull : (data.permissions ?? Prisma.JsonNull),
        updatedAt: new Date(),
      },
    });
    return mapUser(u);
  }

  async update(id: string, data: Partial<Omit<AuthUser, 'id' | 'username'>>): Promise<AuthUser> {
    const { permissions, ...rest } = data;
    const u = await prisma.appUser.update({
      where: { id },
      data: {
        ...rest,
        ...(permissions !== undefined ? { permissions: permissions === null ? Prisma.JsonNull : permissions } : {}),
        updatedAt: new Date(),
      },
    });
    return mapUser(u);
  }

  async delete(id: string): Promise<void> {
    await prisma.appUser.delete({ where: { id } });
  }

  async findAll(): Promise<AuthUser[]> {
    const users = await prisma.appUser.findMany({ orderBy: { createdAt: 'asc' } });
    return users.map(mapUser);
  }

  async findByRestaurantId(restaurantId: string): Promise<AuthUser | null> {
    const u = await prisma.appUser.findFirst({ where: { restaurantId } });
    return u ? mapUser(u) : null;
  }

  async changePassword(id: string, newHash: string): Promise<void> {
    await prisma.appUser.update({ where: { id }, data: { passwordHash: newHash, updatedAt: new Date() } });
  }

  async upsertRestaurant(restaurantId: string, name: string, email: string, phone: string): Promise<void> {
    const existing = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!existing) {
      const slug = restaurantId.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const slugExists = await prisma.restaurant.findUnique({ where: { slug } });
      await prisma.restaurant.create({
        data: {
          id: restaurantId,
          name,
          slug: slugExists ? `${slug}-${restaurantId.slice(-6)}` : slug,
          address: 'N/A',
          phone,
          email,
          ownerId: 'system',
        },
      });
    }
  }
}
