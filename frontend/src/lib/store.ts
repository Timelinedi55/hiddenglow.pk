import { create } from 'zustand';
import { CartItem } from './types';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  hasHydrated: boolean;
  hydrateFromStorage: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, variantId?: number) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setOpen: (open: boolean) => void;
  getTotal: () => number;
  getCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,
  hasHydrated: false,

  hydrateFromStorage: () => {
    if (typeof window === 'undefined' || get().hasHydrated) return;
    const items = JSON.parse(localStorage.getItem('hg_cart') || '[]');
    set({ items, hasHydrated: true });
  },

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId,
      );
      let newItems;
      if (existing) {
        newItems = state.items.map((i) =>
          i.productId === item.productId && i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i,
        );
      } else {
        newItems = [...state.items, item];
      }
      if (typeof window !== 'undefined') localStorage.setItem('hg_cart', JSON.stringify(newItems));
      return { items: newItems, isOpen: true };
    });
  },

  removeItem: (productId, variantId) => {
    set((state) => {
      const newItems = state.items.filter(
        (i) => !(i.productId === productId && i.variantId === variantId),
      );
      if (typeof window !== 'undefined') localStorage.setItem('hg_cart', JSON.stringify(newItems));
      return { items: newItems };
    });
  },

  updateQuantity: (productId, quantity, variantId) => {
    set((state) => {
      const newItems = state.items.map((i) =>
        i.productId === productId && i.variantId === variantId
          ? { ...i, quantity: Math.max(1, quantity) }
          : i,
      );
      if (typeof window !== 'undefined') localStorage.setItem('hg_cart', JSON.stringify(newItems));
      return { items: newItems };
    });
  },

  clearCart: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('hg_cart');
    set({ items: [] });
  },

  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (open) => set({ isOpen: open }),

  getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
