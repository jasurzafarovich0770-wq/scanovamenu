export interface IMenuRepository {
  // Menu Items
  createMenuItem(data: {
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
  }): Promise<any>;

  getMenuItemById(id: string): Promise<any>;
  
  getMenuItemsByRestaurant(restaurantId: string): Promise<any[]>;
  
  updateMenuItem(id: string, data: {
    name?: string;
    description?: string;
    price?: number;
    image?: string;
    isAvailable?: boolean;
    categoryId?: string;
    preparationTime?: number;
    allergens?: string[];
    tags?: string[];
  }): Promise<any>;
  
  deleteMenuItem(id: string): Promise<void>;

  // Menu Categories
  createCategory(data: {
    restaurantId: string;
    name: string;
    description?: string;
    displayOrder?: number;
  }): Promise<any>;

  getCategoriesByRestaurant(restaurantId: string): Promise<any[]>;
  
  updateCategory(id: string, data: {
    name?: string;
    description?: string;
    displayOrder?: number;
    isActive?: boolean;
  }): Promise<any>;
  
  deleteCategory(id: string): Promise<void>;
}
