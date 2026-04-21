import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GuestState {
  sessionToken: string | null;
  restaurantId: string | null;
  tableNumber: string | null;
  expiresAt: string | null;
  setSession: (data: {
    sessionToken: string;
    restaurantId: string;
    tableNumber: string;
    expiresAt: string;
  }) => void;
  clearSession: () => void;
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set) => ({
      sessionToken: null,
      restaurantId: null,
      tableNumber: null,
      expiresAt: null,
      setSession: (data) => {
        localStorage.setItem('guestToken', data.sessionToken);
        set(data);
      },
      clearSession: () => {
        localStorage.removeItem('guestToken');
        set({
          sessionToken: null,
          restaurantId: null,
          tableNumber: null,
          expiresAt: null,
        });
      },
    }),
    {
      name: 'guest-session',
    }
  )
);
