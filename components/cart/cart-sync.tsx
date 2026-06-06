"use client";

import { useCartSync } from "@/hooks/use-cart-sync";
import { useAuth } from "@/hooks/use-auth";

export function CartSync() {
  const { user, isLoading } = useAuth();
  useCartSync(user?.documentId ?? null, isLoading);
  return null;
}
