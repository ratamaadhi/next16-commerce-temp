# Product Dimensions Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate weight from flat Product field to nested `dimensions` component (length, width, height, weight) at both product and variant level, then use real dimensions for shipping cost calculation.

**Architecture:** Strapi types regenerate moves `weight` → `dimensions.weight` inside `ProductDimensionsComponent`. The cart resolution chain (Strapi → cart-sync → CartItem → shipping utilities → checkout page) must cascade: `variant.dimensions → product.dimensions → default fallback`. The shipping cost API route also gets real item-level dimensions instead of `getDimensionsByWeight` approximations.

**Tech Stack:** Next.js 15 App Router, Strapi 5, Zustand, Vitest, KiriminAja API

---

### Task 1: Update `lib/products.ts` — ProductData interface

**Files:**
- Modify: `lib/products.ts:13-33`
- Test: `lib/__tests__/shipping.test.ts` + `lib/__tests__/cart-sync.test.ts` (existing, should still pass)

- [ ] **Step 1: Replace `weight` with `dimensions` in ProductData**

Current:
```typescript
export interface ProductData {
  // ...
  inventory?: number;
  sku?: string;
  weight?: number;
  images?: StrapiImage[];
  // ...
}
```

Replace with:
```typescript
export interface ProductData {
  // ...
  inventory?: number;
  sku?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
  images?: StrapiImage[];
  // ...
}
```

- [ ] **Step 2: Run existing tests to verify nothing breaks**

```bash
npm test
```
Expected: All tests pass (no tests directly test ProductData weight field).

- [ ] **Step 3: Commit**

```bash
git add lib/products.ts
git commit -m "feat: replace flat weight with dimensions in ProductData"
```

---

### Task 2: Update `lib/cart-sync.ts` — Resolve dimensions with cascade

**Files:**
- Modify: `lib/cart-sync.ts:124-138,159-168,190-199`
- Test: `lib/__tests__/cart-sync.test.ts:238-317`

- [ ] **Step 1: Update `ResolvedProduct` interface**

Replace `weight?: number` with `dimensions`:
```typescript
interface ResolvedProduct {
  id: number;
  documentId: string;
  name: string;
  price: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
  images?: Array<{ url: string }>;
  variants?: Array<{
    id: number;
    name: string;
    price: number;
    sku?: string;
    inventory?: number;
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
      weight?: number;
    };
  }>;
}
```

- [ ] **Step 2: Update populate query**

Line 167:
```typescript
populate: ["images", "variants"],
→
populate: ["images", "variants", "variants.dimensions", "dimensions"],
```

- [ ] **Step 3: Update resolve logic to cascade variant → product → default**

Replace lines 190-199:
```typescript
return {
  productId: product.id,
  name: product.name,
  price: variant?.price ?? product.price,
  quantity: parseInt(item.quantity ?? "1", 10),
  image: product.images?.[0]?.url,
  variantId: item.variantId,
  variantName: variant?.name,
  weight: product.weight,
} as CartItem;
```

With:
```typescript
const variantDims = variant?.dimensions;
const productDims = product.dimensions;
const resolvedDims = variantDims ?? productDims;

return {
  productId: product.id,
  name: product.name,
  price: variant?.price ?? product.price,
  quantity: parseInt(item.quantity ?? "1", 10),
  image: product.images?.[0]?.url,
  variantId: item.variantId,
  variantName: variant?.name,
  weight: resolvedDims?.weight ?? 500,
  dimensions: resolvedDims,
} as CartItem;
```

- [ ] **Step 4: Update test for resolveCartItems — add dimension assertions**

Add new test case in `lib/__tests__/cart-sync.test.ts` after line 276:

```typescript
it("resolves dimensions from variant with fallback to product", async () => {
  const strapiItems = [
    { quantity: "1", variantId: "10" },     // variant has dimensions
    { quantity: "2", variantId: "11" },     // variant has no dims, product has dims
    { quantity: "1", variantId: "12" },     // neither has dims
  ];
  const productData = {
    data: [
      {
        id: 1, documentId: "p1", name: "With Both", price: 100,
        dimensions: { length: 30, width: 20, height: 15, weight: 1500 },
        variants: [
          { id: 10, name: "Var A", price: 100, dimensions: { length: 25, width: 15, height: 10, weight: 800 } },
          { id: 11, name: "Var B", price: 100 },
        ],
      },
      {
        id: 2, documentId: "p2", name: "No Dims", price: 100,
        variants: [{ id: 12, name: "Var C", price: 100 }],
      },
    ],
    meta: {},
  };
  mockStrapiFetch.mockResolvedValueOnce(productData);

  const result = await resolveCartItems(strapiItems);
  expect(result).toHaveLength(3);

  // Variant 10: uses variant dimensions
  expect(result[0].dimensions?.length).toBe(25);
  expect(result[0].dimensions?.weight).toBe(800);
  expect(result[0].weight).toBe(800);

  // Variant 11: no variant dims, falls back to product dims
  expect(result[1].dimensions?.length).toBe(30);
  expect(result[1].dimensions?.weight).toBe(1500);
  expect(result[1].weight).toBe(1500);

  // Variant 12: no dims at all, falls back to default 500
  expect(result[2].dimensions).toBeUndefined();
  expect(result[2].weight).toBe(500);
});
```

