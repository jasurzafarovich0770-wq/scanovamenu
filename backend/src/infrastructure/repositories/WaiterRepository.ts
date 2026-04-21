import { prisma } from '../database';
import { IWaiterRepository, CreateWaiterData, WaiterData } from '../../domain/repositories/IWaiterRepository';

export class WaiterRepository implements IWaiterRepository {
  async create(data: CreateWaiterData): Promise<WaiterData> {
    const waiter = await prisma.waiter.create({
      data,
      include: { wallet: true },
    });
    // Hamyon avtomatik yaratish
    await prisma.waiterWallet.upsert({
      where: { waiterId: waiter.id },
      create: { waiterId: waiter.id, balance: 0, updatedAt: new Date() },
      update: {},
    });
    return waiter as any;
  }

  async findById(id: string): Promise<WaiterData | null> {
    return prisma.waiter.findUnique({
      where: { id },
      include: { wallet: true },
    }) as any;
  }

  async findByRestaurant(restaurantId: string): Promise<WaiterData[]> {
    return prisma.waiter.findMany({
      where: { restaurantId },
      include: { wallet: true },
      orderBy: { createdAt: 'asc' },
    }) as any;
  }

  async update(id: string, data: Partial<{ name: string; phone: string; cardNumber: string; isActive: boolean }>): Promise<WaiterData> {
    return prisma.waiter.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
      include: { wallet: true },
    }) as any;
  }

  async delete(id: string): Promise<void> {
    await prisma.waiter.delete({ where: { id } });
  }
}
