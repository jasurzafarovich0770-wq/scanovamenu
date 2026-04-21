import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../lib/api';

export interface LoginHistoryEntry {
  ip: string;
  country: string;
  city: string;
  time: string;
  userAgent: string;
}

export interface UserActivity {
  username: string;
  ip: string;
  country: string;
  city: string;
  lastSeen: string;
  loginCount: number;
  userAgent: string;
  loginHistory: LoginHistoryEntry[];
}

export interface AdminPermissions {
  // Restoran boshqaruvi
  manageMenu: boolean;           // Menyu va kategoriyalarni boshqarish
  manageOrders: boolean;         // Buyurtmalarni ko'rish va holat o'zgartirish
  viewReports: boolean;          // Dashboard va statistikani ko'rish
  manageQR: boolean;             // QR kodlarni ko'rish va yuklab olish
  manageSettings: boolean;       // Restoran sozlamalarini o'zgartirish
  // Tizim boshqaruvi (kengaytirilgan)
  manageUsers: boolean;          // Foydalanuvchilarni ko'rish va boshqarish
  promoteToSuperAdmin: boolean;  // Boshqa foydalanuvchini Super Admin qilish
  manageRestaurants: boolean;    // Yangi restoran qo'shish va tahrirlash
  viewActivityLogs: boolean;     // Foydalanuvchi faollik loglarini ko'rish
  exportData: boolean;           // Ma'lumotlarni CSV eksport qilish
}

export const DEFAULT_PERMISSIONS: AdminPermissions = {
  manageMenu: true,
  manageOrders: true,
  viewReports: true,
  manageQR: true,
  manageSettings: true,
  manageUsers: false,
  promoteToSuperAdmin: false,
  manageRestaurants: false,
  viewActivityLogs: false,
  exportData: false,
};

export const PERMISSION_GROUPS: { label: string; keys: (keyof AdminPermissions)[] }[] = [
  {
    label: 'Restoran boshqaruvi',
    keys: ['manageMenu', 'manageOrders', 'viewReports', 'manageQR', 'manageSettings'],
  },
  {
    label: 'Tizim vakolatlari',
    keys: ['manageUsers', 'promoteToSuperAdmin', 'manageRestaurants', 'viewActivityLogs', 'exportData'],
  },
];

export const PERMISSION_LABELS: Record<keyof AdminPermissions, { label: string; description: string; danger?: boolean }> = {
  manageMenu: { label: 'Menyu boshqaruvi', description: 'Ovqat va kategoriyalarni qo\'shish, tahrirlash, o\'chirish' },
  manageOrders: { label: 'Buyurtmalar', description: 'Buyurtmalarni ko\'rish va holatini o\'zgartirish' },
  viewReports: { label: 'Hisobotlar', description: 'Dashboard, statistika va daromadni ko\'rish' },
  manageQR: { label: 'QR Kodlar', description: 'Stol QR kodlarini ko\'rish va yuklab olish' },
  manageSettings: { label: 'Sozlamalar', description: 'Restoran ma\'lumotlarini o\'zgartirish' },
  manageUsers: { label: 'Foydalanuvchilarni boshqarish', description: 'Foydalanuvchilar ro\'yxatini ko\'rish, tahrirlash va o\'chirish', danger: true },
  promoteToSuperAdmin: { label: 'Super Admin tayinlash', description: 'Boshqa foydalanuvchiga Super Admin huquqini berish yoki olish', danger: true },
  manageRestaurants: { label: 'Restoranlarni boshqarish', description: 'Yangi restoran qo\'shish, tahrirlash va o\'chirish', danger: true },
  viewActivityLogs: { label: 'Faollik loglarini ko\'rish', description: 'Foydalanuvchilarning IP, kirish vaqti va qurilma ma\'lumotlarini ko\'rish', danger: true },
  exportData: { label: 'Ma\'lumotlarni eksport qilish', description: 'Zakazlar va faollik loglarini CSV formatida yuklab olish', danger: true },
};

