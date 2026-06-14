"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, getStrapiMedia } from "@/lib/strapi";
import { cn } from "@/lib/utils";
import { ProductConditionBadge } from "@/components/products/product-condition-badge";
import { ProductDiscountBadge } from "@/components/products/product-discount-badge";
import { ThumbnailStrip } from "@/components/products/thumbnail-strip";
import { QuickViewModal } from "@/components/products/quick-view-modal";
import type { ProductData } from "@/lib/products";

interface ProductCardProps {
  product: ProductData;
}

export function ProductCard({ product }: ProductCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasDiscount = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const activeImage = product.images?.[activeImageIndex];

  return (
    <>
      <Card
        className={cn(
          "group/card flex flex-col overflow-hidden h-full transition-all duration-300 ease-out",
          "hover:-translate-y-1 hover:shadow-lg",
          "ring-1 ring-border/50 hover:ring-primary/20",
        )}
      >
        {/* Image Section */}
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary/50">
          <Link href={`/products/${product.slug}`} className="block h-full" tabIndex={-1}>
            {activeImage ? (
              <Image
                src={getStrapiMedia(
                  activeImage?.formats?.large?.url ??
                    activeImage?.formats?.medium?.url ??
                    activeImage.url,
                )}
                alt={activeImage.alternativeText || product.name}
                fill
                className="object-cover transition-transform duration-400 ease-out group-hover/card:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">No Image</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1.5">
              {product.featured && (
                <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                  Featured
                </Badge>
              )}
              {product.condition && <ProductConditionBadge condition={product.condition} />}
            </div>
            <div className="absolute top-2 right-2">
              {hasDiscount && (
                <ProductDiscountBadge
                  originalPrice={product.compareAtPrice!}
                  salePrice={product.price}
                />
              )}
            </div>

            {/* Price Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-3 sm:p-4 pt-8">
              <p className="text-white font-bold text-lg sm:text-xl font-[family-name:var(--font-heading)]">
                {formatPrice(product.price)}
              </p>
              {hasDiscount && (
                <p className="text-white/70 text-xs sm:text-sm line-through">
                  {formatPrice(product.compareAtPrice!)}
                </p>
              )}
            </div>
          </Link>

          {/* Quick View Button (desktop only) — outside Link */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "hidden md:flex items-center gap-2 rounded-full",
              "bg-background/90 hover:bg-background text-foreground shadow-md",
              "px-4 py-2 text-sm font-medium",
              "opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 ease-out",
            )}
          >
            <Eye className="h-4 w-4" />
            Quick View
          </button>
        </div>

        {/* Thumbnail Strip — outside Link */}
        {product.images && product.images.length > 1 && (
          <ThumbnailStrip
            images={product.images}
            activeIndex={activeImageIndex}
            onSelect={setActiveImageIndex}
          />
        )}

        {/* Content Link */}
        <Link href={`/products/${product.slug}`} className="flex-1">
          <div className="p-3 sm:p-4 pt-2 sm:pt-3">
            <h3 className="font-[family-name:var(--font-heading)] font-semibold text-base sm:text-lg line-clamp-1 text-foreground">
              {product.name}
            </h3>
            {product.condition && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {product.condition === "like_new"
                  ? "Like New"
                  : product.condition === "gently_used"
                    ? "Gently Used"
                    : "Well Loved"}
              </p>
            )}
          </div>
        </Link>
      </Card>

      <QuickViewModal product={product} open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
