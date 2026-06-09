# Inventory Decrement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Decrement product/variant inventory automatically when an order is created.

**Architecture:** Extend `CartItem` with product identifiers (`productDocumentId`, `variantSku`), pass them through checkout to the API route, then call Strapi to decrement inventory after order creation succeeds.

**Tech Stack:** Next.js 15 App Router, Strapi v5 Content API, Zod for server-side validation

---

### Task 1: Extend CartItem Interface

**Files:**
- Modify: `hooks/use-cart.ts:6-21`

- [ ] **Step 1: Add new fields to CartItem**

```typescript
export interface CartItem {
  productId: number;
  productDocumentId: string;
  productSku?: string;
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
  variantSku?: string;
}
```

- [ ] **Step 2: Run tests to check nothing broken**

Run: `pnpm test`
Expected: All 97 tests pass

- [ ] **Step 3: Commit**

```bash
git add hooks/use-cart.ts
git commit -m "feat: add productDocumentId, productSku, variantSku to CartItem"
```

---

### Task 2: Populate New Fields in resolveCartItems

**Files:**
- Modify: `lib/cart-sync.ts:149-215`

- [ ] **Step 1: Update resolveCartItems return value**

Map `productDocumentId`, `productSku` from product, and `variantSku` from variant:

```typescript
return {
  productId: product.id,
  productDocumentId: product.documentId,
  productSku: product.sku,
  name: product.name,
  price: variant?.price ?? product.price,
  quantity: parseInt(item.quantity ?? "1", 10),
  image: product.images?.[0]?.url,
  variantId: item.variantId,
  variantName: variant?.name,
  variantSku: variant?.sku,
  weight: resolvedDims?.weight ?? 500,
  dimensions: resolvedDims,
} as CartItem;
```

Note: `product.sku` may need to be added to `ResolvedProduct` interface (line 122-147) if it's not there yet.

- [ ] **Step 2: Add `sku` to ResolvedProduct interface**

```typescript
interface ResolvedProduct {
  id: number;
  documentId: string;
  name: string;
  sku?: string;
  price: number;
  dimensions?: { ... };
  images?: Array<{ url: string }>;
  variants?: Array<{
    id: number;
    name: string;
    sku?: string;
    price: number;
    inventory?: number;
    dimensions?: { ... };
  }>;
}
```

- [ ] **Step 3: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add lib/cart-sync.ts hooks/use-cart.ts
git commit -m "feat: populate productDocumentId, sku fields in resolveCartItems"
```

---

### Task 3: Send Product Identifiers from Checkout

**Files:**
- Modify: `app/checkout/page.tsx:96-131`

- [ ] **Step 1: Add productDocumentId, productSku, variantSku to checkout items**

```typescript
items: items.map((item) => ({
  productName: item.name,
  productSku: item.productSku,
  productDocumentId: item.productDocumentId,
  quantity: String(item.quantity),
  unitPrice: item.price,
  totalPrice: item.price * item.quantity,
  variantInfo: item.variantName,
  variantSku: item.variantSku,
  imageUrl: item.image ?? undefined,
})),
```

- [ ] **Step 2: Commit**

```bash
git add app/checkout/page.tsx
git commit -m "feat: send productDocumentId and variantSku from checkout"
```

---

### Task 4: Create Inventory Decrement Helper

**Files:**
- Create: `lib/inventory.ts`

- [ ] **Step 1: Create lib/inventory.ts**

```typescript
import { strapiFetch, StrapiError } from "./strapi";

interface OrderItem {
  productDocumentId: string;
  variantSku?: string;
  quantity: number;
}

/**
 * Decrement product and variant inventory after order creation.
 * For variant products: fetch current product, update variant inventory, PUT back.
 * For simple products: direct PUT to update inventory.
 */
