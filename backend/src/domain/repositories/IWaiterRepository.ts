export interface WaiterData {
  id: string;
  restaurantId: string;
  name: string;
  phone: string;
  cardNumber: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  wallet?: { balance: number } | null;
}

export interface CreateWaiterData {
  restaurantId: string;
  name: string;
  phone: string;
  cardNumber: string;
}

export interface IWaiterRepository {
  create(data: CreateWaiterData): Promise<WaiterData>;
  findById(id: string): Promise<WaiterData | null>;
  findByRestaurant(restaurantId: string): Promise<WaiterData[]>;
  update(id: string, data: Partial<{ name: string; phone: string; cardNumber: string; isActive: boolean }>): Promise<WaiterData>;
  delete(id: string): Promise<void>;
}
