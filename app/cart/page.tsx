"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
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
        <div className="max-w-sm mx-auto text-center">
          <div className="rounded-full bg-muted size-16 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Keranjang Kosong</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kamu belum menambahkan produk apapun.
          </p>
          <Link href="/products" className={buttonVariants({ className: "mt-5" })}>
            Lihat Produk
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Keranjang Belanja</h1>
          <p className="text-sm text-muted-foreground">{getItemCount()} item</p>
        </div>
        <Link href="/products" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="mr-1.5 size-3.5" />
          Lanjut Belanja
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 divide-y divide-border">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId ?? "default"}`}
              className="flex gap-3 py-4 first:pt-0 last:pb-0"
            >
              <div className="relative size-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                <ProductImage
                  image={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug line-clamp-1">{item.name}</p>
                    {item.variantName && (
                      <Badge
                        variant="secondary"
                        className="mt-0.5 text-[10px] font-normal leading-none px-1.5 py-0.5 h-auto"
                      >
                        {item.variantName}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-semibold whitespace-nowrap">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="inline-flex items-center gap-0.5 border rounded-md">
                    <button
                      className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-l-sm"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1, item.variantId)
                      }
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-medium tabular-nums select-none">
                      {item.quantity}
                    </span>
                    <button
                      className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-r-sm disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1, item.variantId)
                      }
                      disabled={item.maxQuantity !== undefined && item.quantity >= item.maxQuantity}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground">
                      {formatPrice(item.price)} / item
                    </span>
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-3 rounded-lg border p-4">
            <p className="font-semibold text-sm">Ringkasan</p>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ongkir</span>
                <span className="text-muted-foreground">—</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <Link href="/checkout" className={buttonVariants({ className: "w-full" })}>
              Checkout
            </Link>
            <p className="text-[11px] text-muted-foreground text-center">
              Ongkir & pajak dihitung saat checkout
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
