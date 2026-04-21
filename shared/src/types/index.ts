// User & Authentication Types
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RESTAURANT_OWNER = 'RESTAURANT_OWNER',
  RESTAURANT_ADMIN = 'RESTAURANT_ADMIN',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER'
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  role: UserRole;
  restaurantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Guest Session Types
export interface GuestSession {
  id: string;
  sessionToken: string;
  restaurantId: string;
  tableNumber: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
}

// Restaurant Types
export enum SubscriptionPlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  ownerId: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt?: Date;
  maxTables: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Menu Types
export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  preparationTime: number; // minutes
  allergens?: string[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Order Types
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  ONLINE = 'ONLINE'
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  tableNumber: string;
  userId?: string | null;
  guestSessionId?: string | null;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderType: OrderType;
  estimatedTime?: number;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Table Types
export interface Table {
  id: string;
  restaurantId: string;
  tableNumber: string;
  qrCode: string;
  capacity: number;
  isActive: boolean;
  currentSessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
