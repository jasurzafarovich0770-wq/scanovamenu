import { Request, Response, NextFunction } from 'express';
import { WalletService } from '../../domain/services/WalletService';
import { WaiterService } from '../../domain/services/WaiterService';

export class WalletController {
  constructor(
    private walletService: WalletService,
    private waiterService?: WaiterService,
  ) {}

  // GET /wallet/restaurant/:restaurantId
  getRestaurantWallet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.params;
      const balance = await this.walletService.getRestaurantBalance(restaurantId);
      const transactions = await this.walletService.getRestaurantTransactions(restaurantId, 50);
      res.json({ success: true, data: { balance, transactions } });
    } catch (error) { next(error); }
  };

  // POST /wallet/restaurant/:restaurantId/setup
  setupRestaurantWallet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.params;
      const { cardNumber } = req.body;
      await this.walletService.setupRestaurantWallet(restaurantId, cardNumber);
      res.json({ success: true, message: 'Hamyon sozlandi' });
    } catch (error) { next(error); }
  };

  // POST /wallet/transfer
  transfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fromType, fromId, toType, toId, amount, description } = req.body;

      if (!fromType || !fromId || !toType || !toId || !amount) {
        return res.status(400).json({ success: false, message: 'Barcha maydonlar majburiy' });
      }
      if (!['restaurant', 'waiter'].includes(fromType) || !['restaurant', 'waiter'].includes(toType)) {
        return res.status(400).json({ success: false, message: 'fromType/toType noto\'g\'ri' });
      }
      if (fromType === toType && fromId === toId) {
        return res.status(400).json({ success: false, message: 'O\'ziga o\'tkazma mumkin emas' });
      }
      if (Number(amount) <= 0) {
        return res.status(400).json({ success: false, message: 'Miqdor 0 dan katta bo\'lishi kerak' });
      }

      const result = await this.walletService.transfer({
        fromType, fromId, toType, toId,
        amount: Number(amount),
        description,
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      if (error.message?.includes('Balans yetarli emas') || error.message?.includes('Miqdor')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  };

  // GET /wallet/waiter/:waiterId
  getWaiterWallet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { waiterId } = req.params;
      const balance = await this.walletService.getWaiterBalance(waiterId);
      const transactions = await this.walletService.getWaiterTransactions(waiterId, 50);
      res.json({ success: true, data: { balance, transactions } });
    } catch (error) { next(error); }
  };
}
