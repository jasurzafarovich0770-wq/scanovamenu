import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add guest token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('guestToken');
  if (token) {
    config.headers['x-guest-token'] = token;
  }
  // Add auth token if available
  const authToken = localStorage.getItem('authToken');
  if (authToken && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    // Backend yangi guest token qaytargan bo'lsa — saqlash
    const newToken = response.headers['x-new-guest-token'];
    if (newToken) {
      localStorage.setItem('guestToken', newToken);
    }
    return response;
  },
  (error) => {
    // Session muddati o'tgan bo'lsa — localStorage dan eski tokenni o'chirish
    if (error.response?.status === 401) {
      const errMsg = error.response?.data?.error || '';
      if (errMsg.includes('Session expired') || errMsg.includes('Session is inactive')) {
        localStorage.removeItem('guestToken');
      }
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const guestApi = {
  createSession: async (restaurantId: string, tableNumber: string) => {
    const response = await api.post('/guest/session', { restaurantId, tableNumber });
    // Store the token for future requests
    if (response.data?.data?.sessionToken) {
      localStorage.setItem('guestToken', response.data.data.sessionToken);
    }
    return response;
  },
  
  validateSession: async (token: string) => {
    return await api.get(`/guest/session/${token}/validate`);
  },
};

export const orderApi = {
  create: async (data: any) => {
    return await api.post('/orders', data);
  },
  
  getById: async (orderId: string) => {
    return await api.get(`/orders/${orderId}`);
  },
  
  updateStatus: async (orderId: string, status: string) => {
    return await api.patch(`/orders/${orderId}/status`, { status });
  },

  // Guest tomonidan bekor qilish (faqat PENDING holatida)
  cancelByGuest: async (orderId: string) => {
    return await api.patch(`/orders/${orderId}/cancel`);
  },

  // Ofitsiant chaqirish
  callWaiter: async (orderId: string) => {
    return await api.post(`/orders/${orderId}/call-waiter`);
  },

  // Admin ofitsiant chaqiruvini o'chirish
  dismissWaiterCall: async (orderId: string) => {
    return await api.delete(`/orders/${orderId}/call-waiter`);
  },

  // Guest sessiyasidagi barcha buyurtmalar
  getMyOrders: async () => {
    return await api.get('/orders/my/session');
  },

  getByRestaurant: async (restaurantId: string) => {
    return await api.get(`/orders/restaurant/${restaurantId}`);
  },

  getAllOrders: async () => {
    return await api.get('/orders/all');
  },
};

export const menuApi = {
  // Menu Items
  createItem: async (data: {
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
  }) => {
    return await api.post('/menu/items', data);
  },

  getItemById: async (id: string) => {
    return await api.get(`/menu/items/${id}`);
  },

  getItemsByRestaurant: async (restaurantId: string) => {
    return await api.get(`/menu/restaurants/${restaurantId}/items`);
  },

  updateItem: async (id: string, data: any) => {
    return await api.put(`/menu/items/${id}`, data);
  },

  deleteItem: async (id: string) => {
    return await api.delete(`/menu/items/${id}`);
  },

  // Categories
  createCategory: async (data: {
    restaurantId: string;
    name: string;
    description?: string;
    displayOrder?: number;
  }) => {
    return await api.post('/menu/categories', data);
  },

  getCategoriesByRestaurant: async (restaurantId: string) => {
    return await api.get(`/menu/restaurants/${restaurantId}/categories`);
  },

  updateCategory: async (id: string, data: any) => {
    return await api.put(`/menu/categories/${id}`, data);
  },

  deleteCategory: async (id: string) => {
    return await api.delete(`/menu/categories/${id}`);
  },
};

export const waiterApi = {
  getByRestaurant: async (restaurantId: string) => {
    return await api.get(`/waiters/restaurant/${restaurantId}`);
  },
  create: async (data: { restaurantId: string; name: string; phone: string; cardNumber: string }) => {
    return await api.post('/waiters', data);
  },
  update: async (id: string, data: Partial<{ name: string; phone: string; cardNumber: string; isActive: boolean }>) => {
    return await api.patch(`/waiters/${id}`, data);
  },
  delete: async (id: string) => {
    return await api.delete(`/waiters/${id}`);
  },
  getBalance: async (id: string) => {
    return await api.get(`/waiters/${id}/balance`);
  },
};

export const walletApi = {
  getRestaurantWallet: async (restaurantId: string) => {
    return await api.get(`/waiters/wallet/restaurant/${restaurantId}`);
  },
  setupRestaurantWallet: async (restaurantId: string, cardNumber?: string) => {
    return await api.post(`/waiters/wallet/restaurant/${restaurantId}/setup`, { cardNumber });
  },
  getWaiterWallet: async (waiterId: string) => {
    return await api.get(`/waiters/wallet/waiter/${waiterId}`);
  },
  transfer: async (params: {
    fromType: 'restaurant' | 'waiter';
    fromId: string;
    toType: 'restaurant' | 'waiter';
    toId: string;
    amount: number;
    description?: string;
  }) => {
    return await api.post('/waiters/wallet/transfer', params);
  },
};

export const subscriptionApi = {
  // Admin: to'lov yuborish
  submitPayment: async (data: { amount: number; screenshotUrl: string; comment?: string }) =>
    api.post('/subscriptions', data),

  // Admin: o'z to'lovlari
  getMyPayments: async () => api.get('/subscriptions/me'),

  // Super Admin: barcha to'lovlar
  getAllPayments: async (status?: string) =>
    api.get('/subscriptions', { params: status ? { status } : {} }),

  // Super Admin: approve/reject
  reviewPayment: async (id: string, action: 'approve' | 'reject', adminNote?: string) =>
    api.patch(`/subscriptions/${id}/review`, { action, adminNote }),

  // Super Admin: block/unblock
  toggleBlock: async (userId: string) =>
    api.patch(`/subscriptions/users/${userId}/block`),
};

export const uploadApi = {
  // Rasm faylini Cloudinary ga yuklash
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
    return res.data.url as string;
  },
};

export const authApi = {
  login: async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data?.data?.token) {
      localStorage.setItem('authToken', res.data.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.data.token}`;
    }
    return res;
  },

  register: async (data: {
    username: string; password: string; role?: string;
    restaurantId?: string; restaurantName?: string;
    ownerName?: string; email?: string; phone?: string; tables?: number;
  }) => {
    const res = await api.post('/auth/register', data);
    if (res.data?.data?.token) {
      localStorage.setItem('authToken', res.data.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.data.token}`;
    }
    return res;
  },

  getMe: async () => api.get('/auth/me'),

  updateProfile: async (data: Partial<{
    restaurantName: string; ownerName: string; email: string;
    phone: string; tables: number; cardNumber: string; serviceFeePercent: number;
  }>) => api.patch('/auth/profile', data),

  changePassword: async (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),

  getAllUsers: async () => api.get('/auth/users'),

  getRestaurantInfo: async (restaurantId: string) =>
    api.get(`/auth/restaurant/${restaurantId}/info`),

  updateUserRole: async (id: string, role: string) =>
    api.patch(`/auth/users/${id}/role`, { role }),

  updatePermissions: async (id: string, permissions: Record<string, boolean>) =>
    api.patch(`/auth/users/${id}/permissions`, { permissions }),

  deleteUser: async (id: string) => api.delete(`/auth/users/${id}`),

  logout: () => {
    localStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
  },

  restoreToken: () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  },
};
