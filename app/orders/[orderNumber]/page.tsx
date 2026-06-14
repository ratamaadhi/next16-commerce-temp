import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatDate } from "@/lib/strapi";
import { getOrderByNumber } from "@/lib/orders";
import { getStatusBadgeClass, ORDER_STATUS_TITLES } from "@/components/orders/constants";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { OrderPaymentSection } from "@/components/orders/order-payment-section";
import Image from "next/image";
import { ReviewDialog } from "@/components/reviews/review-dialog";
import { ArrowLeft, MapPin } from "lucide-react";

interface OrderDetailPageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ autoPay?: string }>;
}

export default async function OrderDetailPage({ params, searchParams }: OrderDetailPageProps) {
  const { orderNumber } = await params;
  const { autoPay } = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/auth/login");

  const { data: orders } = await getOrderByNumber(orderNumber, token);
  const order = orders?.[0];

  if (!order) notFound();

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Pesanan #{orderNumber}</h1>
        <Badge variant="outline" className={getStatusBadgeClass(order.orderStatus ?? "")}>
          {ORDER_STATUS_TITLES[order.orderStatus ?? ""] ?? order.orderStatus}
        </Badge>
      </div>

      {/* Hero Timeline */}
      <div className="mb-6">
        <OrderTimeline orderStatus={order.orderStatus} />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: items, shipping, notes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-4">
              Item Pesanan ({order.items?.length ?? 0})
            </h3>
            <div className="divide-y">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground overflow-hidden relative">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName ?? ""}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        item.productName?.slice(0, 2).toUpperCase() ?? "?"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {item.productName}
                      </p>
                      {item.variantInfo && (
                        <p className="text-xs text-muted-foreground">{item.variantInfo}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.unitPrice ?? 0)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-sm text-foreground whitespace-nowrap">
                      {formatPrice(item.totalPrice ?? 0)}
                    </p>
                  </div>
                  {order.orderStatus === "delivered" && item.productDocumentId && (
                    <div className="mt-2">
                      <ReviewDialog
                        productDocumentId={item.productDocumentId}
                        productName={item.productName}
                        orderNumber={orderNumber}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">
                Alamat Pengiriman
              </h3>
              <div className="flex gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm text-foreground space-y-0.5">
                  <p className="font-medium">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
                  <p className="text-muted-foreground">{order.shippingAddress.addressLine1}</p>
                  <p className="text-muted-foreground">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </p>
                  <p className="text-muted-foreground">{order.shippingAddress.country}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">
                Catatan
              </h3>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right: summary */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-card p-5 lg:sticky lg:top-24">
            <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-4">
              Ringkasan
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal</span>
                <span>{formatDate(order.createdAt ?? "")}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal ?? 0, order.currency)}</span>
              </div>
              {(order.tax ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pajak</span>
                  <span>{formatPrice(order.tax ?? 0, order.currency)}</span>
                </div>
              )}
              {(order.shippingCost ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ongkos Kirim</span>
                  <span>{formatPrice(order.shippingCost ?? 0, order.currency)}</span>
                </div>
              )}
              {(order.discount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="text-muted-foreground">Diskon</span>
                  <span>-{formatPrice(order.discount ?? 0, order.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.totalAmount ?? 0, order.currency)}</span>
              </div>
              <Separator />
              <OrderPaymentSection
                orderNumber={orderNumber}
                paymentStatus={order.paymentStatus ?? "pending"}
                orderStatus={order.orderStatus ?? "pending"}
                totalAmount={order.totalAmount ?? 0}
                currency={order.currency}
                snapToken={order.midtransSnapToken ?? null}
                autoPay={autoPay === "true"}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
