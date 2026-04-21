import { prisma } from '../database';
import { IWalletRepository, TransferResult, WalletTransaction } from '../../domain/repositories/IWalletRepository';

export class WalletRepository implements IWalletRepository {
  async upsertRestaurantWallet(restaurantId: string, cardNumber?: string): Promise<void> {
    await prisma.restaurantWallet.upsert({
      where: { restaurantId },
      create: { restaurantId, balance: 0, cardNumber: cardNumber ?? null, updatedAt: new Date() },
      update: cardNumber ? { cardNumber } : {},
    });
  }

  async upsertWaiterWallet(waiterId: string): Promise<void> {
    await prisma.waiterWallet.upsert({
      where: { waiterId },
      create: { waiterId, balance: 0, updatedAt: new Date() },
      update: {},
    });
  }

  async getRestaurantBalance(restaurantId: string): Promise<number> {
    const wallet = await prisma.restaurantWallet.findUnique({ where: { restaurantId } });
    return wallet?.balance ?? 0;
  }

  async creditRestaurant(restaurantId: string, amount: number, orderId?: string, description?: string): Promise<void> {
    await prisma.$transaction([
      prisma.restaurantWallet.upsert({
        where: { restaurantId },
        create: { restaurantId, balance: amount, updatedAt: new Date() },
        update: { balance: { increment: amount }, updatedAt: new Date() },
      }),
      prisma.walletTransaction.create({
        data: { type: 'ORDER_PAYMENT', amount, orderId, restaurantId, description },
      }),
    ]);
  }

  async debitRestaurant(restaurantId: string, amount: number, orderId?: string, description?: string): Promise<void> {
    await prisma.$transaction([
      prisma.restaurantWallet.update({
        where: { restaurantId },
        data: { balance: { decrement: amount }, updatedAt: new Date() },
      }),
      prisma.walletTransaction.create({
        data: { type: 'SERVICE_FEE_DEDUCT', amount, orderId, restaurantId, description },
      }),
    ]);
  }

  async getWaiterBalance(waiterId: string): Promise<number> {
    const wallet = await prisma.waiterWallet.findUnique({ where: { waiterId } });
    return wallet?.balance ?? 0;
  }

  async creditWaiter(waiterId: string, amount: number, orderId?: string, description?: string): Promise<void> {
    await prisma.$transaction([
      prisma.waiterWallet.upsert({
        where: { waiterId },
        create: { waiterId, balance: amount, updatedAt: new Date() },
        update: { balance: { increment: amount }, updatedAt: new Date() },
      }),
      prisma.walletTransaction.create({
        data: { type: 'SERVICE_FEE_CREDIT', amount, orderId, waiterId, description },
      }),
    ]);
  }

  async getRestaurantTransactions(restaurantId: string, limit = 50): Promise<WalletTransaction[]> {
    return prisma.walletTransaction.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as any;
  }

  async getWaiterTransactions(waiterId: string, limit = 50): Promise<WalletTransaction[]> {
    return prisma.walletTransaction.findMany({
      where: { waiterId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as any;
  }

  async transfer(params: {
    fromType: 'restaurant' | 'waiter';
    fromId: string;
    toType: 'restaurant' | 'waiter';
    toId: string;
    amount: number;
    description?: string;
  }): Promise<TransferResult> {
    const { fromType, fromId, toType, toId, amount, description } = params;

    if (amount <= 0) throw new Error('Miqdor 0 dan katta bo\'lishi kerak');

    // Balansni tekshirish
    const fromBalance = fromType === 'restaurant'
      ? await this.getRestaurantBalance(fromId)
      : await this.getWaiterBalance(fromId);

    if (fromBalance < amount) throw new Error('Balans yetarli emas');

    const desc = description || `O'tkazma ${amount.toLocaleString()} so'm`;

    // Atomic transaction
    await prisma.$transaction(async (tx) => {
      // FROM: chiqim
      if (fromType === 'restaurant') {
        await tx.restaurantWallet.update({
          where: { restaurantId: fromId },
          data: { balance: { decrement: amount }, updatedAt: new Date() },
        });
        await tx.walletTransaction.create({
          data: { type: 'TRANSFER_OUT', amount, restaurantId: fromId, description: `${desc} (chiqim)` },
        });
      } else {
        await tx.waiterWallet.update({
          where: { waiterId: fromId },
          data: { balance: { decrement: amount }, updatedAt: new Date() },
        });
        await tx.walletTransaction.create({
          data: { type: 'TRANSFER_OUT', amount, waiterId: fromId, description: `${desc} (chiqim)` },
        });
      }

      // TO: kirim
      if (toType === 'restaurant') {
        await tx.restaurantWallet.upsert({
          where: { restaurantId: toId },
          create: { restaurantId: toId, balance: amount, updatedAt: new Date() },
          update: { balance: { increment: amount }, updatedAt: new Date() },
        });
        await tx.walletTransaction.create({
          data: { type: 'TRANSFER_IN', amount, restaurantId: toId, description: `${desc} (kirim)` },
        });
      } else {
        await tx.waiterWallet.upsert({
          where: { waiterId: toId },
          create: { waiterId: toId, balance: amount, updatedAt: new Date() },
          update: { balance: { increment: amount }, updatedAt: new Date() },
        });
        await tx.walletTransaction.create({
          data: { type: 'TRANSFER_IN', amount, waiterId: toId, description: `${desc} (kirim)` },
        });
      }
    });

    const toBalance = toType === 'restaurant'
      ? await this.getRestaurantBalance(toId)
      : await this.getWaiterBalance(toId);
    const newFromBalance = fromType === 'restaurant'
      ? await this.getRestaurantBalance(fromId)
      : await this.getWaiterBalance(fromId);

    return { fromBalance: newFromBalance, toBalance, amount, fromType, toType, fromId, toId, description: desc };
  }

  /**
   * Atomic to'lov qayta ishlash:
   * NAQD: jami (subtotal+serviceFee) → restoran, keyin serviceFee → restorandan yechib ofitsiantga
   * KARTA: subtotal → restoran, serviceFee → to'g'ridan ofitsiantga
   */
  async processOrderPayment(params: {
    restaurantId: string;
    orderId: string;
    subtotal: number;
    serviceFee: number;
    waiterId?: string;
    paymentMethod: 'CASH' | 'CARD';
  }): Promise<void> {
    const { restaurantId, orderId, subtotal, serviceFee, waiterId, paymentMethod } = params;

    if (paymentMethod === 'CASH') {
      const total = subtotal + serviceFee;
      // 1. Jami summa restoran hamyoniga
      await this.creditRestaurant(restaurantId, total, orderId, `Naqd to'lov #${orderId.slice(-6)}`);

      // 2. Xizmat haqi restorandan yechib ofitsiantga
      if (waiterId && serviceFee > 0) {
        await this.debitRestaurant(restaurantId, serviceFee, orderId, `Xizmat haqi ofitsiantga #${orderId.slice(-6)}`);
        await this.upsertWaiterWallet(waiterId);
        await this.creditWaiter(waiterId, serviceFee, orderId, `Xizmat haqi (naqd) #${orderId.slice(-6)}`);
      }
    } else {
      // CARD: subtotal → restoran, serviceFee → ofitsiant
      await this.creditRestaurant(restaurantId, subtotal, orderId, `Karta to'lov #${orderId.slice(-6)}`);

      if (waiterId && serviceFee > 0) {
        await this.upsertWaiterWallet(waiterId);
        await this.creditWaiter(waiterId, serviceFee, orderId, `Xizmat haqi (karta) #${orderId.slice(-6)}`);
      }
    }
  }
}