- [ ] **Step 5: Run tests**

```bash
npm test
```
Expected: All tests pass, including new dimension cascade test.

- [ ] **Step 6: Commit**

```bash
git add lib/cart-sync.ts lib/__tests__/cart-sync.test.ts
git commit -m "feat: resolve product dimensions with variant→product→default cascade"
```

---

### Task 3: Add dimension utilities to `lib/shipping.ts`

**Files:**
- Modify: `lib/shipping.ts`
- Create new tests in `lib/__tests__/shipping.test.ts`

- [ ] **Step 1: Add `getItemDimensions` and `getCartDimensions` to `lib/shipping.ts`**

Add imports and new types at top of file:
```typescript
import type { CartItem } from "@/hooks/use-cart";

export interface ItemDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
}

export interface CartDimensions {
  weight: number;
  length: number;
  width: number;
  height: number;
}
```

Add utility functions after `getDimensionsByWeight`:
```typescript
export function getItemDimensions(item: CartItem): ItemDimensions {
  const d = item.dimensions;
  return {
    weight: d?.weight ?? 500,
    length: d?.length ?? 20,
    width: d?.width ?? 15,
    height: d?.height ?? 10,
  };
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

- [ ] **Step 2: Add tests for new utilities**

Append to `lib/__tests__/shipping.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getDimensionsByWeight, getItemDimensions, getCartDimensions } from "../shipping";
import type { CartItem } from "@/hooks/use-cart";

describe("getItemDimensions", () => {
  it("returns dimensions from item when available", () => {
    const item: CartItem = {
      productId: 1, name: "Test", price: 100, quantity: 1,
      dimensions: { length: 30, width: 20, height: 10, weight: 2000 },
    };
    expect(getItemDimensions(item)).toEqual({ length: 30, width: 20, height: 10, weight: 2000 });
  });

  it("falls back to defaults when dimensions is undefined", () => {
    const item: CartItem = { productId: 1, name: "Test", price: 100, quantity: 1 };
    expect(getItemDimensions(item)).toEqual({ length: 20, width: 15, height: 10, weight: 500 });
  });

  it("falls back to defaults when dimensions has partial fields", () => {
    const item: CartItem = {
      productId: 1, name: "Test", price: 100, quantity: 1,
      dimensions: { weight: 1000 },
    };
    const dims = getItemDimensions(item);
    expect(dims.weight).toBe(1000);
    expect(dims.length).toBe(20);
    expect(dims.width).toBe(15);
    expect(dims.height).toBe(10);
  });
});

