import { prisma } from '../../infrastructure/database';

const PRICE_KEY = 'monthly_price';
const DEFAULT_PRICE = 99000;

export class PricingService {
  async getPrice(): Promise<number> {
    const config = await prisma.platformConfig.findUnique({ where: { key: PRICE_KEY } });
    if (!config) return DEFAULT_PRICE;
    const parsed = parseInt(config.value, 10);
    return isNaN(parsed) ? DEFAULT_PRICE : parsed;
  }

  async updatePrice(amount: number): Promise<void> {
    await prisma.platformConfig.upsert({
      where: { key: PRICE_KEY },
      update: { value: String(amount) },
      create: { key: PRICE_KEY, value: String(amount) },
    });
  }
}
