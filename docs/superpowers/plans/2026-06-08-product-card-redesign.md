# Product Card Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign ProductCard with elegant & premium styling — thumbnail strip, price overlay, condition/discount badges, quick-view modal, Playfair Display + Inter typography.

**Architecture:** Bottom-up: add data field → build leaf components (badges, thumbnail strip) → redesign ProductCard integrating all pieces → build QuickViewModal → update skeleton. All new components are self-contained with clear interfaces.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Shadcn/ui (base-ui dialog), existing fonts (Playfair Display + Inter), embla-carousel-react (for modal gallery), Vitest + React Testing Library

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/products.ts` | Modify | Add `condition` field |
| `components/products/product-condition-badge.tsx` | Create | Condition tier badge |
| `components/products/product-discount-badge.tsx` | Create | Discount percentage badge |
| `components/products/thumbnail-strip.tsx` | Create | Horizontal thumbnail carousel |
| `components/products/product-card.tsx` | Rewrite | Full redesign integrating all pieces |
| `components/products/quick-view-modal.tsx` | Create | Quick-view modal dialog |
| `components/products/product-grid-skeleton.tsx` | Modify | Match new card layout |
| `components/products/__tests__/product-card.test.tsx` | Create | Component tests |

---

### Task 1: Add `condition` field to ProductData

**Files:**
- Modify: `lib/products.ts:35`

- [ ] **Step 1: Add `condition` field to `ProductData` interface**

Add after `featured?: boolean;` (line 31):

```ts
condition?: "like_new" | "gently_used" | "well_loved";
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -5`
Expected: No errors (or only pre-existing errors unrelated to this change)

- [ ] **Step 3: Commit**

```bash
git add lib/products.ts
git commit -m "feat: add condition field to ProductData type"
```

---

### Task 2: Create `ProductConditionBadge` component

**Files:**
- Create: `components/products/product-condition-badge.tsx`

- [ ] **Step 1: Create the component file**

```tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CONDITION_LABELS: Record<string, string> = {
  like_new: "Like New",
  gently_used: "Gently Used",
  well_loved: "Well Loved",
};

interface ProductConditionBadgeProps {
  condition: "like_new" | "gently_used" | "well_loved";
  className?: string;
}

export function ProductConditionBadge({ condition, className }: ProductConditionBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn("text-xs font-medium", className)}
    >
      {CONDITION_LABELS[condition] || condition}
    </Badge>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -5`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add components/products/product-condition-badge.tsx
git commit -m "feat: add ProductConditionBadge component"
```

---

### Task 3: Create `ProductDiscountBadge` component

**Files:**
- Create: `components/products/product-discount-badge.tsx`

- [ ] **Step 1: Create the component file**

```tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProductDiscountBadgeProps {
  originalPrice: number;
  salePrice: number;
  className?: string;
}

function calcDiscount(original: number, sale: number): number {
  return Math.round(((original - sale) / original) * 100);
}

export function ProductDiscountBadge({ originalPrice, salePrice, className }: ProductDiscountBadgeProps) {
  if (originalPrice <= salePrice) return null;

  const discount = calcDiscount(originalPrice, salePrice);

  return (
    <Badge
      variant="default"
      className={cn("text-xs font-bold", className)}
    >
      -{discount}%
    </Badge>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -5`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add components/products/product-discount-badge.tsx
git commit -m "feat: add ProductDiscountBadge component"
```

---

### Task 4: Create `ThumbnailStrip` component

**Files:**
- Create: `components/products/thumbnail-strip.tsx`

- [ ] **Step 1: Create the component file**

```tsx
"use client";

import Image from "next/image";
import { getStrapiMedia } from "@/lib/strapi";
import { cn } from "@/lib/utils";
import type { StrapiImage } from "@/lib/products";

