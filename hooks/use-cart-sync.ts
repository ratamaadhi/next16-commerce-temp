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

export function useCartSync(userDocumentId?: string | number | null, isAuthLoading = false) {
  const syncingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef(0);
  const initializedRef = useRef(false);
  const prevUserDocRef = useRef<string | number | null | undefined>(undefined);
  const prevIsAuthLoadingRef = useRef(isAuthLoading);
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
              await updateCart(cartDocumentId, { sessionId: sessionId ?? undefined, userDocumentId: uid ?? undefined, items });
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

  // Initial hydration — waits for auth state to be known, then fetches the right cart
  // (by userDocumentId if logged in, by sessionId if guest) so only one API call is made.
  useEffect(() => {
    if (isAuthLoading) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    const sessionId = getOrCreateSessionId();
    useCartStore.getState().setSessionId(sessionId);

    (async () => {
      try {
        if (userDocumentId) {
          const serverCart = await fetchCart({ userDocumentId });
          if (serverCart?.documentId && serverCart.items?.length) {
            const resolved = await resolveCartItems(serverCart.items);
            useCartStore.getState().replaceCart(serverCart.documentId, resolved);
          }
        } else {
          const cart = await fetchCart({ sessionId });
          if (cart?.documentId && cart.items?.length) {
            const resolved = await resolveCartItems(cart.items);
            useCartStore.getState().replaceCart(cart.documentId, resolved);
          }
        }
      } catch {
        // No cart found or error — start fresh
      }
    })();
  }, [isAuthLoading, userDocumentId]);

  // React to login/logout transitions during an active session
  useEffect(() => {
    const wasAuthLoading = prevIsAuthLoadingRef.current;
    prevIsAuthLoadingRef.current = isAuthLoading;

    const prev = prevUserDocRef.current;
    prevUserDocRef.current = userDocumentId ?? null;

    // Skip on initial mount — hydration effect handles the first fetch
    if (prev === undefined) return;
    if (!initializedRef.current) return;

    if (userDocumentId && userDocumentId !== prev) {
      // Skip when auth just finished loading on page refresh — hydration effect already
      // fetched the user's cart directly, no merge needed
      if (wasAuthLoading) return;

      // Actual login during session — merge guest cart with user cart
      (async () => {
        const sessionId = useCartStore.getState().sessionId;

        const guestCartData = sessionId
          ? await fetchCart({ sessionId }).catch(() => null)
          : null;

        try {
          useCartStore.getState().clearCart();
          const serverCart = await fetchCart({ userDocumentId });

          if (serverCart?.documentId && serverCart.items?.length) {
            const resolved = await resolveCartItems(serverCart.items);
            let finalItems = resolved;

            if (guestCartData?.items?.length && guestCartData.documentId !== serverCart.documentId) {
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
            const resolved = await resolveCartItems(guestCartData.items);
            if (resolved.length > 0) {
              const resp = await createCart({ userDocumentId, items: resolved });
              if (resp.data?.documentId) {
                useCartStore.getState().setCartDocumentId(resp.data.documentId);
                useCartStore.getState().setItems(resolved);
              }
            }
          }

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
    } else if (userDocumentId === null && prev !== null) {
      // Logout — switch to guest session
      const newSessionId = resetSessionId();
      useCartStore.getState().setSessionId(newSessionId);
      useCartStore.getState().clearCart();
    }
  }, [userDocumentId, isAuthLoading]);

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