export interface Waiter {
  id: string;
  name: string;
  phone: string;
  cardNumber: string; // plastik karta raqami
  restaurantId: string;
  isActive: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  userType: 'admin' | 'super-admin' | 'customer' | null;
  restaurantId: string | null;
  username: string | null;
  userId: string | null;
  token: string | null;
  permissions: AdminPermissions | null;
  isActive: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (username: string, oldPassword: string, newPassword: string) => Promise<boolean>;
  addUser: (username: string, password: string, userType: 'admin' | 'super-admin' | 'customer', restaurantId?: string, extra?: Record<string, any>) => Promise<boolean>;
  getAllUsers: () => Array<{ username: string; type: 'admin' | 'super-admin' | 'customer'; restaurantId: string | null; restaurantName?: string; ownerName?: string; email?: string; phone?: string; tables?: number; permissions?: AdminPermissions; cardNumber?: string; serviceFeePercent?: number; balance?: number; waiters?: Array<Waiter & { balance: number }> }>;
  updateUserType: (username: string, newType: 'admin' | 'super-admin' | 'customer') => boolean;
  updateUser: (username: string, data: Partial<{ restaurantName: string; ownerName: string; email: string; phone: string; tables: number; restaurantId: string; cardNumber: string; serviceFeePercent: number }>) => boolean;
  updatePermissions: (username: string, permissions: AdminPermissions) => boolean;
  deleteUser: (username: string) => boolean;
  getActivityLogs: () => UserActivity[];
  recordActivity: (username: string) => void;
  // Ofitsiantlar
  getWaiters: (restaurantId: string) => Waiter[];
  addWaiter: (waiter: Omit<Waiter, 'id'>) => Waiter;
  updateWaiter: (id: string, data: Partial<Waiter>) => boolean;
  deleteWaiter: (id: string) => boolean;
  // Balans
  getBalance: (username: string) => number;
  addBalance: (username: string, amount: number) => void;
  processPayment: (restaurantUsername: string, subtotal: number, serviceFee: number, waiterId?: string, paymentMethod?: 'CASH' | 'CARD') => void;
}

const getStoredUsers = () => {
  const stored = localStorage.getItem('user-credentials');
  if (stored) return JSON.parse(stored);
  return {
    'superadmin': { password: 'qwertyuiop', type: 'super-admin' as const, restaurantId: null, restaurantName: null, ownerName: 'Super Admin', email: 'super_admin@info.com', phone: '+998900000000', tables: 0, cardNumber: '', serviceFeePercent: 10 },
  };
};

const saveUserCredentials = (users: any) => localStorage.setItem('user-credentials', JSON.stringify(users));

// ─── Ofitsiantlar ────────────────────────────────────────────────────────────
const getStoredWaiters = (): Waiter[] => {
  const stored = localStorage.getItem('waiters-data');
  return stored ? JSON.parse(stored) : [];
};
const saveWaiters = (waiters: Waiter[]) => localStorage.setItem('waiters-data', JSON.stringify(waiters));

// ─── Balans ──────────────────────────────────────────────────────────────────
const getStoredBalances = (): Record<string, number> => {
  const stored = localStorage.getItem('balances-data');
  return stored ? JSON.parse(stored) : {};
};
const saveBalances = (balances: Record<string, number>) =>
  localStorage.setItem('balances-data', JSON.stringify(balances));

// Ofitsiant balanslarini saqlash (waiterId -> balance)
const getWaiterBalances = (): Record<string, number> => {
  const stored = localStorage.getItem('waiter-balances-data');
  return stored ? JSON.parse(stored) : {};
};
const saveWaiterBalances = (balances: Record<string, number>) =>
  localStorage.setItem('waiter-balances-data', JSON.stringify(balances));

const getActivityLogs = (): UserActivity[] => {
  const stored = localStorage.getItem('user-activity-logs');
  return stored ? JSON.parse(stored) : [];
};

const saveActivityLogs = (logs: UserActivity[]) =>
  localStorage.setItem('user-activity-logs', JSON.stringify(logs.slice(0, 200)));

async function fetchGeoIP(): Promise<{ ip: string; country: string; city: string }> {
  try {
    const res = await fetch('https://api.ipapi.is/?q');
    const d = await res.json();
    return { ip: d.ip || 'N/A', country: d.location?.country || 'N/A', city: d.location?.city || 'N/A' };
  } catch {
    return { ip: 'N/A', country: 'N/A', city: 'N/A' };
  }
}

const saveActivityLog = (username: string, ua: string) => {
  const logs = getActivityLogs();
  const now = new Date().toISOString();
  const placeholder: LoginHistoryEntry = { ip: 'yuklanmoqda...', country: '...', city: '...', time: now, userAgent: ua };
  const idx = logs.findIndex(l => l.username === username);
  if (idx >= 0) {
    logs[idx].lastSeen = now;
    logs[idx].loginCount = (logs[idx].loginCount || 0) + 1;
    logs[idx].userAgent = ua;
    logs[idx].loginHistory = [placeholder, ...(logs[idx].loginHistory || [])].slice(0, 20);
  } else {
    logs.unshift({ username, ip: 'yuklanmoqda...', country: '...', city: '...', lastSeen: now, loginCount: 1, userAgent: ua, loginHistory: [placeholder] });
  }
  saveActivityLogs(logs);
};

