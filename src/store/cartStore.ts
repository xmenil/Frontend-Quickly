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
  selectOnlyItem: (id: string) => void;
  selectAllItems: (selected: boolean) => void;
  selectMerchantItems: (merchantId: string, selected: boolean) => void;
  getSelectedItems: () => CartItem[];
}

const STORAGE_KEY = 'quickly_cart_v1';

function getStoredCart(): CartItem[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  const items = safeJsonParse<CartItem[]>(raw, []);
  if (items.length === 0) return [];

  // Enforce single-store selection rule: only 1 merchant can have selected items
  const firstSelected = items.find((it) => it.selected !== false);
  const activeMerchantId = firstSelected ? firstSelected.merchantId : items[0].merchantId;

  return items.map((it) => {
    const isSelected = it.selected !== undefined ? it.selected : true;
    return {
      ...it,
      selected: it.merchantId === activeMerchantId ? isSelected : false,
    };
  });
}

export const useCartStore = create<CartState>((set, get) => ({
  items: getStoredCart(),

  addItem: (item) => {
    const current = get().items;
    const existingIndex = current.findIndex(
      (it) =>
        it.productId === item.productId &&
        it.selectedVariantId === item.selectedVariantId &&
        (it.note || '') === (item.note || '')
    );

    let updated: CartItem[];
    if (existingIndex > -1) {
      const targetMerchantId = current[existingIndex].merchantId;
      updated = current.map((it, idx) => {
        if (idx === existingIndex) {
          return {
            ...it,
            quantity: it.quantity + item.quantity,
            selected: true,
          };
        }
        if (it.merchantId !== targetMerchantId) {
          return { ...it, selected: false };
        }
        return it;
      });
    } else {
      const newItem: CartItem = {
        ...item,
        id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        selected: true,
      };
      // When adding a new item, ensure other merchants are unselected
      updated = current.map((it) =>
        it.merchantId !== item.merchantId ? { ...it, selected: false } : it
      );
      updated.push(newItem);
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
    const current = get().items;
    const targetItem = current.find((it) => it.id === id);
    if (!targetItem) return;

    const willBeSelected = targetItem.selected === false;

    let updated: CartItem[];
    if (willBeSelected) {
      // Activating this item: deselect any items from other merchants!
      updated = current.map((it) => {
        if (it.id === id) {
          return { ...it, selected: true };
        }
        if (it.merchantId !== targetItem.merchantId) {
          return { ...it, selected: false };
        }
        return it;
      });
    } else {
      updated = current.map((it) =>
        it.id === id ? { ...it, selected: false } : it
      );
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ items: updated });
  },

  selectOnlyItem: (id: string) => {
    const updated = get().items.map((it) => ({
      ...it,
      selected: it.id === id,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ items: updated });
  },

  setItemSelected: (id: string, selected: boolean) => {
    const current = get().items;
    const targetItem = current.find((it) => it.id === id);
    if (!targetItem) return;

    let updated: CartItem[];
    if (selected) {
      updated = current.map((it) => {
        if (it.id === id) return { ...it, selected: true };
        if (it.merchantId !== targetItem.merchantId) return { ...it, selected: false };
        return it;
      });
    } else {
      updated = current.map((it) => (it.id === id ? { ...it, selected: false } : it));
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ items: updated });
  },

  selectAllItems: (selected: boolean) => {
    if (!selected) {
      const updated = get().items.map((it) => ({ ...it, selected: false }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      set({ items: updated });
      return;
    }

    // When selecting all: select all items of the currently active merchant (or first merchant)
    const current = get().items;
    const activeMerchantId =
      current.find((it) => it.selected !== false)?.merchantId ||
      current[0]?.merchantId;

    const updated = current.map((it) => ({
      ...it,
      selected: activeMerchantId ? it.merchantId === activeMerchantId : false,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ items: updated });
  },

  selectMerchantItems: (merchantId: string, selected: boolean) => {
    let updated: CartItem[];
    if (selected) {
      // Select all items of this merchant, and deselect all items of other merchants
      updated = get().items.map((it) => ({
        ...it,
        selected: it.merchantId === merchantId,
      }));
    } else {
      // Deselect all items of this merchant
      updated = get().items.map((it) =>
        it.merchantId === merchantId ? { ...it, selected: false } : it
      );
    }
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
      const items = safeJsonParse<CartItem[]>(e.newValue, []);
      if (items.length === 0) {
        useCartStore.setState({ items: [] });
        return;
      }
      const firstSelected = items.find((it) => it.selected !== false);
      const activeMerchantId = firstSelected ? firstSelected.merchantId : items[0].merchantId;
      const sanitized = items.map((it) => ({
        ...it,
        selected: it.merchantId === activeMerchantId ? it.selected !== false : false,
      }));
      useCartStore.setState({ items: sanitized });
    }
  });
}
