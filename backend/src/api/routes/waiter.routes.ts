import { Router } from 'express';
import { WaiterController } from '../controllers/WaiterController';
import { WalletController } from '../controllers/WalletController';
import { WaiterService } from '../../domain/services/WaiterService';
import { WalletService } from '../../domain/services/WalletService';
import { WaiterRepository } from '../../infrastructure/repositories/WaiterRepository';
import { WalletRepository } from '../../infrastructure/repositories/WalletRepository';

const router = Router();

const waiterRepo = new WaiterRepository();
const walletRepo = new WalletRepository();
const waiterService = new WaiterService(waiterRepo);
const walletService = new WalletService(walletRepo);
const waiterController = new WaiterController(waiterService, walletService);
const walletController = new WalletController(walletService, waiterService);

// Ofitsiantlar
router.get('/restaurant/:restaurantId', waiterController.getByRestaurant);
router.post('/', waiterController.create);
router.patch('/:id', waiterController.update);
router.delete('/:id', waiterController.delete);
router.get('/:id/balance', waiterController.getBalance);

// Restoran hamyoni
router.get('/wallet/restaurant/:restaurantId', walletController.getRestaurantWallet);
router.post('/wallet/restaurant/:restaurantId/setup', walletController.setupRestaurantWallet);

// Ofitsiant hamyoni
router.get('/wallet/waiter/:waiterId', walletController.getWaiterWallet);

// Pul o'tkazma
router.post('/wallet/transfer', walletController.transfer);

export { router as waiterRoutes };
