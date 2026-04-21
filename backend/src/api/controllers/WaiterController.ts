import { Request, Response, NextFunction } from 'express';
import { WaiterService } from '../../domain/services/WaiterService';
import { WalletService } from '../../domain/services/WalletService';
import { AppError } from '../middleware/errorHandler';

export class WaiterController {
  constructor(
    private waiterService: WaiterService,
    private walletService: WalletService,
  ) {}

  // GET /waiters/restaurant/:restaurantId
  getByRestaurant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.params;
      const waiters = await this.waiterService.getWaitersByRestaurant(restaurantId);
      res.json({ success: true, data: waiters });
    } catch (error) { next(error); }
  };

  // POST /waiters
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId, name, phone, cardNumber } = req.body;
      if (!restaurantId) throw new AppError(400, 'restaurantId majburiy');
      const waiter = await this.waiterService.createWaiter({ restaurantId, name, phone, cardNumber });
      res.status(201).json({ success: true, data: waiter });
    } catch (error) { next(error); }
  };

  // PATCH /waiters/:id
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, phone, cardNumber, isActive } = req.body;
      const waiter = await this.waiterService.updateWaiter(id, { name, phone, cardNumber, isActive });
      res.json({ success: true, data: waiter });
    } catch (error) { next(error); }
  };

  // DELETE /waiters/:id
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.waiterService.deleteWaiter(id);
      res.json({ success: true, message: 'Ofitsiant o\'chirildi' });
    } catch (error) { next(error); }
  };

  // GET /waiters/:id/balance
  getBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const balance = await this.walletService.getWaiterBalance(id);
      const transactions = await this.walletService.getWaiterTransactions(id, 20);
      res.json({ success: true, data: { balance, transactions } });
    } catch (error) { next(error); }
  };
}
