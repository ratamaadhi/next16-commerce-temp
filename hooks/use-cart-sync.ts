"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCartStore } from "./use-cart";
import { getOrCreateSessionId } from "@/lib/cart-session";
import { fetchCart, createCart, updateCart, deleteCart, resolveCartItems } from "@/lib/cart-sync";
import { toast } from "sonner";

const DEBOUNCE_MS = 500;
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useCartSync(userDocumentId?: string | null) {
  const syncingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef(0);
  const initializedRef = useRef(false);
  const prevUserDocRef = useRef<string | null | undefined>(undefined);

  const syncToStrapi = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const { items, cartDocumentId, sessionId } = useCartStore.getState();

          if (!cartDocumentId) {
            if (items.length === 0) return;
            const response = await createCart({ sessionId: sessionId ?? undefined, items });
            if (response.data?.documentId) {
              useCartStore.getState().setCartDocumentId(response.data.documentId);
            }
          } else if (items.length === 0) {
            await deleteCart(cartDocumentId);
            useCartStore.getState().setCartDocumentId(null);
          } else {
            await updateCart(cartDocumentId, { sessionId: sessionId ?? undefined, items });
          }
          retryRef.current = 0;
          return;
        } catch {
          retryRef.current = attempt + 1;
          if (attempt < MAX_RETRIES) {
            toast.error("Gagal sync keranjang, mencoba lagi...");
            await sleep(1000 * (attempt + 1));
          } else {
            toast.error("Gagal menyimpan keranjang ke server");
            retryRef.current = 0;
          }
        }
      }
    } finally {
      syncingRef.current = false;
    }
  }, []);

  const hydrate = useCallback(async () => {
    const sessionId = getOrCreateSessionId();
    useCartStore.getState().setSessionId(sessionId);

    try {
      const cart = await fetchCart({ sessionId });
      if (cart?.documentId && cart.items?.length) {
        const resolved = await resolveCartItems(cart.items);
        useCartStore.getState().replaceCart(cart.documentId, resolved);
      }
    } catch {
      // No cart found or error — start fresh
    }
  }, []);

  // Initial hydration
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      hydrate();
    }
  }, [hydrate]);

  // React to login/logout
  useEffect(() => {
    const prev = prevUserDocRef.current;
    prevUserDocRef.current = userDocumentId ?? null;

    if (!initializedRef.current) return;

    if (userDocumentId && userDocumentId !== prev) {
      // Login — merge
      (async () => {
        const sessionId = useCartStore.getState().sessionId;
        try {
          const serverCart = await fetchCart({ userDocumentId });
          if (serverCart?.documentId && serverCart.items?.length) {
            const resolved = await resolveCartItems(serverCart.items);
            useCartStore.getState().mergeCart(serverCart.documentId, resolved);
          } else {
            // No server cart — push current cart with user ownership
            if (useCartStore.getState().items.length > 0) {
              const resp = await createCart({ userDocumentId, items: useCartStore.getState().items });
              if (resp.data?.documentId) {
                useCartStore.getState().setCartDocumentId(resp.data.documentId);
              }
            }
          }
          // Clean up guest session cart
          if (sessionId) {
            try {
              const guestCart = await fetchCart({ sessionId });
              if (guestCart?.documentId) {
                await deleteCart(guestCart.documentId);
              }
            } catch { /* ignore cleanup failure */ }
          }
        } catch {
          // Fallback: keep current state
        }
      })();
    } else if (userDocumentId === null && prev !== null && prev !== undefined) {
      // Logout — switch to guest
      const newSessionId = getOrCreateSessionId();
      useCartStore.getState().setSessionId(newSessionId);
      useCartStore.getState().setCartDocumentId(null);

      (async () => {
        try {
          const cart = await fetchCart({ sessionId: newSessionId });
          if (cart?.documentId && cart.items?.length) {
            const resolved = await resolveCartItems(cart.items);
            useCartStore.getState().replaceCart(cart.documentId, resolved);
          } else if (useCartStore.getState().items.length > 0) {
            const resp = await createCart({ sessionId: newSessionId, items: useCartStore.getState().items });
            if (resp.data?.documentId) {
              useCartStore.getState().setCartDocumentId(resp.data.documentId);
            }
          }
        } catch { /* ignore */ }
      })();
    }
  }, [userDocumentId, hydrate]);

  // Subscribe to store changes for debounced sync
  useEffect(() => {
    const unsub = useCartStore.subscribe((state, prev) => {
      if (state.items === prev.items || !initializedRef.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        syncToStrapi();
      }, DEBOUNCE_MS);
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [syncToStrapi]);

  return { syncNow: syncToStrapi };
}