interface ThumbnailStripProps {
  images: StrapiImage[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function ThumbnailStrip({ images, activeIndex, onSelect }: ThumbnailStripProps) {
  if (!images?.length) return null;

  return (
    <div
      className={cn(
        "flex gap-1.5 px-3 sm:px-4 py-2",
        images.length > 4 && "overflow-x-auto scrollbar-none snap-x snap-mandatory"
      )}
    >
      {images.map((image, index) => (
        <button
          key={image.url}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(index);
          }}
          className={cn(
            "relative h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-md border-2 transition-all duration-300 ease-out snap-start",
            activeIndex === index
              ? "border-primary ring-1 ring-primary/30"
              : "border-transparent hover:border-primary/50"
          )}
        >
          <Image
            src={getStrapiMedia(image.url)}
            alt={image.alternativeText || `Image ${index + 1}`}
            fill
            className="object-cover"
            sizes="48px"
          />
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add `scrollbar-none` utility to `globals.css`**

Add at the end of `app/globals.css`:

```css
/* Hide scrollbar across browsers */
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -5`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add components/products/thumbnail-strip.tsx app/globals.css
git commit -m "feat: add ThumbnailStrip component with horizontal scroll"
```

---

### Task 5: Redesign `ProductCard` component

**Files:**
- Modify: `components/products/product-card.tsx` (full rewrite)

This task integrates all sub-components: badges, thumbnail strip, price overlay, hover effects, quick-view button (placeholder).

- [ ] **Step 1: Rewrite `product-card.tsx`**

```tsx
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
          "ring-1 ring-border/50 hover:ring-primary/20"
        )}
      >
        <Link href={`/products/${product.slug}`} className="flex flex-col h-full">
          {/* Image Section */}
          <div className="relative aspect-[3/4] overflow-hidden bg-secondary/50">
            {activeImage ? (
              <Image
                src={getStrapiMedia(activeImage.url)}
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
                <Badge variant="outline" className="text-xs border-primary/40 text-primary">Featured</Badge>
              )}
              {product.condition && (
                <ProductConditionBadge condition={product.condition} />
              )}
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
              <p className="text-white font-bold text-lg sm:text-xl font-[family-name:var(--font-playfair)]">
                {formatPrice(product.price)}
              </p>
              {hasDiscount && (
                <p className="text-white/70 text-xs sm:text-sm line-through">
                  {formatPrice(product.compareAtPrice!)}
                </p>
              )}
            </div>

            {/* Quick View Button (desktop only) */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                "hidden md:flex items-center gap-2 rounded-full",
                "bg-white/90 hover:bg-white text-foreground shadow-md",
                "px-4 py-2 text-sm font-medium",
                "opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 ease-out"
              )}
            >
              <Eye className="h-4 w-4" />
              Quick View
            </button>
          </div>

          {/* Thumbnail Strip */}
          {product.images && product.images.length > 1 && (
            <ThumbnailStrip
              images={product.images}
              activeIndex={activeImageIndex}
              onSelect={setActiveImageIndex}
            />
          )}

          {/* Content */}
          <div className="flex-1 p-3 sm:p-4 pt-2 sm:pt-3">
            <h3 className="font-[family-name:var(--font-playfair)] font-semibold text-base sm:text-lg line-clamp-1 text-foreground">
              {product.name}
            </h3>
            {product.condition && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {product.condition === "like_new" ? "Like New" : product.condition === "gently_used" ? "Gently Used" : "Well Loved"}
              </p>
            )}
          </div>
        </Link>
      </Card>

      <QuickViewModal
        product={product}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -5`
Expected: Error about `QuickViewModal` not existing yet — expected at this point

- [ ] **Step 3: Commit**

```bash
git add components/products/product-card.tsx
git commit -m "feat: redesign ProductCard with badges, thumbnails, price overlay"
```

---

### Task 6: Create `QuickViewModal` component

**Files:**
- Create: `components/products/quick-view-modal.tsx`

- [ ] **Step 1: Create the modal component file**

```tsx
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

            {/* Image navigation arrows */}
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

            {/* Image dots */}
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

            {/* Badges on image */}
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

