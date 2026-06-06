"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCartStore } from "./use-cart";
import { getOrCreateSessionId, resetSessionId } from "@/lib/cart-session";
import { fetchCart, createCart, updateCart, deleteCart, resolveCartItems } from "@/lib/cart-sync";
import { StrapiError } from "@/lib/strapi";
import { toast } from "sonner";

const DEBOUNCE_MS = 500;
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useCartSync(userDocumentId?: string | number | null) {
  const syncingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef(0);
  const initializedRef = useRef(false);
  const prevUserDocRef = useRef<string | number | null | undefined>(undefined);
  const userDocIdRef = useRef(userDocumentId);
  userDocIdRef.current = userDocumentId;

  const syncToStrapi = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const { items, cartDocumentId, sessionId } = useCartStore.getState();
          const uid = userDocIdRef.current;

          if (!items) return;

          if (!cartDocumentId) {
            if (items.length === 0) return;
            const response = await createCart({
              sessionId: sessionId ?? undefined,
              userDocumentId: uid ?? undefined,
              items,
            });
            if (response.data?.documentId) {
              useCartStore.getState().setCartDocumentId(response.data.documentId);
            }
          } else if (items.length === 0) {
            await deleteCart(cartDocumentId);
            useCartStore.getState().setCartDocumentId(null);
          } else {
            try {
              await updateCart(cartDocumentId, { sessionId: sessionId ?? undefined, items });
            } catch (err) {
              if (err instanceof StrapiError && err.status === 404) {
                useCartStore.getState().setCartDocumentId(null);
                const response = await createCart({
                  sessionId: sessionId ?? undefined,
                  userDocumentId: uid ?? undefined,
                  items,
                });
                if (response.data?.documentId) {
                  useCartStore.getState().setCartDocumentId(response.data.documentId);
                }
              } else {
                throw err;
              }
            }
          }
          retryRef.current = 0;
          return;
        } catch (err) {
          console.error(`[cart-sync] attempt ${attempt + 1} failed:`, err);
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

        // Fetch guest cart before clearing local state
        const guestCartData = sessionId
          ? await fetchCart({ sessionId }).catch(() => null)
          : null;

        try {
          useCartStore.getState().clearCart();
          const serverCart = await fetchCart({ userDocumentId });

          if (serverCart?.documentId && serverCart.items?.length) {
            // User has existing cart — merge with guest items
            const resolved = await resolveCartItems(serverCart.items);
            let finalItems = resolved;

            if (guestCartData?.items?.length) {
              const guestResolved = await resolveCartItems(guestCartData.items);
              for (const guestItem of guestResolved) {
                const existingIndex = finalItems.findIndex(
                  (i) => i.productId === guestItem.productId && i.variantId === guestItem.variantId,
                );
                if (existingIndex > -1) {
                  finalItems[existingIndex] = {
                    ...finalItems[existingIndex],
                    quantity: finalItems[existingIndex].quantity + guestItem.quantity,
                  };
                } else {
                  finalItems.push({ ...guestItem });
                }
              }
            }

            useCartStore.getState().replaceCart(serverCart.documentId, finalItems);
          } else if (guestCartData?.items?.length) {
            // No server cart — transfer guest items to user
            const resolved = await resolveCartItems(guestCartData.items);
            if (resolved.length > 0) {
              const resp = await createCart({ userDocumentId, items: resolved });
              if (resp.data?.documentId) {
                useCartStore.getState().setCartDocumentId(resp.data.documentId);
                useCartStore.getState().setItems(resolved);
              }
            }
          }

          // Clean up guest session cart
          if (guestCartData?.documentId) {
            await deleteCart(guestCartData.documentId).catch(() => {});
          }
        } catch {
          if (guestCartData?.items?.length) {
            const resolved = await resolveCartItems(guestCartData.items);
            useCartStore.getState().setItems(resolved);
          }
        }
      })();
    } else if (userDocumentId === null && prev !== null && prev !== undefined) {
      // Logout — switch to guest
      const newSessionId = resetSessionId();
      useCartStore.getState().setSessionId(newSessionId);
      useCartStore.getState().clearCart();
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
