import { IMenuRepository } from '../repositories/IMenuRepository';

export class MenuService {
  constructor(private menuRepository: IMenuRepository) {}

  async createMenuItem(data: {
    restaurantId: string;
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
    isAvailable?: boolean;
    preparationTime?: number;
    allergens?: string[];
    tags?: string[];
  }) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Menu item name is required');
    }

    if (data.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    return await this.menuRepository.createMenuItem(data);
  }

  async getMenuItemById(id: string) {
    const item = await this.menuRepository.getMenuItemById(id);
    if (!item) {
      throw new Error('Menu item not found');
    }
    return item;
  }

  async getMenuItemsByRestaurant(restaurantId: string) {
    return await this.menuRepository.getMenuItemsByRestaurant(restaurantId);
  }

  async updateMenuItem(id: string, data: {
    name?: string;
    description?: string;
    price?: number;
    image?: string;
    isAvailable?: boolean;
    categoryId?: string;
    preparationTime?: number;
    allergens?: string[];
    tags?: string[];
  }) {
    if (data.price !== undefined && data.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    return await this.menuRepository.updateMenuItem(id, data);
  }

  async deleteMenuItem(id: string) {
    await this.menuRepository.deleteMenuItem(id);
  }

  async createCategory(data: {
    restaurantId: string;
    name: string;
    description?: string;
    displayOrder?: number;
  }) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Category name is required');
    }

    return await this.menuRepository.createCategory(data);
  }

  async getCategoriesByRestaurant(restaurantId: string) {
    return await this.menuRepository.getCategoriesByRestaurant(restaurantId);
  }

  async updateCategory(id: string, data: {
    name?: string;
    description?: string;
    displayOrder?: number;
    isActive?: boolean;
  }) {
    return await this.menuRepository.updateCategory(id, data);
  }

  async deleteCategory(id: string) {
    await this.menuRepository.deleteCategory(id);
  }
}
