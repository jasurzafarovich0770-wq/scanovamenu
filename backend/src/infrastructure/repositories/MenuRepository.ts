import { PrismaClient } from '@prisma/client';
import { IMenuRepository } from '../../domain/repositories/IMenuRepository';

export class MenuRepository implements IMenuRepository {
  constructor(private prisma: PrismaClient) {}

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
    return await this.prisma.menuItem.create({
      data: {
        restaurantId: data.restaurantId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        price: data.price,
        image: data.image,
        isAvailable: data.isAvailable ?? true,
        preparationTime: data.preparationTime ?? 15,
        allergens: data.allergens ?? [],
        tags: data.tags ?? [],
      },
      include: {
        category: true,
      },
    });
  }

  async getMenuItemById(id: string) {
    return await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
  }

  async getMenuItemsByRestaurant(restaurantId: string) {
    return await this.prisma.menuItem.findMany({
      where: { restaurantId },
      include: {
        category: true,
      },
      orderBy: [
        { category: { displayOrder: 'asc' } },
        { name: 'asc' },
      ],
    });
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
    return await this.prisma.menuItem.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  }

  async deleteMenuItem(id: string) {
    await this.prisma.menuItem.delete({
      where: { id },
    });
  }

  async createCategory(data: {
    restaurantId: string;
    name: string;
    description?: string;
    displayOrder?: number;
  }) {
    return await this.prisma.menuCategory.create({
      data: {
        restaurantId: data.restaurantId,
        name: data.name,
        description: data.description,
        displayOrder: data.displayOrder ?? 0,
      },
    });
  }

  async getCategoriesByRestaurant(restaurantId: string) {
    return await this.prisma.menuCategory.findMany({
      where: { restaurantId, isActive: true },
      include: {
        menuItems: {
          where: { isAvailable: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async updateCategory(id: string, data: {
    name?: string;
    description?: string;
    displayOrder?: number;
    isActive?: boolean;
  }) {
    return await this.prisma.menuCategory.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(id: string) {
    await this.prisma.menuCategory.delete({
      where: { id },
    });
  }
}
