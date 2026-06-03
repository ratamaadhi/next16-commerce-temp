"use client";

import { useCartSync } from "@/hooks/use-cart-sync";
import { useAuth } from "@/hooks/use-auth";

export function CartSync() {
  const { user } = useAuth();
  useCartSync(user?.documentId ?? null);
  return null;
}
