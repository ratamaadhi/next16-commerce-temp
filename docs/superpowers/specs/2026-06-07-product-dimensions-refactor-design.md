# Product Dimensions Refactor

Move weight from flat Product field to nested `dimensions` component (length, width, height, weight) — including variant-level dimensions. Update shipping cost to use real dimensions instead of fallback estimates.

## Background

Strapi schema berubah: `weight` dipindah ke `ProductDimensionsComponent` yang ada di level Product dan ProductVariant. Shipping cost selama ini pakai `weight` flat (yang jadi undefined) dan fallback `getDimensionsByWeight()` yang cuma tebakan.

## Changes

### 1. `lib/products.ts` — Update ProductData interface

Ganti `weight?: number` dengan `dimensions`:

```typescript
export interface ProductData {
  // ...
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
  // ...
}
```

### 2. `lib/cart-sync.ts` — Resolve dimensions dari variant → product → default

**ResolvedProduct interface:**
```
weight?: number  →  dimensions?: { length, width, height, weight }
```

**Populate query (line 167):**
```
populate: ["images", "variants"]  →  populate: ["images", "variants", "variants.dimensions", "dimensions"]
```

**Resolve logic (line 190-199):**
```
weight: product.weight
→
weight: item.dimensions?.weight ?? product.dimensions?.weight ?? 500
dimensions: item.dimensions ?? product.dimensions
```

Priority: `variant.dimensions` → `product.dimensions` → default (500g, dimensions dari `getDimensionsByWeight`)

### 3. `lib/shipping.ts` — Utility `getItemDimensions(item)`

```typescript
export function getItemDimensions(
  item: CartItem,
): { weight: number; length: number; width: number; height: number } {
  const dims = item.dimensions;
  
  // Fallback ke default jika tidak ada dimensions
  return {
    weight: dims?.weight ?? 500,
    length: dims?.length ?? 20,
    width: dims?.width ?? 15,
    height: dims?.height ?? 10,
  };
}
```

### 4. `hooks/use-cart.ts` — Tambah dimensions di CartItem

```typescript
export interface CartItem {
  // ...
  weight?: number;  // keep for backward compat
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
}
```

### 5. `hooks/use-cart.ts` — Update `getTotalWeight` pakai dimensions.weight

```typescript
getTotalWeight: () =>
  get().items.reduce(
    (sum, i) => sum + (i.dimensions?.weight ?? i.weight ?? 500) * i.quantity,
    0,
  ),
```

### 6. `lib/shipping.ts` — Utility `getCartDimensions(items)`

Agregasi dimensi dari semua item di cart untuk dikirim ke API shipping:

```typescript
export interface CartDimensions {
  weight: number;
  length: number;
  width: number;
  height: number;
}

export function getCartDimensions(items: CartItem[]): CartDimensions {
  return items.reduce(
    (acc, item) => {
      const d = getItemDimensions(item);
      return {
        weight: acc.weight + d.weight * item.quantity,
        length: Math.max(acc.length, d.length),
        width: Math.max(acc.width, d.width),
        height: acc.height + d.height * item.quantity,
      };
    },
    { weight: 0, length: 0, width: 0, height: 0 },
  );
}
```

### 7. `app/checkout/page.tsx` — Pakai dimensi real

Ganti `getDimensionsByWeight(totalWeight)` dengan `getCartDimensions(cartItems)`:

```
const totalWeight = useCartStore.getTotalWeight();
const dimensions = getDimensionsByWeight(totalWeight);
→
const cartItems = useCartStore((s) => s.items);
const { weight, length, width, height } = getCartDimensions(cartItems);
```

API call `api/shipping/cost?weight=...&length=...&width=...&height=...` tetap sama, hanya nilainya sekarang real.

### 8. `app/api/orders/route.ts` — Fix shippingCost hardcode

```typescript
// Line 32: shippingCost: 0 → shippingCost: body.shippingCost ?? 0
```
