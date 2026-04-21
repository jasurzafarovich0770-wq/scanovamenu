import { IWaiterRepository, CreateWaiterData } from '../repositories/IWaiterRepository';

export class WaiterService {
  constructor(private waiterRepo: IWaiterRepository) {}

  async createWaiter(data: CreateWaiterData) {
    if (!data.name?.trim()) throw new Error('Ofitsiant ismi kiritilishi shart');
    if (!data.phone?.trim()) throw new Error('Telefon raqami kiritilishi shart');
    if (!data.cardNumber?.trim()) throw new Error('Karta raqami kiritilishi shart');
    return this.waiterRepo.create(data);
  }

  async getWaitersByRestaurant(restaurantId: string) {
    return this.waiterRepo.findByRestaurant(restaurantId);
  }

  async getWaiterById(id: string) {
    const waiter = await this.waiterRepo.findById(id);
    if (!waiter) throw new Error('Ofitsiant topilmadi');
    return waiter;
  }

  async updateWaiter(id: string, data: Partial<{ name: string; phone: string; cardNumber: string; isActive: boolean }>) {
    return this.waiterRepo.update(id, data);
  }

  async deleteWaiter(id: string) {
    await this.waiterRepo.delete(id);
  }
}
