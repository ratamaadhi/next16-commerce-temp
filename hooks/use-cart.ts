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
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
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

      addItem: (item) => {
        const { items } = get();
        const existingIndex = items.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += item.quantity || 1;
          set({ items: newItems });
        } else {
          set({ items: [...items, { ...item, quantity: item.quantity || 1 }] });
        }
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
          items: get().items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity }
              : i
          ),
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
            merged[idx] = {
              ...merged[idx],
              quantity: merged[idx].quantity + inc.quantity,
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
            merged[idx] = {
              ...merged[idx],
              quantity: merged[idx].quantity + localItem.quantity,
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
