import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

interface CartState {
  items: CartItem[];
  serviceFeePercent: number;
  restaurantId: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateSpecialInstructions: (menuItemId: string, instructions: string) => void;
  clearCart: () => void;
  setServiceFeePercent: (percent: number) => void;
  setRestaurantId: (id: string) => void;
  getSubtotal: () => number;
  getServiceFee: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      serviceFeePercent: 10,
      restaurantId: null,

      addItem: (item) => {
        const items = get().items;
        const existing = items.find((i) => i.menuItemId === item.menuItemId);
        if (existing) {
          set({ items: items.map((i) => i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + item.quantity } : i) });
        } else {
          set({ items: [...items, item] });
        }
      },

      removeItem: (menuItemId) => set({ items: get().items.filter((i) => i.menuItemId !== menuItemId) }),

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) get().removeItem(menuItemId);
        else set({ items: get().items.map((i) => i.menuItemId === menuItemId ? { ...i, quantity } : i) });
      },

      updateSpecialInstructions: (menuItemId, instructions) => {
        set({ items: get().items.map((i) => i.menuItemId === menuItemId ? { ...i, specialInstructions: instructions } : i) });
      },

      clearCart: () => set({ items: [] }),

      setServiceFeePercent: (percent) => set({ serviceFeePercent: percent }),

      setRestaurantId: (id) => set({ restaurantId: id }),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      // Xizmat haqi har doim hisoblanadi (ofitsiant tanlash yo'q)
      getServiceFee: () => {
        const { serviceFeePercent } = get();
        if (!serviceFeePercent) return 0;
        return Math.round(get().getSubtotal() * serviceFeePercent / 100);
      },

      getTotal: () => get().getSubtotal() + get().getServiceFee(),
    }),
    {
      name: 'cart-storage',
      // serviceFeePercent ni persist qilmaymiz — har safar backend dan olinadi
      partialize: (state) => ({
        items: state.items,
        restaurantId: state.restaurantId,
      }),
    }
  )
);
