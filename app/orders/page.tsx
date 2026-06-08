import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getOrders } from "@/lib/orders";
import { OrderFilterBar } from "@/components/orders/order-filter-bar";
import { OrderCard } from "@/components/orders/order-card";
import { OrderListSkeleton } from "@/components/orders/order-skeleton";
import { OrderEmptyState } from "@/components/orders/order-empty-state";

interface OrdersPageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

function filterOrders(orders: Awaited<ReturnType<typeof getOrders>>["data"], status: string, q: string) {
  if (!orders) return [];
  let filtered = orders;
  if (status) {
    filtered = filtered.filter((o) => o.orderStatus === status);
  }
  if (q) {
    const search = q.toLowerCase();
    filtered = filtered.filter((o) => o.orderNumber?.toLowerCase().includes(search));
  }
  return filtered;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/auth/login");

  const params = await searchParams;
  const status = params.status ?? "";
  const q = params.q ?? "";

  const { data: orders } = await getOrders(token);
  const filtered = filterOrders(orders, status, q);

  const hasActiveFilter = status !== "" || q !== "";

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pesanan Saya</h1>
          {orders && (
            <p className="text-sm text-muted-foreground mt-1">
              {filtered?.length ?? 0} pesanan{hasActiveFilter && (orders?.length !== filtered?.length) && ` dari ${orders?.length}`}
            </p>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <OrderFilterBar />
      </Suspense>

      {!filtered?.length ? (
        <OrderEmptyState type={hasActiveFilter ? "filter-empty" : "empty"} />
      ) : (
        <div className="space-y-3">
          {filtered.map((order, idx) => (
            <div
              key={order.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${idx * 80}ms`, opacity: 0 }}
            >
              <OrderCard order={order} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
