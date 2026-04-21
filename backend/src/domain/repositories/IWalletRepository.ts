export type TransactionType = 'ORDER_PAYMENT' | 'SERVICE_FEE_DEDUCT' | 'SERVICE_FEE_CREDIT' | 'TRANSFER_OUT' | 'TRANSFER_IN';

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  orderId?: string | null;
  restaurantId?: string | null;
  waiterId?: string | null;
  description?: string | null;
  createdAt: Date;
}

export interface TransferResult {
  fromBalance: number;
  toBalance: number;
  amount: number;
  fromType: 'restaurant' | 'waiter';
  toType: 'restaurant' | 'waiter';
  fromId: string;
  toId: string;
  description: string;
}

export interface IWalletRepository {
  // Restoran hamyoni
  getRestaurantBalance(restaurantId: string): Promise<number>;
  creditRestaurant(restaurantId: string, amount: number, orderId?: string, description?: string): Promise<void>;
  debitRestaurant(restaurantId: string, amount: number, orderId?: string, description?: string): Promise<void>;
  upsertRestaurantWallet(restaurantId: string, cardNumber?: string): Promise<void>;

  // Ofitsiant hamyoni
  getWaiterBalance(waiterId: string): Promise<number>;
  creditWaiter(waiterId: string, amount: number, orderId?: string, description?: string): Promise<void>;
  upsertWaiterWallet(waiterId: string): Promise<void>;

  // Tranzaksiyalar
  getRestaurantTransactions(restaurantId: string, limit?: number): Promise<WalletTransaction[]>;
  getWaiterTransactions(waiterId: string, limit?: number): Promise<WalletTransaction[]>;

  // To'lov qayta ishlash (atomic)
  processOrderPayment(params: {
    restaurantId: string;
    orderId: string;
    subtotal: number;
    serviceFee: number;
    waiterId?: string;
    paymentMethod: 'CASH' | 'CARD';
  }): Promise<void>;

  // Pul o'tkazma
  transfer(params: {
    fromType: 'restaurant' | 'waiter';
    fromId: string;
    toType: 'restaurant' | 'waiter';
    toId: string;
    amount: number;
    description?: string;
  }): Promise<TransferResult>;
}
