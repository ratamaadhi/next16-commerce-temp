"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatPrice, getStrapiMedia } from "@/lib/strapi";
import { cn } from "@/lib/utils";
import { ProductConditionBadge } from "@/components/products/product-condition-badge";
import { ProductDiscountBadge } from "@/components/products/product-discount-badge";
import { VariantSelector } from "@/components/products/variant-selector";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import type { ProductData } from "@/lib/products";

interface QuickViewModalProps {
  product: ProductData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickViewModal({ product, open, onOpenChange }: QuickViewModalProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);

  const images = product.images ?? [];
  const activeImage = images[imageIndex];
  const variants = product.variants ?? [];
  const selected = selectedVariant !== null ? variants[selectedVariant] : null;
  const displayPrice = selected?.price ?? product.price;
  const hasDiscount = product.compareAtPrice != null && product.compareAtPrice > displayPrice;
  const inventory = selected?.inventory ?? product.inventory ?? 0;
  const isOutOfStock = inventory <= 0;
  const isLowStock = inventory > 0 && inventory <= 5;

  const prevImage = () => setImageIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const nextImage = () => setImageIndex((i) => (i < images.length - 1 ? i + 1 : 0));

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setImageIndex(0);
      setSelectedVariant(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="max-w-lg sm:max-w-xl lg:max-w-2xl p-0 overflow-hidden"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex flex-col lg:flex-row max-h-[85vh]">
          {/* Image Gallery */}
          <div className="relative lg:w-1/2 shrink-0 bg-secondary/30">
            {activeImage ? (
              <div className="relative aspect-[3/4] lg:aspect-auto lg:h-full lg:min-h-[400px]">
                <Image
                  src={getStrapiMedia(activeImage.url)}
                  alt={activeImage.alternativeText || product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center aspect-[3/4] lg:aspect-auto lg:h-full lg:min-h-[400px]">
                <span className="text-muted-foreground text-sm">No Image</span>
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-1.5 shadow-md transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-1.5 shadow-md transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    className={cn(
                      "h-2 w-2 rounded-full transition-all duration-300",
                      i === imageIndex ? "bg-primary w-4" : "bg-white/70 hover:bg-white"
                    )}
                  />
                ))}
              </div>
            )}

            <div className="absolute top-3 left-3 flex gap-2">
              {product.condition && (
                <ProductConditionBadge condition={product.condition} />
              )}
              {hasDiscount && (
                <ProductDiscountBadge
                  originalPrice={product.compareAtPrice!}
                  salePrice={displayPrice}
                />
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col flex-1 p-4 sm:p-6 overflow-y-auto">
            <div className="flex-1 space-y-4">
              <div>
                <DialogTitle className="text-lg sm:text-xl font-[family-name:var(--font-playfair)] font-semibold">
                  {product.name}
                </DialogTitle>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(displayPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.compareAtPrice!)}
                  </span>
                )}
              </div>

              {product.shortDescription && (
                <DialogDescription>
                  {product.shortDescription}
                </DialogDescription>
              )}

              {variants.length > 0 && (
                <VariantSelector
                  variants={variants}
                  selectedIndex={selectedVariant}
                  onSelect={setSelectedVariant}
                />
              )}

              {variants.length === 0 && isLowStock && (
                <p className="text-sm text-amber-600 font-medium">
                  Tersisa {inventory} unit
                </p>
              )}
              {variants.length === 0 && isOutOfStock && (
                <p className="text-sm text-destructive font-medium">
                  Stok Habis
                </p>
              )}
            </div>

            <div className="mt-6 space-y-3">
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
                disabled={isOutOfStock}
              />

              <Link
                href={`/products/${product.slug}`}
                className="block text-center text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
                onClick={() => onOpenChange(false)}
              >
                Lihat Detail Lengkap
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