              {isLowStock && (
                <p className="text-sm text-amber-600 font-medium">
                  Tersisa {inventory} unit
                </p>
              )}
              {isOutOfStock && (
                <p className="text-sm text-destructive font-medium">
                  Stok Habis
                </p>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <AddToCartButton
                productId={product.id}
                productName={product.name}
                price={displayPrice}
                image={product.images?.[0]?.url}
                variantId={selected?.id?.toString()}
                variantName={selected?.name}
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1`
Expected: No errors (QuickViewModal now resolves)

- [ ] **Step 3: Commit**

```bash
git add components/products/quick-view-modal.tsx
git commit -m "feat: add QuickViewModal with image gallery, variants, add-to-cart"
```

---

### Task 7: Update `ProductGridSkeleton`

**Files:**
- Modify: `components/products/product-grid-skeleton.tsx`

- [ ] **Step 1: Update skeleton to match new card layout**

```tsx
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridSkeletonProps {
  count?: number;
}

export function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-xl ring-1 ring-border/50">
          {/* Main image */}
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          {/* Thumbnail strip */}
          <div className="flex gap-1.5 px-3 sm:px-4 py-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-10 sm:h-12 sm:w-12 rounded-md shrink-0" />
            ))}
          </div>
          {/* Content */}
          <div className="p-3 sm:p-4 pt-2 sm:pt-3 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/products/product-grid-skeleton.tsx
git commit -m "feat: update ProductGridSkeleton to match redesigned card layout"
```

---

### Task 8: Write component tests

**Files:**
- Create: `components/products/__tests__/product-card.test.tsx`

- [ ] **Step 1: Create test file**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "../product-card";
import type { ProductData } from "@/lib/products";

const baseProduct: ProductData = {
  id: 1,
  documentId: "doc-1",
  name: "Test Product",
  slug: "test-product",
  price: 100000,
  images: [
    {
      id: 1,
      documentId: "img-1",
      url: "/uploads/test1.jpg",
      alternativeText: "Test image 1",
      width: 800,
      height: 1067,
    },
    {
      id: 2,
      documentId: "img-2",
      url: "/uploads/test2.jpg",
      alternativeText: "Test image 2",
      width: 800,
      height: 1067,
    },
  ],
};

describe("ProductCard", () => {
  it("renders product name and price", () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("Rp 100.000")).toBeInTheDocument();
  });

  it("shows discount badge and strikethrough price when on sale", () => {
    render(
      <ProductCard
        product={{
          ...baseProduct,
          compareAtPrice: 200000,
        }}
      />
    );
    expect(screen.getByText("-50%")).toBeInTheDocument();
    expect(screen.getByText("Rp 200.000")).toBeInTheDocument();
  });

  it("shows featured badge for featured products", () => {
    render(
      <ProductCard
        product={{ ...baseProduct, featured: true }}
      />
    );
    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("shows condition badge when condition is set", () => {
    render(
      <ProductCard
        product={{ ...baseProduct, condition: "like_new" }}
      />
    );
    expect(screen.getByText("Like New")).toBeInTheDocument();
  });

  it("renders thumbnail strip when multiple images exist", () => {
    render(<ProductCard product={baseProduct} />);
    const thumbnails = screen.getAllByRole("img");
    expect(thumbnails.length).toBe(2);
  });

  it("does not render thumbnail strip for single-image products", () => {
    render(
      <ProductCard
        product={{ ...baseProduct, images: [baseProduct.images![0]] }}
      />
    );
    const thumbnails = screen.queryAllByRole("img");
    expect(thumbnails.length).toBe(1);
  });

  it("links to product detail page", () => {
    render(<ProductCard product={baseProduct} />);
    const links = screen.getAllByRole("link");
    expect(links.some((link) => link.getAttribute("href") === "/products/test-product")).toBe(true);
  });

  it("shows quick-view button on desktop", () => {
    render(<ProductCard product={baseProduct} />);
    expect(screen.getByText("Quick View")).toBeInTheDocument();
  });

  it("shows no-image fallback when images array is empty", () => {
    render(
      <ProductCard product={{ ...baseProduct, images: [] }} />
    );
    expect(screen.getByText("No Image")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run components/products/__tests__/product-card.test.tsx`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add components/products/__tests__/product-card.test.tsx
git commit -m "test: add ProductCard component tests"
```

---

### Task 9: Final verification

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Verify visual output in browser**

Open `http://localhost:3000/products` in browser. Verify:
- Cards show with thumbnail strip, price overlay, badges
- Hover: lift, shadow, image zoom, quick-view button appears
- Thumbnail click swaps main image, active border visible
- Quick-view modal opens/closes with image gallery, price, variants, add-to-cart
- Mobile: quick-view button hidden, everything else works

- [ ] **Step 4: Commit if any final fixes**

```bash
git add -A
git commit -m "chore: final verification — tests pass, build clean"
```
