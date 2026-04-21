export interface AuthUser {
  id: string;
  username: string;
  passwordHash: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';
  restaurantId?: string | null;
  restaurantName?: string | null;
  ownerName?: string | null;
  email?: string | null;
  phone?: string | null;
  tables?: number;
  cardNumber?: string | null;
  serviceFeePercent?: number;
  permissions?: Record<string, boolean> | null;
  isActive?: boolean;
  blocked?: boolean;
}

export interface IAuthRepository {
  findByUsername(username: string): Promise<AuthUser | null>;
  findByEmailOrPhone(identifier: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
  create(data: Omit<AuthUser, 'id'>): Promise<AuthUser>;
  update(id: string, data: Partial<Omit<AuthUser, 'id' | 'username'>>): Promise<AuthUser>;
  delete(id: string): Promise<void>;
  findAll(): Promise<AuthUser[]>;
  findByRestaurantId(restaurantId: string): Promise<AuthUser | null>;
  changePassword(id: string, newHash: string): Promise<void>;
  upsertRestaurant(restaurantId: string, name: string, email: string, phone: string): Promise<void>;
}
