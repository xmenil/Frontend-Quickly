import { create } from 'zustand';
import { CartItem } from '../domain/types';
import { safeJsonParse } from '../lib/utils';

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  removeItems: (ids: string[]) => void;
  clearCart: () => void;
  getItemCount: () => number;
  toggleSelectItem: (id: string) => void;
  setItemSelected: (id: string, selected: boolean) => void;
  selectAllItems: (selected: boolean) => void;
  selectMerchantItems: (merchantId: string, selected: boolean) => void;
  getSelectedItems: () => CartItem[];
}

const STORAGE_KEY = 'quickly_cart_v1';

function getStoredCart(): CartItem[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  const items = safeJsonParse<CartItem[]>(raw, []);
  // Ensure existing stored items have selected defaulted to true if undefined
  return items.map((it) => ({
    ...it,
    selected: it.selected !== undefined ? it.selected : true,
  }));
}

export const useCartStore = create<CartState>((set, get) => ({
  items: getStoredCart(),

  addItem: (item) => {
    const current = get().items;
    // Check if duplicate item exists (same productId and same variant and same note)
    const existingIndex = current.findIndex(
      (it) =>
        it.productId === item.productId &&
        it.selectedVariantId === item.selectedVariantId &&
        (it.note || '') === (item.note || '')
    );

    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + item.quantity,
        selected: true, // Auto-select when adding or increasing
      };
    } else {
      const newItem: CartItem = {
        ...item,
        id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        selected: item.selected !== undefined ? item.selected : true,
      };
      updated = [...current, newItem];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ items: updated });
  },

  updateQuantity: (id: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(id);
      return;
    }

    const updated = get().items.map((it) =>
      it.id === id ? { ...it, quantity } : it
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ items: updated });
  },

  removeItem: (id: string) => {
    const updated = get().items.filter((it) => it.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ items: updated });
  },

  removeItems: (ids: string[]) => {
    const idsSet = new Set(ids);
    const updated = get().items.filter((it) => !idsSet.has(it.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ items: updated });
  },

  clearCart: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ items: [] });
  },

  getItemCount: () => {
    return get().items.reduce((acc, it) => acc + it.quantity, 0);
  },

  toggleSelectItem: (id: string) => {
    const updated = get().items.map((it) => {
      if (it.id === id) {
        const isCurrentSelected = it.selected !== false;
        return { ...it, selected: !isCurrentSelected };
      }
      return it;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ items: updated });
  },

  setItemSelected: (id: string, selected: boolean) => {
    const updated = get().items.map((it) =>
      it.id === id ? { ...it, selected } : it
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ items: updated });
  },

  selectAllItems: (selected: boolean) => {
    const updated = get().items.map((it) => ({
      ...it,
      selected,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ items: updated });
  },

  selectMerchantItems: (merchantId: string, selected: boolean) => {
    const updated = get().items.map((it) => {
      if (it.merchantId === merchantId) {
        return { ...it, selected };
      }
      return it;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ items: updated });
  },

  getSelectedItems: () => {
    return get().items.filter((it) => it.selected !== false);
  },
}));

// Cross-tab synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      const items = safeJsonParse<CartItem[]>(e.newValue, []).map((it) => ({
        ...it,
        selected: it.selected !== undefined ? it.selected : true,
      }));
      useCartStore.setState({ items });
    }
  });
}
