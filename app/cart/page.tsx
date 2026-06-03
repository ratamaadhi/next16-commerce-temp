"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/strapi";
import { ProductImage } from "@/components/products/product-image";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();
  const subtotal = getTotal();

  if (!items.length) {
    return (
      <main className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
            <h1 className="text-2xl font-bold mt-6">Keranjang Kosong</h1>
            <p className="text-muted-foreground mt-2 text-center">
              Kamu belum menambahkan produk apapun ke keranjang.
            </p>
            <Link href="/products" className={buttonVariants({ className: "mt-6" })}>
              Lihat Produk
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Keranjang Belanja</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {getItemCount()} item
          </p>
        </div>
        <Link href="/products" className={buttonVariants({ variant: "ghost" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Lanjut Belanja
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const itemSubtotal = item.price * item.quantity;
            return (
              <Card key={`${item.productId}-${item.variantId ?? "default"}`}>
                <CardContent className="flex gap-4 p-4">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    <ProductImage
                      image={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                          {item.variantName && (
                            <Badge variant="secondary" className="mt-1 text-xs font-normal">
                              {item.variantName}
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold text-sm whitespace-nowrap">
                          {formatPrice(itemSubtotal)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1, item.variantId)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-10 text-center text-sm font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1, item.variantId)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {formatPrice(item.price)} / item
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.productId, item.variantId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">Ringkasan Belanja</h2>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimasi Ongkir</span>
                  <span>—</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <Link href="/checkout" className={buttonVariants({ className: "w-full", size: "lg" })}>
                Lanjut ke Checkout
              </Link>
              <p className="text-xs text-muted-foreground text-center">
                Ongkir dan pajak akan dihitung saat checkout
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
