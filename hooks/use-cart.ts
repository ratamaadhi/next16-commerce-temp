"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: number;
  productDocumentId?: string;
  productSku?: string;
  name: string;
  price: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
  quantity: number;
  maxQuantity?: number;
  image?: string;
  variantId?: string;
  variantName?: string;
  variantSku?: string;
}

interface CartStore {
  items: CartItem[];

  // Cart sync metadata
  sessionId: string | null;
  cartDocumentId: string | null;

  // Existing operations
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }, hasVariants?: boolean) => boolean;
  removeItem: (productId: number, variantId?: string) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getTotalWeight: () => number;

  // New sync operations
  setSessionId: (id: string | null) => void;
  setCartDocumentId: (id: string | null) => void;
  setItems: (items: CartItem[]) => void;
  mergeItems: (incoming: CartItem[]) => void;
  mergeCart: (cartDocumentId: string, serverItems: CartItem[]) => void;
  replaceCart: (cartDocumentId: string | null, items: CartItem[]) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: null,
      cartDocumentId: null,

      addItem: (item, hasVariants) => {
        if (hasVariants && !item.variantId) {
          return false;
        }
        const { items } = get();
        const existingIndex = items.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        if (existingIndex > -1) {
          const existing = items[existingIndex];
          const newQty = existing.quantity + (item.quantity || 1);
          const maxQty = item.maxQuantity ?? existing.maxQuantity;
          if (maxQty !== undefined && newQty > maxQty) return false;
          const newItems = [...items];
          newItems[existingIndex] = { ...newItems[existingIndex], quantity: newQty };
          set({ items: newItems });
        } else {
          const maxQty = item.maxQuantity;
          const qty = item.quantity || 1;
          if (maxQty !== undefined && qty > maxQty) return false;
          set({ items: [...items, { ...item, quantity: qty }] });
        }
        return true;
      },

      removeItem: (productId, variantId) => {
        set({
          items: get().items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        });
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set({
          items: get().items.map((i) => {
            if (i.productId !== productId || i.variantId !== variantId) return i;
            const capped = i.maxQuantity !== undefined ? Math.min(quantity, i.maxQuantity) : quantity;
            return { ...i, quantity: capped };
          }),
        });
      },

      clearCart: () => set({ items: [], cartDocumentId: null }),

      getTotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      getTotalWeight: () =>
        get().items.reduce(
          (sum, i) =>
            sum + (i.dimensions?.weight ?? i.weight ?? 500) * i.quantity,
          0,
        ),

      setSessionId: (id) => set({ sessionId: id }),

      setCartDocumentId: (id) => set({ cartDocumentId: id }),

      setItems: (items) => set({ items }),

      mergeItems: (incoming) => {
        const { items } = get();
        const merged = [...items];

        for (const inc of incoming) {
          const idx = merged.findIndex(
            (i) => i.productId === inc.productId && i.variantId === inc.variantId
          );
          if (idx > -1) {
            const sum = merged[idx].quantity + inc.quantity;
            const maxQty = merged[idx].maxQuantity ?? inc.maxQuantity;
            merged[idx] = {
              ...merged[idx],
              quantity: maxQty !== undefined ? Math.min(sum, maxQty) : sum,
            };
          } else {
            merged.push({ ...inc });
          }
        }
        set({ items: merged });
      },

      mergeCart: (cartDocumentId, serverItems) => {
        const local = get().items;
        const merged = [...serverItems];

        for (const localItem of local) {
          const idx = merged.findIndex(
            (i) => i.productId === localItem.productId && i.variantId === localItem.variantId
          );
          if (idx > -1) {
            const sum = merged[idx].quantity + localItem.quantity;
            const maxQty = merged[idx].maxQuantity;
            merged[idx] = {
              ...merged[idx],
              quantity: maxQty !== undefined ? Math.min(sum, maxQty) : sum,
            };
          } else {
            merged.push({ ...localItem });
          }
        }
        set({ items: merged, cartDocumentId });
      },

      replaceCart: (cartDocumentId, items) => set({ items, cartDocumentId }),
    }),
    { name: "cart-storage" }
  )
);
