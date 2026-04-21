import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OrderLogEntry {
  id: string;
  username: string | null;
  restaurantId: string;
  restaurantName: string;
  tableNumber: string | number;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  ip: string;
  country: string;
  city: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  paymentMethod: 'CASH' | 'CARD';
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  userAgent: string;
  waiterId?: string;
  waiterName?: string;
  serviceFee?: number;
}

interface OrderLogState {
  logs: OrderLogEntry[];
  addLog: (entry: Omit<OrderLogEntry, 'id' | 'createdAt' | 'ip' | 'country' | 'city' | 'userAgent' | 'deviceType' | 'status'>) => void;
  updateStatus: (id: string, status: OrderLogEntry['status']) => void;
  getLogs: () => OrderLogEntry[];
  clearLogs: () => void;
}

function getDeviceType(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

async function fetchGeoIP(): Promise<{ ip: string; country: string; city: string }> {
  try {
    const res = await fetch('https://api.ipapi.is/?q');
    const d = await res.json();
    return { ip: d.ip || 'N/A', country: d.location?.country || 'N/A', city: d.location?.city || 'N/A' };
  } catch {
    return { ip: 'N/A', country: 'N/A', city: 'N/A' };
  }
}

export const useOrderLogStore = create<OrderLogState>()(
  persist(
    (set, get) => ({
      logs: [],

      addLog: async (entry) => {
        const ua = navigator.userAgent;
        // Optimistik yozuv — IP kelguncha placeholder
        const tempEntry: OrderLogEntry = {
          ...entry,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          ip: 'yuklanmoqda...',
          country: '...',
          city: '...',
          deviceType: getDeviceType(ua),
          status: 'pending',
          userAgent: ua,
        };
        set(state => ({ logs: [tempEntry, ...state.logs].slice(0, 500) }));

        // Background da geo ma'lumot olish
        const geo = await fetchGeoIP();
        set(state => ({
          logs: state.logs.map(l => l.id === tempEntry.id ? { ...l, ip: geo.ip, country: geo.country, city: geo.city } : l),
        }));
      },

      updateStatus: (id, status) => {
        set(state => ({ logs: state.logs.map(l => l.id === id ? { ...l, status } : l) }));
      },

      getLogs: () => get().logs,
      clearLogs: () => set({ logs: [] }),
    }),
    { name: 'order-log-storage' }
  )
);