export async function decrementInventory(
  items: OrderItem[],
  token: string,
): Promise<void> {
  const errors: string[] = [];

  for (const item of items) {
    try {
      if (item.variantSku) {
        await decrementVariantInventory(
          item.productDocumentId,
          item.variantSku,
          item.quantity,
          token,
        );
      } else {
        await decrementSimpleProductInventory(
          item.productDocumentId,
          item.quantity,
          token,
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Product ${item.productDocumentId}: ${msg}`);
    }
  }

  if (errors.length > 0) {
    console.error("[inventory] Decrement errors:", errors);
  }
}

async function decrementSimpleProductInventory(
  documentId: string,
  quantity: number,
  token: string,
): Promise<void> {
  const response = await strapiFetch<{ data: { inventory?: string } }>(
    `/products/${documentId}`,
  );

  const currentInventory = parseInt(response.data.inventory ?? "0", 10);
  const newInventory = Math.max(0, currentInventory - quantity);

  await strapiFetch(
    `/products/${documentId}`,
    {},
    {
      method: "PUT",
      body: JSON.stringify({ data: { inventory: String(newInventory) } }),
    },
    token,
  );
}

interface VariantItem {
  id: number;
  sku?: string;
  inventory?: string;
}

interface ProductWithVariants {
  documentId: string;
  inventory?: string;
  variants?: VariantItem[];
}

async function decrementVariantInventory(
  productDocumentId: string,
  variantSku: string,
  quantity: number,
  token: string,
): Promise<void> {
  const response = await strapiFetch<{ data: ProductWithVariants }>(
    `/products/${productDocumentId}`,
    { populate: ["variants"] },
  );

  const product = response.data;
  if (!product.variants) {
    throw new Error("Product has no variants");
  }

  const variantIndex = product.variants.findIndex(
    (v) => v.sku === variantSku,
  );
  if (variantIndex === -1) {
    throw new Error(`Variant with SKU ${variantSku} not found`);
  }

  const updatedVariants = product.variants.map((v, i) => {
    if (i !== variantIndex) return v;
    const currentInv = parseInt(v.inventory ?? "0", 10);
    return { ...v, inventory: String(Math.max(0, currentInv - quantity)) };
  });

  await strapiFetch(
    `/products/${productDocumentId}`,
    {},
    {
      method: "PUT",
      body: JSON.stringify({ data: { variants: updatedVariants } }),
    },
    token,
  );
}
```

- [ ] **Step 2: Write tests for inventory helper**

Create `lib/__tests__/inventory.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { decrementInventory } from "../inventory";

// Strapi fetch mock
const mockStrapiFetch = vi.hoisted(() => vi.fn());
vi.mock("../strapi", () => ({
  strapiFetch: mockStrapiFetch,
  StrapiError: class StrapiError extends Error {
    constructor(
      message: string,
      public status: number,
      public details?: unknown,
    ) {
      super(message);
      this.name = "StrapiError";
    }
  },
}));

describe("decrementInventory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("decrements simple product inventory", async () => {
    mockStrapiFetch
      .mockResolvedValueOnce({ data: { inventory: "10" } })
      .mockResolvedValueOnce({ data: { inventory: "8" } });

    await decrementInventory(
      [{ productDocumentId: "doc123", quantity: 2 }],
      "token",
    );

    expect(mockStrapiFetch).toHaveBeenCalledTimes(2);
    const putCall = mockStrapiFetch.mock.calls[1];
    expect(putCall[0]).toBe("/products/doc123");
    expect(putCall[2].method).toBe("PUT");
    expect(JSON.parse(putCall[2].body).data.inventory).toBe("8");
  });

  it("decrements variant inventory", async () => {
    mockStrapiFetch
      .mockResolvedValueOnce({
        data: {
          documentId: "doc123",
          variants: [
            { id: 1, sku: "VAR-RED", inventory: "10" },
            { id: 2, sku: "VAR-BLUE", inventory: "5" },
          ],
        },
      })
      .mockResolvedValueOnce({ data: {} });

    await decrementInventory(
      [{ productDocumentId: "doc123", variantSku: "VAR-RED", quantity: 3 }],
      "token",
    );

    const putCall = mockStrapiFetch.mock.calls[1];
    const body = JSON.parse(putCall[2].body);
    expect(body.data.variants[0].inventory).toBe("7");
    expect(body.data.variants[1].inventory).toBe("5");
  });

  it("does not go below zero", async () => {
    mockStrapiFetch
      .mockResolvedValueOnce({ data: { inventory: "2" } })
      .mockResolvedValueOnce({ data: { inventory: "0" } });

    await decrementInventory(
      [{ productDocumentId: "doc123", quantity: 5 }],
      "token",
    );

    const putCall = mockStrapiFetch.mock.calls[1];
    const body = JSON.parse(putCall[2].body);
    expect(body.data.inventory).toBe("0");
  });
});
```

- [ ] **Step 3: Run tests**

Run: `pnpm test lib/__tests__/inventory.test.ts`
Expected: All 3 tests pass

- [ ] **Step 4: Commit**

```bash
git add lib/inventory.ts lib/__tests__/inventory.test.ts
git commit -m "feat: add inventory decrement helper with tests"
```

---

### Task 5: Wire Inventory Decrement into API Route

**Files:**
- Modify: `app/api/orders/route.ts:1-50`

- [ ] **Step 1: Add decrementInventory call after createOrder**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createOrder, StrapiError } from "@/lib/orders";
import { decrementInventory } from "@/lib/inventory";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const order = await createOrder(
      {
        orderNumber,
        orderStatus: "pending",
        paymentStatus: "pending",
        subtotal: body.subtotal,
        tax: body.tax ?? 0,
        shippingCost: body.shippingCost ?? 0,
        discount: body.discount ?? 0,
        totalAmount: body.totalAmount,
        currency: body.currency || "IDR",
        notes: body.notes,
        items: body.items,
        shippingAddress: body.shippingAddress,
        billingAddress: body.billingAddress,
      },
      token,
    );

    // Decrement inventory after successful order creation
    const inventoryItems = (body.items as Array<Record<string, unknown>>).map(
      (item) => ({
        productDocumentId: String(item.productDocumentId),
        variantSku: item.variantSku ? String(item.variantSku) : undefined,
        quantity: parseInt(String(item.quantity), 10),
      }),
    );
    decrementInventory(inventoryItems, token).catch((err) => {
      console.error("[orders] Failed to decrement inventory:", err);
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof StrapiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/route.ts
git commit -m "feat: wire inventory decrement into order creation API"
```

---

### Task 6: Run Full Test Suite

- [ ] **Step 1: Run all tests**

Run: `pnpm test`
Expected: All 100+ tests pass

- [ ] **Step 2: Run build check**

Run: `pnpm build` or `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: fix type issues after inventory decrement implementation"
```
