import { Router } from 'express';
import { MenuController } from '../controllers/MenuController';
import { MenuService } from '../../domain/services/MenuService';
import { MenuRepository } from '../../infrastructure/repositories/MenuRepository';
import { prisma } from '../../infrastructure/database';

const router = Router();

// Initialize dependencies
const menuRepository = new MenuRepository(prisma);
const menuService = new MenuService(menuRepository);
const menuController = new MenuController(menuService);

// Menu Item Routes
router.post('/items', menuController.createMenuItem);
router.get('/items/:id', menuController.getMenuItemById);
router.get('/restaurants/:restaurantId/items', menuController.getMenuItemsByRestaurant);
router.put('/items/:id', menuController.updateMenuItem);
router.delete('/items/:id', menuController.deleteMenuItem);

// Category Routes
router.post('/categories', menuController.createCategory);
router.get('/restaurants/:restaurantId/categories', menuController.getCategoriesByRestaurant);
router.put('/categories/:id', menuController.updateCategory);
router.delete('/categories/:id', menuController.deleteCategory);

export { router as menuRoutes };
