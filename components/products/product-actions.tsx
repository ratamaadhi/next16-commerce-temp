"use client";

import { useState } from "react";
import { VariantSelector } from "./variant-selector";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { formatPrice } from "@/lib/strapi";
import type { ProductData } from "@/lib/products";

interface ProductActionsProps {
  product: ProductData;
  variants: ProductData["variants"];
}

export function ProductActions({ product, variants }: ProductActionsProps) {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const selected = selectedVariant !== null ? variants?.[selectedVariant] : null;
  const displayPrice = selected?.price ?? product.price;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        {product.shortDescription && (
          <p className="text-muted-foreground mt-2">{product.shortDescription}</p>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">{formatPrice(displayPrice)}</span>
        {product.compareAtPrice && product.compareAtPrice > displayPrice && (
          <span className="text-lg text-muted-foreground line-through">
            {formatPrice(product.compareAtPrice)}
          </span>
        )}
      </div>

      {variants && variants.length > 0 && (
        <VariantSelector
          variants={variants}
          selectedIndex={selectedVariant}
          onSelect={setSelectedVariant}
        />
      )}

      <AddToCartButton
        productId={product.id}
        productDocumentId={product.documentId}
        productName={product.name}
        price={displayPrice}
        image={product.images?.[0]?.url}
        variantId={selected?.id?.toString()}
        variantName={selected?.name}
        variantSku={selected?.sku}
        dimensions={product.dimensions}
        disabled={
          (selected?.inventory ?? product.inventory ?? 0) <= 0
        }
      />
    </div>
  );
}
