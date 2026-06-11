"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Trash2, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/strapi";
import { ProductImage } from "@/components/products/product-image";
import { useState, useSyncExternalStore } from "react";

const subscribe = (callback: () => void) =>
  useCartStore.persist.onFinishHydration(callback);

const getSnapshot = () => useCartStore.persist.hasHydrated();

const getServerSnapshot = () => false;

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();
  const itemCount = getItemCount();

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={buttonVariants({ variant: "ghost", size: "icon" })}>
        <div className="relative">
          <ShoppingCart className="h-5 w-5" />
          {mounted && itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center ring-2 ring-background">
              {itemCount > 99 ? "99+" : itemCount}
            </span>
          )}
        </div>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-0">
          <SheetTitle className="text-lg">
            Keranjang Belanja
            {mounted && itemCount > 0 && (
              <span className="text-muted-foreground font-normal text-sm ml-1.5">
                {itemCount} item
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {!mounted || !items.length ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="rounded-full bg-muted size-16 flex items-center justify-center mb-4">
              <ShoppingCart className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Keranjang kamu masih kosong</p>
            <Link
              href="/products"
              className={buttonVariants({ className: "mt-5" })}
              onClick={close}
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId ?? "default"}`}
                  className="flex gap-4"
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
                            className="mt-1 text-[10px] font-normal leading-none px-1.5 py-0.5 h-auto"
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
                      <span className="text-[11px] text-muted-foreground">
                        {formatPrice(item.price)} / item
                      </span>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="p-1 text-muted-foreground/50 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t px-6 py-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm font-semibold">{formatPrice(getTotal())}</span>
              </div>
              <Link
                href="/checkout"
                className={buttonVariants({ className: "w-full" })}
                onClick={close}
              >
                Lanjut ke Checkout
              </Link>
              <Link
                href="/cart"
                onClick={close}
                className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                Lihat detail keranjang
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
