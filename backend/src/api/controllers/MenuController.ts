import { Request, Response } from 'express';
import { MenuService } from '../../domain/services/MenuService';

export class MenuController {
  constructor(private menuService: MenuService) {}

  // Menu Items
  createMenuItem = async (req: Request, res: Response) => {
    try {
      const { restaurantId, categoryId, name, description, price, image, isAvailable, preparationTime, allergens, tags } = req.body;

      if (!restaurantId || !categoryId || !name || !price) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: restaurantId, categoryId, name, price',
        });
      }

      const menuItem = await this.menuService.createMenuItem({
        restaurantId,
        categoryId,
        name,
        description,
        price: parseFloat(price),
        image,
        isAvailable,
        preparationTime,
        allergens,
        tags,
      });

      res.status(201).json({
        success: true,
        data: menuItem,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create menu item',
      });
    }
  };

  getMenuItemById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const menuItem = await this.menuService.getMenuItemById(id);

      res.json({
        success: true,
        data: menuItem,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'Menu item not found',
      });
    }
  };

  getMenuItemsByRestaurant = async (req: Request, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const menuItems = await this.menuService.getMenuItemsByRestaurant(restaurantId);

      res.json({
        success: true,
        data: menuItems,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch menu items',
      });
    }
  };

  updateMenuItem = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (updateData.price) {
        updateData.price = parseFloat(updateData.price);
      }

      const menuItem = await this.menuService.updateMenuItem(id, updateData);

      res.json({
        success: true,
        data: menuItem,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update menu item',
      });
    }
  };

  deleteMenuItem = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.menuService.deleteMenuItem(id);

      res.json({
        success: true,
        message: 'Menu item deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete menu item',
      });
    }
  };

  // Categories
  createCategory = async (req: Request, res: Response) => {
    try {
      const { restaurantId, name, description, displayOrder } = req.body;

      if (!restaurantId || !name) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: restaurantId, name',
        });
      }

      const category = await this.menuService.createCategory({
        restaurantId,
        name,
        description,
        displayOrder,
      });

      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create category',
      });
    }
  };

  getCategoriesByRestaurant = async (req: Request, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const categories = await this.menuService.getCategoriesByRestaurant(restaurantId);

      res.json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch categories',
      });
    }
  };

  updateCategory = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const category = await this.menuService.updateCategory(id, updateData);

      res.json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update category',
      });
    }
  };

  deleteCategory = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.menuService.deleteCategory(id);

      res.json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete category',
      });
    }
  };
}
