import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/strapi";
import { getOrders } from "@/lib/orders";
import type { Order } from "@/lib/orders";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/auth/login");

  const { data: orders } = await getOrders(token);
  console.log("orders", orders);

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Pesanan Saya</h1>

      {!orders?.length ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">Belum ada pesanan</p>
            <Link href="/products" className={buttonVariants()}>
              Mulai Belanja
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">
                  <Link
                    href={`/orders/${order.orderNumber}`}
                    className="hover:text-primary transition-colors"
                  >
                    #{order.orderNumber}
                  </Link>
                </CardTitle>
                <Badge className={STATUS_COLORS[order.orderStatus ?? ""] || ""}>
                  {order.orderStatus}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">{formatDate(order.createdAt ?? "")}</p>
                    <p>{order.items?.length || 0} item</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {formatPrice(order.totalAmount ?? 0, order.currency)}
                    </p>
                    <Link
                      href={`/orders/${order.orderNumber}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Lihat Detail
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
