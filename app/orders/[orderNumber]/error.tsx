"use client";

import { OrderEmptyState } from "@/components/orders/order-empty-state";

export default function OrderDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <OrderEmptyState type="error" onRetry={reset} />
    </main>
  );
}
