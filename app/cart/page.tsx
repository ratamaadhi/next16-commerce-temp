"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Minus, Plus, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/strapi";
import { ProductImage } from "@/components/products/product-image";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();
  const router = useRouter();

  if (!items.length) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold mt-4">Keranjang Kosong</h1>
        <p className="text-muted-foreground mt-2">
          Kamu belum menambahkan produk apapun.
        </p>
        <Button className="mt-6" onClick={() => router.push("/products")}>
          Lihat Produk
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Keranjang ({getItemCount()} item)
        </h1>
        <Button variant="ghost" onClick={() => router.push("/products")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Lanjut Belanja
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId ?? "default"}`}
            className="flex gap-4 p-4 bg-card rounded-lg border"
          >
            <div className="relative w-24 h-24 flex-shrink-0">
              <ProductImage
                image={item.image}
                alt={item.name}
                fill
                className="object-cover rounded-md"
                sizes="96px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium line-clamp-1">{item.name}</h3>
              {item.variantName && (
                <p className="text-sm text-muted-foreground">{item.variantName}</p>
              )}
              <p className="font-semibold mt-1">{formatPrice(item.price)}</p>

              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => removeItem(item.productId, item.variantId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      <div className="flex flex-col items-end gap-4">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{formatPrice(getTotal())}</p>
        </div>
        <Button size="lg" onClick={() => router.push("/checkout")}>
          Lanjut ke Checkout
        </Button>
      </div>
    </main>
  );
}