describe("getCartDimensions", () => {
  it("aggregates dimensions from multiple items", () => {
    const items: CartItem[] = [
      { productId: 1, name: "A", price: 100, quantity: 2, dimensions: { length: 25, width: 15, height: 10, weight: 800 } },
      { productId: 2, name: "B", price: 100, quantity: 1, dimensions: { length: 30, width: 20, height: 15, weight: 1500 } },
    ];
    const result = getCartDimensions(items);
    expect(result.weight).toBe(3100); // 800*2 + 1500
    expect(result.length).toBe(30);   // max(25, 30)
    expect(result.width).toBe(20);    // max(15, 20)
    expect(result.height).toBe(35);   // 10*2 + 15
  });

  it("returns zeros for empty items", () => {
    expect(getCartDimensions([])).toEqual({ weight: 0, length: 0, width: 0, height: 0 });
  });

  it("uses defaults for items without dimensions", () => {
    const items: CartItem[] = [
      { productId: 1, name: "A", price: 100, quantity: 2 },
    ];
    const result = getCartDimensions(items);
    expect(result.weight).toBe(1000); // 500*2
    expect(result.length).toBe(20);
    expect(result.width).toBe(15);
    expect(result.height).toBe(20);   // 10*2
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test
```
Expected: All dimension utility tests pass.

- [ ] **Step 4: Commit**

```bash
git add lib/shipping.ts lib/__tests__/shipping.test.ts
git commit -m "feat: add getItemDimensions and getCartDimensions utilities"
```

---

### Task 4: Update `hooks/use-cart.ts` — Add dimensions to CartItem + update getTotalWeight

**Files:**
- Modify: `hooks/use-cart.ts:6-15,94-96`
- Test: `hooks/__tests__/use-cart.test.ts:145-166`

- [ ] **Step 1: Add `dimensions` to CartItem interface**

```typescript
export interface CartItem {
  productId: number;
  name: string;
  price: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
  quantity: number;
  image?: string;
  variantId?: string;
  variantName?: string;
}
```

- [ ] **Step 2: Update `getTotalWeight` to prefer `dimensions.weight`**

```typescript
getTotalWeight: () =>
  get().items.reduce(
    (sum, i) => sum + (i.dimensions?.weight ?? i.weight ?? 500) * i.quantity,
    0,
  ),
```

- [ ] **Step 3: Add test for getTotalWeight with dimensions**

Append to `hooks/__tests__/use-cart.test.ts` after line 165:

```typescript
describe("useCartStore — getTotalWeight with dimensions", () => {
  it("prefers dimensions.weight over flat weight", () => {
    useCartStore.getState().setItems([
      {
        productId: 1, name: "A", price: 100, quantity: 2,
        weight: 100, dimensions: { weight: 300 },
      },
    ]);
    // Should use dimensions.weight (300) instead of flat weight (100)
    expect(useCartStore.getState().getTotalWeight()).toBe(600);
  });

  it("falls back to flat weight when dimensions has no weight", () => {
    useCartStore.getState().setItems([
      {
        productId: 1, name: "A", price: 100, quantity: 2,
        weight: 300, dimensions: { length: 20, width: 15, height: 10 },
      },
    ]);
    // dimensions.weight is undefined, fallback to flat weight (300)
    expect(useCartStore.getState().getTotalWeight()).toBe(600);
  });

  it("falls back to 500 when neither dimensions.weight nor weight exists", () => {
    useCartStore.getState().setItems([
      { productId: 1, name: "A", price: 100, quantity: 2 },
    ]);
    expect(useCartStore.getState().getTotalWeight()).toBe(1000);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npm test
```
Expected: All tests pass, including new dimension weight priority tests.

- [ ] **Step 5: Commit**

```bash
git add hooks/use-cart.ts hooks/__tests__/use-cart.test.ts
git commit -m "feat: add dimensions to CartItem, update getTotalWeight priority"
```

---

### Task 5: Update `app/checkout/page.tsx` — Send real dimensions to shipping API

**Files:**
- Modify: `app/checkout/page.tsx:13,20,45-46,206-211`

- [ ] **Step 1: Replace imports**

Line 13-14:
```typescript
import { getDimensionsByWeight } from "@/lib/shipping";
import type { ShippingOption } from "@/lib/shipping";
→
import { getCartDimensions } from "@/lib/shipping";
import type { ShippingOption } from "@/lib/shipping";
```

- [ ] **Step 2: Update store destructuring**

Line 20:
```typescript
const { items, getTotal, getTotalWeight, clearCart } = useCartStore();
→
const { items, getTotal, clearCart } = useCartStore();
```

- [ ] **Step 3: Replace weight/dimensions calculation**

Lines 45-46:
```typescript
const totalWeight = useMemo(() => getTotalWeight(), [getTotalWeight]);
const dimensions = getDimensionsByWeight(totalWeight);
→
const cartDims = useMemo(() => getCartDimensions(items), [items]);
```

- [ ] **Step 4: Update ShippingOptions props**

Lines 206-211:
```typescript
<ShippingOptions
  destinationId={selectedSubdistrict.id}
  destinationTitle={selectedSubdistrict.title}
  weight={totalWeight}
  length={dimensions.length}
  width={dimensions.width}
  height={dimensions.height}
→
<ShippingOptions
  destinationId={selectedSubdistrict.id}
  destinationTitle={selectedSubdistrict.title}
  weight={cartDims.weight}
  length={cartDims.length}
  width={cartDims.width}
  height={cartDims.height}
```

- [ ] **Step 5: Run build check**

```bash
npm test
```
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/checkout/page.tsx
git commit -m "feat: send real product dimensions to shipping API on checkout"
```

---

### Task 6: Fix `app/api/orders/route.ts` — Use shippingCost from request body

**Files:**
- Modify: `app/api/orders/route.ts:32`

- [ ] **Step 1: Fix hardcoded shippingCost**

Line 32:
```typescript
shippingCost: 0,
→
shippingCost: body.shippingCost ?? 0,
```

- [ ] **Step 2: Run tests**

```bash
npm test
```
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/route.ts
git commit -m "fix: use shippingCost from request body instead of hardcoded 0"
```

---

### Task 7: Final verification

- [ ] **Step 1: Full test suite**

```bash
npm test
```
Expected: All tests pass (42+ tests).

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: No type errors.

- [ ] **Step 3: Build check**

```bash
npm run build
```
Expected: Build succeeds.
