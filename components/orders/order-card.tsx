import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/strapi";
import { getStatusBadgeClass } from "./constants";
import type { Order } from "@/lib/orders";
import { Package, Calendar } from "lucide-react";

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const itemCount = order.items?.length ?? 0;

  return (
    <Link href={`/orders/${order.orderNumber}`} className="group block">
      <Card className="group-hover:border-primary/30 group-hover:shadow-[0_4px_16px_rgba(212,163,115,0.12)] group-hover:-translate-y-0.5 transition-all duration-200 p-5 gap-0">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="font-bold text-foreground">
              #{order.orderNumber}
            </span>
            <Badge variant="outline" className={`ml-2 ${getStatusBadgeClass(order.orderStatus ?? "")}`}>
              {order.orderStatus}
            </Badge>
          </div>
          <span className="font-bold text-foreground group-hover:text-primary transition-colors duration-200">
            {formatPrice(order.totalAmount ?? 0, order.currency)}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(order.createdAt ?? "")}
          </span>
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1">
            <Package className="h-3 w-3" />
            {itemCount} item
          </span>
        </div>

        {/* Thumbnails + detail link */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {order.items?.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-background bg-muted text-xs font-medium text-muted-foreground"
                title={item.productName}
              >
                {item.productName?.slice(0, 2).toUpperCase() ?? "?"}
              </div>
            ))}
            {itemCount > 4 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-background bg-muted text-xs text-muted-foreground">
                +{itemCount - 4}
              </div>
            )}
          </div>
          <span className="text-sm text-primary font-medium group-hover:underline">
            Lihat Detail
          </span>
        </div>
      </Card>
    </Link>
  );
}
