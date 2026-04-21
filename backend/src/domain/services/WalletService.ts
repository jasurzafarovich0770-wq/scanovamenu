import { IWalletRepository } from '../repositories/IWalletRepository';

export class WalletService {
  constructor(private walletRepo: IWalletRepository) {}

  async getRestaurantBalance(restaurantId: string) {
    return this.walletRepo.getRestaurantBalance(restaurantId);
  }

  async getWaiterBalance(waiterId: string) {
    return this.walletRepo.getWaiterBalance(waiterId);
  }

  async getRestaurantTransactions(restaurantId: string, limit?: number) {
    return this.walletRepo.getRestaurantTransactions(restaurantId, limit);
  }

  async getWaiterTransactions(waiterId: string, limit?: number) {
    return this.walletRepo.getWaiterTransactions(waiterId, limit);
  }

  async processOrderPayment(params: {
    restaurantId: string;
    orderId: string;
    subtotal: number;
    serviceFee: number;
    waiterId?: string;
    paymentMethod: 'CASH' | 'CARD';
  }) {
    await this.walletRepo.processOrderPayment(params);
  }

  async setupRestaurantWallet(restaurantId: string, cardNumber?: string) {
    await this.walletRepo.upsertRestaurantWallet(restaurantId, cardNumber);
  }

  async transfer(params: {
    fromType: 'restaurant' | 'waiter';
    fromId: string;
    toType: 'restaurant' | 'waiter';
    toId: string;
    amount: number;
    description?: string;
  }) {
    return this.walletRepo.transfer(params);
  }
}
