"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/products/product-image";
import { ShieldCheck, Truck, Package } from "lucide-react";
import { formatPrice } from "@/lib/strapi";
import type { ShippingOption } from "@/lib/shipping";

interface OrderSummaryItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantId?: string;
  variantName?: string;
}

interface OrderSummaryProps {
  items: OrderSummaryItem[];
  subtotal: number;
  tax: number;
  selectedCourier?: ShippingOption | null;
  total: number;
  isSubmitting?: boolean;
  isAuthenticated?: boolean;
  canSubmit?: boolean;
}

export function OrderSummary({ items, subtotal, tax, selectedCourier, total, isSubmitting, isAuthenticated, canSubmit }: OrderSummaryProps) {
  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Package className="size-4" />
            Ringkasan Pesanan
            <span className="text-xs font-normal text-muted-foreground ml-auto">
              {items.length} item
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          <div className="divide-y divide-border px-4 max-h-[320px] overflow-y-auto">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="relative size-12 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                  <ProductImage
                    image={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-snug line-clamp-2">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {item.variantName && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] font-normal leading-none px-1 py-0 h-auto mr-1"
                        >
                          {item.variantName}
                        </Badge>
                      )}
                      <span>Qty: {item.quantity}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatPrice(item.price)}/unit
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="px-4 py-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Pajak (11%)</span>
              <span>{formatPrice(tax)}</span>
            </div>

            <div className="flex justify-between items-start text-xs gap-2">
              <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                <Truck className="size-3" />
                Ongkir
              </div>
              {selectedCourier ? (
                <div className="text-right">
                  <p className="font-medium">{selectedCourier.name}</p>
                  <p className="text-[10px] text-muted-foreground">{selectedCourier.etdNamed}</p>
                  <p className="font-semibold tabular-nums">{formatPrice(selectedCourier.price)}</p>
                </div>
              ) : (
                <span className="text-muted-foreground italic">Pilih kurir</span>
              )}
            </div>
          </div>

          <Separator />

          <div className="px-4 py-3 bg-muted/30">
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <div className="px-4 pt-3 space-y-2">
            <Button
              type="submit"
              className="w-full"
              size="default"
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? "Memproses..." : "Buat Pesanan"}
            </Button>
            {!isAuthenticated && (
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <ShieldCheck className="size-3" />
                Login dulu untuk checkout
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
