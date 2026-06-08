import { OrderListSkeleton } from "@/components/orders/order-skeleton";

export default function OrdersLoading() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-5">
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-4 w-24 bg-muted rounded mt-2 animate-pulse" />
      </div>
      <OrderListSkeleton />
    </main>
  );
}
