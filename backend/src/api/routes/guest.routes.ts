import { Router } from 'express';
import { GuestController } from '../controllers/GuestController';
import { GuestSessionService } from '../../domain/services/GuestSessionService';
import { GuestSessionRepository } from '../../infrastructure/repositories/GuestSessionRepository';
import { MenuController } from '../controllers/MenuController';
import { MenuService } from '../../domain/services/MenuService';
import { MenuRepository } from '../../infrastructure/repositories/MenuRepository';
import { prisma } from '../../infrastructure/database';

const router = Router();

const sessionRepo = new GuestSessionRepository();
const sessionService = new GuestSessionService(sessionRepo);
const guestController = new GuestController(sessionService);

// Menu dependencies for public access
const menuRepository = new MenuRepository(prisma);
const menuService = new MenuService(menuRepository);
const menuController = new MenuController(menuService);

router.post('/session', guestController.createSession);
router.get('/session/:token/validate', guestController.validateSession);

// Public menu endpoints for guests
router.get('/menu/restaurants/:restaurantId/categories', menuController.getCategoriesByRestaurant);
router.get('/menu/restaurants/:restaurantId/items', menuController.getMenuItemsByRestaurant);

export { router as guestRoutes };
