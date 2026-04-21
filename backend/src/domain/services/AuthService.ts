import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { IAuthRepository, AuthUser } from '../repositories/IAuthRepository';

const DEFAULT_PERMISSIONS = {
  manageMenu: true, manageOrders: true, viewReports: true,
  manageQR: true, manageSettings: true,
  manageUsers: false, promoteToSuperAdmin: false,
  manageRestaurants: false, viewActivityLogs: false, exportData: false,
};

export class AuthService {
  constructor(private authRepo: IAuthRepository) {}

  private sign(user: AuthUser) {
    return jwt.sign(
      { userId: user.id, username: user.username, role: user.role, restaurantId: user.restaurantId },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any },
    );
  }

  private safeUser(user: AuthUser) {
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async login(identifier: string, password: string) {
    // username, email yoki telefon orqali qidirish
    let user = await this.authRepo.findByUsername(identifier);
    if (!user) user = await this.authRepo.findByEmailOrPhone(identifier);
    if (!user) throw new Error('Login yoki parol noto\'g\'ri');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error('Login yoki parol noto\'g\'ri');
    if ((user as any).blocked) throw new Error('ACCOUNT_BLOCKED');
    return { token: this.sign(user), user: this.safeUser(user) };
  }

  async register(data: {
    username: string; password: string;
    role: 'ADMIN' | 'CUSTOMER';
    restaurantId?: string; restaurantName?: string;
    ownerName?: string; email?: string; phone?: string; tables?: number;
  }) {
    const existing = await this.authRepo.findByUsername(data.username);
    if (existing) throw new Error('Bu foydalanuvchi nomi band');
    const passwordHash = await bcrypt.hash(data.password, 10);

    // ADMIN bo'lsa restaurantId avtomatik yaratish
    let restaurantId = data.restaurantId;
    if (data.role === 'ADMIN' && !restaurantId) {
      restaurantId = data.username.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString(36);
    }

    const user = await this.authRepo.create({
      username: data.username,
      passwordHash,
      role: data.role,
      restaurantId,
      restaurantName: data.restaurantName || (data.role === 'ADMIN' ? data.username + ' Restoran' : undefined),
      ownerName: data.ownerName,
      email: data.email,
      phone: data.phone,
      tables: data.tables ?? 5,
      cardNumber: null,
      serviceFeePercent: 10,
      permissions: data.role === 'ADMIN' ? DEFAULT_PERMISSIONS : null,
    });
    // ADMIN bo'lsa Restaurant ham yaratish
    if (data.role === 'ADMIN' && restaurantId) {
      await this.authRepo.upsertRestaurant(
        restaurantId,
        data.restaurantName || data.username + ' Restoran',
        data.email || 'N/A',
        data.phone || 'N/A',
      );
    }
    return { token: this.sign(user), user: this.safeUser(user) };
  }

  async getMe(userId: string) {
    const user = await this.authRepo.findById(userId);
    if (!user) throw new Error('Foydalanuvchi topilmadi');
    return this.safeUser(user);
  }

  async updateProfile(userId: string, data: Partial<{
    restaurantName: string; ownerName: string; email: string;
    phone: string; tables: number; cardNumber: string; serviceFeePercent: number;
  }>) {
    const user = await this.authRepo.update(userId, data);
    return this.safeUser(user);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.authRepo.findById(userId);
    if (!user) throw new Error('Foydalanuvchi topilmadi');
    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) throw new Error('Eski parol noto\'g\'ri');
    const newHash = await bcrypt.hash(newPassword, 10);
    await this.authRepo.changePassword(userId, newHash);
  }

  async getRestaurantInfo(restaurantId: string) {
    const user = await this.authRepo.findByRestaurantId(restaurantId);
    if (!user) return { serviceFeePercent: 10, restaurantName: null };
    return {
      serviceFeePercent: user.serviceFeePercent ?? 10,
      restaurantName: user.restaurantName,
      ownerName: user.ownerName,
      tables: user.tables,
    };
  }

  async getAllUsers() {
    const users = await this.authRepo.findAll();
    return users.map(({ passwordHash, ...u }) => u);
  }

  async updateUserRole(userId: string, role: AuthUser['role']) {
    const user = await this.authRepo.update(userId, { role });
    return this.safeUser(user);
  }

  async updatePermissions(userId: string, permissions: Record<string, boolean>) {
    const user = await this.authRepo.update(userId, { permissions });
    return this.safeUser(user);
  }

  async deleteUser(userId: string) {
    await this.authRepo.delete(userId);
  }

  async assignRestaurant(userId: string, restaurantId: string, restaurantName?: string) {
    const user = await this.authRepo.findById(userId);
    if (!user) throw new Error('Foydalanuvchi topilmadi');
    
    const updated = await this.authRepo.update(userId, {
      restaurantId,
      restaurantName: restaurantName || user.restaurantName,
    });
    
    return this.safeUser(updated);
  }

  async seedDefaultUsers() {
    const defaults = [
      { username: 'superadmin', password: 'qwertyuiop', role: 'SUPER_ADMIN' as const, ownerName: 'Super Admin', email: 'super_admin@info.com', phone: '+998900000000' },
      { username: 'demoadmin', password: 'demo1234', role: 'ADMIN' as const, restaurantId: 'demo-restaurant', restaurantName: 'Demo Restoran', ownerName: 'Demo Admin', email: 'demo@restoran.uz', phone: '+998901234567', tables: 8 },
    ];
    for (const d of defaults) {
      const exists = await this.authRepo.findByUsername(d.username);
      if (!exists) {
        const hash = await bcrypt.hash(d.password, 10);
        await this.authRepo.create({ ...d, passwordHash: hash, permissions: d.role === 'ADMIN' ? DEFAULT_PERMISSIONS : null, serviceFeePercent: 10 });
      }
      if (d.role === 'ADMIN' && d.restaurantId) {
        await this.authRepo.upsertRestaurant(d.restaurantId, d.restaurantName || d.restaurantId, d.email || 'N/A', d.phone || 'N/A');
      }
    }
  }
}
