"use client";

import { useState } from "react";
import { VariantSelector } from "./variant-selector";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductConditionBadge } from "@/components/products/product-condition-badge";
import { formatPrice } from "@/lib/strapi";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import type { ProductData } from "@/lib/products";

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="size-4 shrink-0"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function buildWhatsAppUrl(whatsappNumber: string, productName: string): string {
  const message = `Halo, saya ingin bertanya tentang produk: ${productName}`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

interface ProductActionsProps {
  product: ProductData;
  variants: ProductData["variants"];
}

export function ProductActions({ product, variants }: ProductActionsProps) {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const selected =
    selectedVariant !== null ? variants?.[selectedVariant] : null;
  const displayPrice = selected?.price ?? product.price;
  const hasVariants = !!(variants && variants.length > 0);
  const needsVariant = hasVariants && selectedVariant === null;
  const { whatsappNumber } = useStoreSettings();

  const inventory = Number(selected?.inventory ?? product.inventory ?? 0);
  const isOutOfStock = inventory <= 0;
  const isLowStock = !isOutOfStock && inventory <= 5;
  const hasDiscount =
    product.compareAtPrice != null && product.compareAtPrice > displayPrice;

  return (
    <div className="py-6 sm:py-8">
      <header className="pb-5 space-y-3">
        {product.condition && (
          <ProductConditionBadge condition={product.condition} />
        )}
        <h1
          className={cn(
            "font-[family-name:var(--font-playfair)] font-semibold",
            "text-3xl sm:text-4xl leading-[1.1] tracking-tight",
            "text-foreground text-balance",
          )}
        >
          {product.name}
        </h1>
        {product.shortDescription && (
          <p className="text-muted-foreground text-base leading-relaxed max-w-prose">
            {product.shortDescription}
          </p>
        )}
      </header>

      <div className="py-5">
        <div className="flex items-baseline gap-3">
          <span
            className={cn(
              "font-[family-name:var(--font-playfair)] font-semibold",
              "text-3xl tracking-tight text-foreground",
            )}
          >
            {formatPrice(displayPrice)}
          </span>
          {hasDiscount && (
            <span className="text-base text-muted-foreground line-through">
              <span className="sr-only">Harga normal </span>
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </div>
        {isLowStock && (
          <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-warning-foreground">
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full bg-warning-foreground"
            />
            Sisa {inventory} unit — hampir habis
          </p>
        )}
        {isOutOfStock && (
          <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-destructive">
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-full bg-destructive"
            />
            Stok Habis
          </p>
        )}
      </div>

      {variants && variants.length > 0 && (
        <div className="py-5">
          <VariantSelector
            variants={variants}
            selectedIndex={selectedVariant}
            onSelect={setSelectedVariant}
          />
        </div>
      )}

      <div className="space-y-3 border-t border-border pt-6">
        <AddToCartButton
          productId={product.id}
          productDocumentId={product.documentId}
          productName={product.name}
          price={displayPrice}
          image={
            product.images?.[0]?.formats?.small?.url ?? product.images?.[0]?.url
          }
          variantId={selected?.id?.toString()}
          variantName={selected?.name}
          variantSku={selected?.sku}
          dimensions={product.dimensions}
          needsVariant={needsVariant}
          maxQuantity={inventory > 0 ? inventory : undefined}
          disabled={needsVariant || isOutOfStock}
        />

        <div className="flex items-stretch gap-3">
          <WishlistButton
            productDocumentId={product.documentId}
            variant="detail"
          />

          {whatsappNumber && (
            <a
              href={buildWhatsAppUrl(whatsappNumber, product.name)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "flex-1 gap-2",
                "border-2 hover:border-primary/40 hover:bg-secondary/40",
                "h-9 px-5",
              )}
            >
              <WhatsAppIcon />
              Tanyakan Produk
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