const updateActivityGeo = (username: string, geo: { ip: string; country: string; city: string }) => {
  const logs = getActivityLogs();
  const idx = logs.findIndex(l => l.username === username);
  if (idx >= 0) {
    logs[idx].ip = geo.ip;
    logs[idx].country = geo.country;
    logs[idx].city = geo.city;
    if (logs[idx].loginHistory?.length) {
      logs[idx].loginHistory[0] = { ...logs[idx].loginHistory[0], ...geo };
    }
    saveActivityLogs(logs);
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userType: null,
      restaurantId: null,
      username: null,
      userId: null,
      token: null,
      permissions: null,
      isActive: false,

      login: async (username, password): Promise<boolean> => {
        // Try backend API first
        try {
          const res = await authApi.login(username, password);
          const { token, user } = res.data.data;
          const roleMap: Record<string, 'admin' | 'super-admin' | 'customer'> = {
            SUPER_ADMIN: 'super-admin', ADMIN: 'admin', CUSTOMER: 'customer',
          };
          const userType = roleMap[user.role] || 'customer';
          const perms: AdminPermissions | null = userType === 'admin'
            ? (user.permissions || DEFAULT_PERMISSIONS) : null;
          set({
            isAuthenticated: true, userType, token,
            restaurantId: user.restaurantId || null,
            username: user.username, userId: user.id, permissions: perms,
            isActive: user.isActive ?? false,
          });
          const ua = navigator.userAgent;
          saveActivityLog(user.username, ua);
          fetchGeoIP().then(geo => updateActivityGeo(user.username, geo));
          return true;
        } catch {
          const users = getStoredUsers();
          const identifier = username.toLowerCase().trim();
          // username bo'yicha qidirish
          let user = users[identifier];
          let foundUsername = identifier;
          // email yoki telefon bo'yicha qidirish
          if (!user) {
            const entry = Object.entries(users).find(([, u]: [string, any]) =>
              u.email?.toLowerCase() === identifier ||
              u.phone?.replace(/\D/g, '') === identifier.replace(/\D/g, '')
            );
            if (entry) { foundUsername = entry[0]; user = entry[1] as any; }
          }
          if (user && (user as any).password === password) {
            const perms: AdminPermissions | null = (user as any).type === 'admin'
              ? ((user as any).permissions || DEFAULT_PERMISSIONS) : null;
            set({ isAuthenticated: true, userType: (user as any).type, restaurantId: (user as any).restaurantId, username: foundUsername, userId: null, token: null, permissions: perms });
            const ua = navigator.userAgent;
            saveActivityLog(foundUsername, ua);
            fetchGeoIP().then(geo => updateActivityGeo(foundUsername, geo));
            return true;
          }
          return false;
        }
      },

      logout: () => {
        authApi.logout();
        localStorage.removeItem('guestToken');
        set({ isAuthenticated: false, userType: null, restaurantId: null, username: null, userId: null, token: null, permissions: null });
      },

      changePassword: async (username, oldPassword, newPassword) => {
        try {
          await authApi.changePassword(oldPassword, newPassword);
          return true;
        } catch {
          // Fallback localStorage
          const users = getStoredUsers();
          const user = users[username.toLowerCase()];
          if (user && user.password === oldPassword) { user.password = newPassword; saveUserCredentials(users); return true; }
          return false;
        }
      },

      addUser: async (username, password, userType, restaurantId?, extra?) => {
        try {
          const roleMap: Record<string, string> = { 'admin': 'ADMIN', 'super-admin': 'SUPER_ADMIN', 'customer': 'CUSTOMER' };
          await authApi.register({
            username, password, role: roleMap[userType],
            restaurantId, restaurantName: extra?.restaurantName,
            ownerName: extra?.ownerName, email: extra?.email,
            phone: extra?.phone, tables: extra?.tables,
          });
          return true;
        } catch {
          // Fallback localStorage
          const users = getStoredUsers();
          if (!users[username.toLowerCase()]) {
            users[username.toLowerCase()] = { password, type: userType, restaurantId: restaurantId || null, restaurantName: extra?.restaurantName || null, ownerName: extra?.ownerName || null, email: extra?.email || null, phone: extra?.phone || null, tables: extra?.tables || 0 };
            saveUserCredentials(users);
            return true;
          }
          return false;
        }
      },

      getAllUsers: () => {
        const users = getStoredUsers();
        const balances = getStoredBalances();
        const waiterBalances = getWaiterBalances();
        const waiters = getStoredWaiters();
        return Object.entries(users).map(([username, data]: [string, any]) => ({
          username, type: data.type, restaurantId: data.restaurantId, restaurantName: data.restaurantName, ownerName: data.ownerName, email: data.email, phone: data.phone, tables: data.tables,
          permissions: data.type === 'admin' ? (data.permissions || DEFAULT_PERMISSIONS) : undefined,
          cardNumber: data.cardNumber || '',
          serviceFeePercent: data.serviceFeePercent ?? 10,
          balance: balances[username.toLowerCase()] ?? 0,
          waiters: waiters
            .filter(w => w.restaurantId === data.restaurantId)
            .map(w => ({ ...w, balance: waiterBalances[w.id] ?? 0 })),
        }));
      },

      updateUserType: (username, newType) => {
        const users = getStoredUsers();
        const user = users[username.toLowerCase()];
        if (user) { user.type = newType; saveUserCredentials(users); return true; }
        return false;
      },

      updateUser: (username, data) => {
        const users = getStoredUsers();
        const user = users[username.toLowerCase()];
        if (user) { Object.assign(user, data); saveUserCredentials(users); return true; }
        return false;
      },

      updatePermissions: (username, permissions) => {
        const users = getStoredUsers();
        const user = users[username.toLowerCase()];
        if (user) {
          user.permissions = permissions;
          saveUserCredentials(users);
          return true;
        }
        return false;
      },

      deleteUser: (username) => {
        const users = getStoredUsers();
        if (users[username.toLowerCase()]) { delete users[username.toLowerCase()]; saveUserCredentials(users); return true; }
        return false;
      },

      getActivityLogs: () => getActivityLogs(),

      recordActivity: (username) => {
        const logs = getActivityLogs();
        const idx = logs.findIndex(l => l.username === username);
        if (idx >= 0) { logs[idx].lastSeen = new Date().toISOString(); saveActivityLogs(logs); }
      },

      // ─── Ofitsiantlar ──────────────────────────────────────────────────────
      getWaiters: (restaurantId) => {
        return getStoredWaiters().filter(w => w.restaurantId === restaurantId);
      },

      addWaiter: (waiter) => {
        const waiters = getStoredWaiters();
        const newWaiter: Waiter = { ...waiter, id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
        waiters.push(newWaiter);
        saveWaiters(waiters);
        return newWaiter;
      },

      updateWaiter: (id, data) => {
        const waiters = getStoredWaiters();
        const idx = waiters.findIndex(w => w.id === id);
        if (idx < 0) return false;
        waiters[idx] = { ...waiters[idx], ...data };
        saveWaiters(waiters);
        return true;
      },

      deleteWaiter: (id) => {
        const waiters = getStoredWaiters();
        const filtered = waiters.filter(w => w.id !== id);
        if (filtered.length === waiters.length) return false;
        saveWaiters(filtered);
        return true;
      },

      // ─── Balans ────────────────────────────────────────────────────────────
      getBalance: (username) => {
        const balances = getStoredBalances();
        return balances[username.toLowerCase()] ?? 0;
      },

      addBalance: (username, amount) => {
        const balances = getStoredBalances();
        const key = username.toLowerCase();
        balances[key] = (balances[key] ?? 0) + amount;
        saveBalances(balances);
      },

      // Buyurtma to'lovi logikasi:
      // NAQD: mijoz pulni qo'lda beradi → jami summa admin balansiga tushadi,
      //        keyin xizmat haqi admin balansidan yechib ofitsiant balansiga o'tkaziladi
      // KARTA: mijoz kartadan to'laydi → subtotal admin balansiga, serviceFee ofitsiant balansiga
      processPayment: (restaurantUsername, subtotal, serviceFee, waiterId, paymentMethod = 'CASH') => {
        const balances = getStoredBalances();
        const key = restaurantUsername.toLowerCase();
        const total = subtotal + serviceFee;

        if (paymentMethod === 'CASH') {
          // Naqd: avval jami summa admin balansiga tushadi
          balances[key] = (balances[key] ?? 0) + total;
          saveBalances(balances);

          // Keyin xizmat haqi admin balansidan yechib ofitsiantga o'tkaziladi
          if (waiterId && serviceFee > 0) {
            balances[key] = (balances[key] ?? 0) - serviceFee;
            saveBalances(balances);
            const wb = getWaiterBalances();
            wb[waiterId] = (wb[waiterId] ?? 0) + serviceFee;
            saveWaiterBalances(wb);
          }
        } else {
          // Karta: subtotal admin balansiga, serviceFee to'g'ridan ofitsiant balansiga
          balances[key] = (balances[key] ?? 0) + subtotal;
          saveBalances(balances);
          if (waiterId && serviceFee > 0) {
            const wb = getWaiterBalances();
            wb[waiterId] = (wb[waiterId] ?? 0) + serviceFee;
            saveWaiterBalances(wb);
          }
        }
      },
    }),
    { name: 'auth-storage' }
  )
);
