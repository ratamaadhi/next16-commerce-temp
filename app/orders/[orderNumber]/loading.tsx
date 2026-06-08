import { OrderDetailSkeleton } from "@/components/orders/order-skeleton";

export default function OrderDetailLoading() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <OrderDetailSkeleton />
    </main>
  );
}
