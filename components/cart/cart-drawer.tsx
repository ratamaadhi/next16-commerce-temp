"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Trash2, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/strapi";
import { ProductImage } from "@/components/products/product-image";

export function CartDrawer() {
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();
  const itemCount = getItemCount();

  return (
    <Sheet>
      <SheetTrigger className={buttonVariants({ variant: "ghost", size: "icon" })}>
        <div className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center ring-2 ring-background">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </div>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            Keranjang
            {itemCount > 0 && (
              <span className="text-muted-foreground font-normal text-sm ml-1">
                ({itemCount} item)
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {!items.length ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Keranjang kosong</p>
            <Link href="/products" className={buttonVariants({ variant: "outline", className: "mt-4" })}>
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId ?? "default"}`}
                  className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                    <ProductImage
                      image={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {item.variantName && (
                      <p className="text-xs text-muted-foreground">{item.variantName}</p>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1, item.variantId)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1, item.variantId)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-xs font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatPrice(getTotal())}</span>
              </div>
              <Link href="/checkout" className={buttonVariants({ className: "w-full", size: "lg" })}>
                Checkout
              </Link>
              <Link href="/cart" className={buttonVariants({ variant: "outline", className: "w-full", size: "sm" })}>
                Lihat Keranjang
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
