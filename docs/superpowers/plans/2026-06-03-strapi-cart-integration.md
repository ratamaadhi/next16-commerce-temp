# Strapi 5 Cart API Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Strapi 5 `/api/carts` REST API with the existing Zustand cart store, implementing hybrid reactive sync (Zustand for optimistic UI, background sync to Strapi for persistence).

**Architecture:** `useCartSync` hook runs in root providers, hydrates Zustand from Strapi on mount, subscribes to Zustand changes via debounced callback, and pushes cart mutations to Strapi. Guest users identified by UUID `sessionId` stored in `cart-session` cookie. Authenticated users identified by `users_permissions_user` `documentId`. On login, guest cart merges into server cart by `variantId` deduplication.

**Tech Stack:** Next.js 16.2 App Router, Zustand 5, Strapi 5 REST API, Vitest + jsdom

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/cart-session.ts` | **ALREADY CREATED** | Session ID UUID generation + cookie management |
| `lib/__tests__/cart-session.test.ts` | **ALREADY CREATED** | 7 tests, all passing |
| `lib/cart-sync.ts` | **CREATE** | `fetchCart`, `createCart`, `updateCart`, `deleteCart`, `resolveCartItems` + internal helpers |
| `lib/__tests__/cart-sync.test.ts` | **CREATE** | Unit tests for all cart sync functions |
| `hooks/use-cart.ts` | **MODIFY** | Add `sessionId`, `cartDocumentId`, `setItems`, `mergeItems`, `mergeCart`, `replaceCart` to Zustand store |
| `hooks/__tests__/use-cart.test.ts` | **CREATE** | Tests for modified store (merge, replace, setItems) |
| `hooks/use-cart-sync.ts` | **CREATE** | Custom hook: hydration from Strapi → Zustand, debounced sync to Strapi |
| `hooks/__tests__/use-cart-sync.test.ts` | **CREATE** | Tests for sync hook behavior |
| `providers/providers.tsx` | **MODIFY** | Import and mount `<CartSync />` wrapper inside Providers |

---

## Design Decisions Summary (from grill-me)

| # | Decision |
|---|----------|
| 1 | Guest → UUID sessionId in cookie `cart-session`; authenticated → user `documentId` |
| 2 | Hybrid reactive sync: Zustand optimistic UI + debounced background sync to Strapi |
| 3 | Strapi receives `variantId` + `quantity` only; Zustand stores enriched product data |
| 4 | Call Strapi directly from client via `strapiFetch()` |
| 5 | Login merges guest cart into server cart (dedupe by variantId) |
| 6 | Sync failure → retry (3x exponential backoff) + toast warning; no UI rollback |
| 7 | `sessionId` stored in cookie `cart-session` with 7-day expiry |
| 8 | Lazy create: POST `/carts` on first `addItem` |
| 9 | Hydrate from Strapi on app init and after login |
| 10 | `expiresAt` not used; no cron cleanup |
| 11 | Standard Strapi REST filtering assumed |
| 12 | Logic in custom hook `useCartSync` |
| 13 | Logout → switch to guest sessionId |
| 14 | Quantity: number in Zustand, serialized to string for Strapi |
| 15 | Debounce 500ms for sync |
| 16 | All ID references use `documentId` |

---

## API Reference (from `types/strapi.d.ts`)

### GET /carts
```ts
// query params: sort, pagination[withCount|page|pageSize|start|limit], fields, populate, filters, locale
// response: CartListResponse { data?: Cart[], meta?: { pagination: {...} } }
```

### POST /carts
```ts
// body: CartRequest { data: { sessionId?, expiresAt?, users_permissions_user?, items?: ProductCartItemComponent[], locale?, localizations? } }
// response: CartResponse { data?: Cart, meta?: {} }
```

### GET /carts/{id}
```ts
// path: id (string = documentId)
// response: CartResponse
```

### PUT /carts/{id}
```ts
// path: id (string = documentId)
// body: CartRequest
// response: CartResponse
```

### DELETE /carts/{id}
```ts
// path: id (string = documentId)
// response: number (deleted count)
```

### Key Types
```ts
// ProductCartItemComponent — what Strapi stores per cart item
// { id?: string | number; quantity?: string; variantId?: string }

// Cart — full cart response
// { id?: string | number; documentId?: string; sessionId?: string; expiresAt?: string;
//   users_permissions_user?: { id?, documentId?, username?, ... };
//   items?: ProductCartItemComponent[]; createdAt?; updatedAt?; ... }

// CartItem — what Zustand stores per item (enriched)
// { productId: number; name: string; price: number; quantity: number;
//   image?: string; variantId?: string; variantName?: string }
```

---

### Task 1: Cart Sync API Functions — `lib/cart-sync.ts`

**Files:**
- Create: `lib/cart-sync.ts`
- Create: `lib/__tests__/cart-sync.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/cart-sync.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchCart, createCart, updateCart, deleteCart, resolveCartItems } from "../cart-sync";

const mockStrapiFetch = vi.fn();
vi.mock("../strapi", () => ({
  strapiFetch: (...args: unknown[]) => mockStrapiFetch(...args),
  STRAPI_URL: "http://localhost:1337",
}));

describe("fetchCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when cart not found (404)", async () => {
    mockStrapiFetch.mockRejectedValueOnce({ status: 404 });
    const result = await fetchCart({ sessionId: "unknown-session" });
    expect(result).toBeNull();
  });

  it("returns first cart when found by sessionId", async () => {
    const mockCart = { documentId: "abc123", sessionId: "ses-1", items: [] };
    mockStrapiFetch.mockResolvedValueOnce({ data: [mockCart], meta: {} });
    const result = await fetchCart({ sessionId: "ses-1" });
    expect(result).toEqual(mockCart);
    expect(mockStrapiFetch).toHaveBeenCalledWith("/carts", expect.objectContaining({
      filters: { sessionId: { $eq: "ses-1" } },
      populate: "*",
    }));
  });

  it("returns first cart when found by userDocumentId", async () => {
    const mockCart = { documentId: "cart456", items: [] };
    mockStrapiFetch.mockResolvedValueOnce({ data: [mockCart], meta: {} });
    const result = await fetchCart({ userDocumentId: "user-xyz" });
    expect(result).toEqual(mockCart);
    expect(mockStrapiFetch).toHaveBeenCalledWith("/carts", expect.objectContaining({
      filters: { users_permissions_user: { documentId: { $eq: "user-xyz" } } },
    }));
  });

  it("returns null when data array is empty", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: [], meta: {} });
    const result = await fetchCart({ sessionId: "ses" });
    expect(result).toBeNull();
  });

  it("passes auth token when provided", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: [], meta: {} });
    await fetchCart({ sessionId: "ses" }, "my-token");
    expect(mockStrapiFetch).toHaveBeenCalledWith(
      "/carts", expect.anything(), expect.anything(), "my-token"
    );
  });
});

describe("createCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts a new cart and returns the response", async () => {
    const mockResponse = { data: { documentId: "new-cart", sessionId: "ses-1", items: [] } };
    mockStrapiFetch.mockResolvedValueOnce(mockResponse);

    const result = await createCart({
      sessionId: "ses-1",
      items: [{ variantId: "variant-1", quantity: 2 }],
    });
    expect(result).toEqual(mockResponse);
    expect(mockStrapiFetch).toHaveBeenCalledWith("/carts", {}, {
      method: "POST",
      body: JSON.stringify({
        data: {
          sessionId: "ses-1",
          items: [{ variantId: "variant-1", quantity: "2" }],
        },
      }),
    }, undefined);
  });

  it("includes userDocumentId when provided", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: { documentId: "cart" } });
    await createCart({
      userDocumentId: "user-abc",
      items: [],
    });
    expect(mockStrapiFetch).toHaveBeenCalledWith("/carts", {}, {
      method: "POST",
      body: JSON.stringify({
        data: {
          users_permissions_user: "user-abc",
          items: [],
        },
      }),
    }, undefined);
  });
});

describe("updateCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("puts updated cart data", async () => {
    const mockResponse = { data: { documentId: "cart-1", items: [] } };
    mockStrapiFetch.mockResolvedValueOnce(mockResponse);

    await updateCart("cart-1", {
      items: [{ variantId: "v1", quantity: 3 }],
      sessionId: "ses-1",
    });
    expect(mockStrapiFetch).toHaveBeenCalledWith("/carts/cart-1", {}, {
      method: "PUT",
      body: JSON.stringify({
        data: {
          sessionId: "ses-1",
          items: [{ variantId: "v1", quantity: "3" }],
        },
      }),
    }, undefined);
  });

  it("includes userDocumentId when provided", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: {} });
    await updateCart("cart-doc", { userDocumentId: "user-1", items: [] });
    expect(mockStrapiFetch).toHaveBeenCalledWith("/carts/cart-doc", {}, {
      method: "PUT",
      body: JSON.stringify({
        data: {
          users_permissions_user: "user-1",
          items: [],
        },
      }),
    }, undefined);
  });
});

describe("deleteCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends delete request for cart documentId", async () => {
    mockStrapiFetch.mockResolvedValueOnce(1);
    await deleteCart("cart-to-delete");
    expect(mockStrapiFetch).toHaveBeenCalledWith("/carts/cart-to-delete", {}, {
      method: "DELETE",
    }, undefined);
  });
});

describe("resolveCartItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array for empty items", async () => {
    const result = await resolveCartItems([]);
    expect(result).toEqual([]);
  });

  it("resolves variantId to product details", async () => {
    const strapiItems = [
      { quantity: "2", variantId: "variant-doc-1" },
    ];
    const productData = {
      data: [{
        id: 1,
        documentId: "prod-doc-1",
        name: "Test Product",
        price: 10000,
        images: [{ url: "/uploads/img.jpg" }],
        variants: [{ id: 5, name: "Red", price: 10000, sku: "SKU-1" }],
      }],
      meta: {},
    };
    mockStrapiFetch.mockResolvedValueOnce(productData);

    const result = await resolveCartItems(strapiItems);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      productId: 1,
      name: "Test Product",
      price: 10000,
      quantity: 2,
      image: "/uploads/img.jpg",
      variantId: "variant-doc-1",
      variantName: "Red",
    });
  });

  it("returns basic item when product not found for variantId", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: [], meta: {} });
    const result = await resolveCartItems([{ quantity: "1", variantId: "unknown" }]);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/__tests__/cart-sync.test.ts`
Expected: FAIL — module `../cart-sync` not found

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/cart-sync.ts
import { strapiFetch } from "./strapi";
import { StrapiError } from "./strapi";
import type { components } from "@/types/strapi";
import type { CartItem } from "@/hooks/use-cart";

type CartResponse = components["schemas"]["CartResponse"];
type Cart = components["schemas"]["Cart"];
type CartListResponse = components["schemas"]["CartListResponse"];
type ProductCartItemComponent = components["schemas"]["ProductCartItemComponent"];

export interface FetchCartParams {
  sessionId?: string;
  userDocumentId?: string;
}

function mapItems(items: CartItem[]): Array<{ variantId: string; quantity: string }> {
  return items.map((item) => ({
    variantId: item.variantId ?? "default",
    quantity: String(item.quantity),
  }));
}

export async function fetchCart(
  params: FetchCartParams,
  token?: string,
): Promise<Cart | null> {
  const filters: Record<string, unknown> = {};
  if (params.sessionId) {
    filters["sessionId"] = { $eq: params.sessionId };
  }
  if (params.userDocumentId) {
    filters["users_permissions_user"] = { documentId: { $eq: params.userDocumentId } };
  }
  try {
    const response = await strapiFetch<CartListResponse>(
      "/carts",
      { filters, populate: "*" },
      {},
      token,
    );
    return response.data?.[0] ?? null;
  } catch (error) {
    if (error instanceof StrapiError && error.status === 404) return null;
    throw error;
  }
}

export async function createCart(
  data: {
    sessionId?: string;
    userDocumentId?: string;
    items: CartItem[];
  },
  token?: string,
): Promise<CartResponse> {
  const body: Record<string, unknown> = {};
  if (data.sessionId) body.sessionId = data.sessionId;
  if (data.userDocumentId) body.users_permissions_user = data.userDocumentId;
  body.items = mapItems(data.items);

  return strapiFetch<CartResponse>("/carts", {}, {
    method: "POST",
    body: JSON.stringify({ data: body }),
  }, token);
}

export async function updateCart(
  documentId: string,
  data: {
    sessionId?: string;
    userDocumentId?: string;
    items?: CartItem[];
  },
  token?: string,
): Promise<CartResponse> {
  const body: Record<string, unknown> = {};
  if (data.sessionId) body.sessionId = data.sessionId;
  if (data.userDocumentId) body.users_permissions_user = data.userDocumentId;
  if (data.items) body.items = mapItems(data.items);

  return strapiFetch<CartResponse>(`/carts/${documentId}`, {}, {
    method: "PUT",
    body: JSON.stringify({ data: body }),
  }, token);
}

export async function deleteCart(
  documentId: string,
  token?: string,
): Promise<number> {
  return strapiFetch<number>(`/carts/${documentId}`, {}, {
    method: "DELETE",
  }, token);
}

interface ResolvedProduct {
  id: number;
  documentId: string;
  name: string;
  price: number;
  images?: Array<{ url: string }>;
  variants?: Array<{
    id: number;
    name: string;
    price: number;
    sku?: string;
    inventory?: number;
  }>;
}

export async function resolveCartItems(
  strapiItems: ProductCartItemComponent[],
): Promise<CartItem[]> {
  if (!strapiItems.length) return [];

  const variantIds = strapiItems.map((i) => i.variantId).filter(Boolean) as string[];
  if (!variantIds.length) return [];

  // Query products that contain these variant component IDs
  // Note: Strapi 5 filter on component IDs
  const filters: Record<string, unknown> = {};
  variantIds.forEach((vid, index) => {
    filters[`$or`] = filters[`$or`] || [];
    (filters[`$or`] as Array<Record<string, unknown>>).push({
      variants: { id: { $eq: parseInt(vid) } },
    });
  });

  interface ProductResponse {
    data: ResolvedProduct[];
    meta: Record<string, unknown>;
  }

  try {
    const response = await strapiFetch<ProductResponse>("/products", {
      filters: filters["$or"] ? { $or: filters["$or"] } : undefined,
      populate: ["images", "variants"],
    });

    const products = response.data ?? [];

    return strapiItems
      .map((item) => {
        const product = products.find((p) =>
          p.variants?.some((v) => String(v.id) === item.variantId),
        );
        if (!product) return null;

        const variant = product.variants?.find(
          (v) => String(v.id) === item.variantId,
        );

        return {
          productId: product.id,
          name: product.name,
          price: variant?.price ?? product.price,
          quantity: parseInt(item.quantity ?? "1", 10),
          image: product.images?.[0]?.url,
          variantId: item.variantId,
          variantName: variant?.name,
        } as CartItem;
      })
      .filter(Boolean) as CartItem[];
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/__tests__/cart-sync.test.ts`
Expected: PASS (all tests green)

- [ ] **Step 5: Commit**

```bash
git add lib/cart-sync.ts lib/__tests__/cart-sync.test.ts
git commit -m "feat: add cart sync API functions (fetch/create/update/delete/resolve)"
```

---

### Task 2: Modify Zustand Cart Store — `hooks/use-cart.ts`

**Files:**
- Modify: `hooks/use-cart.ts`
- Create: `hooks/__tests__/use-cart.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// hooks/__tests__/use-cart.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore, type CartItem } from "../use-cart";

// Reset store between tests
beforeEach(() => {
  useCartStore.setState({
    items: [],
    cartDocumentId: null,
    sessionId: null,
  });
});

describe("useCartStore — existing behavior", () => {
  it("adds items to cart", () => {
    useCartStore.getState().addItem({
      productId: 1,
      name: "Product A",
      price: 100,
    });
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it("increments quantity for duplicate product+variant", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100, variantId: "v1" });
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100, variantId: "v1" });
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("removes item by productId and variantId", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100, variantId: "v1" });
    useCartStore.getState().removeItem(1, "v1");
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("updates quantity", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100 });
    useCartStore.getState().updateQuantity(1, 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it("gets total", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100, quantity: 2 });
    useCartStore.getState().addItem({ productId: 2, name: "B", price: 50, quantity: 1 });
    expect(useCartStore.getState().getTotal()).toBe(250);
  });

  it("gets item count", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100, quantity: 3 });
    useCartStore.getState().addItem({ productId: 2, name: "B", price: 50, quantity: 2 });
    expect(useCartStore.getState().getItemCount()).toBe(5);
  });

  it("clears cart", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100 });
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe("useCartStore — new sessionId and cartDocumentId", () => {
  it("has null sessionId by default", () => {
    expect(useCartStore.getState().sessionId).toBeNull();
  });

  it("has null cartDocumentId by default", () => {
    expect(useCartStore.getState().cartDocumentId).toBeNull();
  });

  it("setSessionId updates sessionId", () => {
    useCartStore.getState().setSessionId("session-123");
    expect(useCartStore.getState().sessionId).toBe("session-123");
  });

  it("setCartDocumentId updates cartDocumentId", () => {
    useCartStore.getState().setCartDocumentId("doc-456");
    expect(useCartStore.getState().cartDocumentId).toBe("doc-456");
  });
});

describe("useCartStore — setItems and mergeItems", () => {
  it("setItems replaces all items", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100 });
    const newItems: CartItem[] = [
      { productId: 2, name: "B", price: 200, quantity: 1 },
    ];
    useCartStore.getState().setItems(newItems);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].name).toBe("B");
  });

  it("mergeItems deduplicates by variantId and sums quantities", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100, variantId: "v1", quantity: 2 });
    const incoming: CartItem[] = [
      { productId: 1, name: "A", price: 100, variantId: "v1", quantity: 3 },
      { productId: 2, name: "B", price: 200, variantId: "v2", quantity: 1 },
    ];
    useCartStore.getState().mergeItems(incoming);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(2);
    const itemA = items.find((i) => i.variantId === "v1")!;
    expect(itemA.quantity).toBe(5); // 2 + 3
    const itemB = items.find((i) => i.variantId === "v2")!;
    expect(itemB.quantity).toBe(1);
  });

  it("mergeItems handles empty incoming", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100 });
    useCartStore.getState().mergeItems([]);
    expect(useCartStore.getState().items).toHaveLength(1);
  });
});

describe("useCartStore — mergeCart", () => {
  it("replaces items with merged result and updates cartDocumentId", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100, variantId: "v1", quantity: 2 });
    const serverItems: CartItem[] = [
      { productId: 1, name: "A", price: 100, variantId: "v1", quantity: 1 },
      { productId: 2, name: "B", price: 200, variantId: "v2", quantity: 3 },
    ];

    useCartStore.getState().mergeCart("server-cart-doc", serverItems);
    const items = useCartStore.getState().items;
    const total = items.reduce((s, i) => s + i.quantity, 0);
    expect(total).toBe(6); // 2+1 + 3 = 6
    expect(useCartStore.getState().cartDocumentId).toBe("server-cart-doc");
  });
});

describe("useCartStore — replaceCart", () => {
  it("replaces items completely and updates cartDocumentId", () => {
    useCartStore.getState().addItem({ productId: 1, name: "A", price: 100 });
    useCartStore.getState().replaceCart("new-doc", [
      { productId: 3, name: "C", price: 300, quantity: 1 },
    ]);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].name).toBe("C");
    expect(useCartStore.getState().cartDocumentId).toBe("new-doc");
    expect(useCartStore.getState().sessionId).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test hooks/__tests__/use-cart.test.ts`
Expected: FAIL — `sessionId`, `cartDocumentId`, `setItems`, `mergeItems`, `mergeCart`, `replaceCart` not defined on store

- [ ] **Step 3: Modify `hooks/use-cart.ts`**

```ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantId?: string;
  variantName?: string;
}

interface CartStore {
  items: CartItem[];

  // Cart sync metadata
  sessionId: string | null;
  cartDocumentId: string | null;

  // Existing operations
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: number, variantId?: string) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;

  // New sync operations
  setSessionId: (id: string | null) => void;
  setCartDocumentId: (id: string | null) => void;
  setItems: (items: CartItem[]) => void;
  mergeItems: (incoming: CartItem[]) => void;
  mergeCart: (cartDocumentId: string, serverItems: CartItem[]) => void;
  replaceCart: (cartDocumentId: string | null, items: CartItem[]) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: null,
      cartDocumentId: null,

      addItem: (item) => {
        const { items } = get();
        const existingIndex = items.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += item.quantity || 1;
          set({ items: newItems });
        } else {
          set({ items: [...items, { ...item, quantity: item.quantity || 1 }] });
        }
      },

      removeItem: (productId, variantId) => {
        set({
          items: get().items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        });
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity }
              : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      setSessionId: (id) => set({ sessionId: id }),

      setCartDocumentId: (id) => set({ cartDocumentId: id }),

      setItems: (items) => set({ items }),

      mergeItems: (incoming) => {
        const { items } = get();
        const merged = [...items];

        for (const inc of incoming) {
          const idx = merged.findIndex(
            (i) => i.productId === inc.productId && i.variantId === inc.variantId
          );
          if (idx > -1) {
            merged[idx] = {
              ...merged[idx],
              quantity: merged[idx].quantity + inc.quantity,
            };
          } else {
            merged.push({ ...inc });
          }
        }
        set({ items: merged });
      },

      mergeCart: (cartDocumentId, serverItems) => {
        const local = get().items;
        const merged = [...serverItems];

        for (const localItem of local) {
          const idx = merged.findIndex(
            (i) => i.productId === localItem.productId && i.variantId === localItem.variantId
          );
          if (idx > -1) {
            merged[idx] = {
              ...merged[idx],
              quantity: merged[idx].quantity + localItem.quantity,
            };
          } else {
            merged.push({ ...localItem });
          }
        }
        set({ items: merged, cartDocumentId });
      },

      replaceCart: (cartDocumentId, items) => set({ items, cartDocumentId, sessionId: null }),
    }),
    { name: "cart-storage" }
  )
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test hooks/__tests__/use-cart.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/use-cart.ts hooks/__tests__/use-cart.test.ts
git commit -m "feat: add sessionId, cartDocumentId, merge/replace to cart store"
```

---

### Task 3: Cart Sync Hook — `hooks/use-cart-sync.ts`

**Files:**
- Create: `hooks/use-cart-sync.ts`
- Install: `pnpm add -D @testing-library/react @testing-library/jest-dom`
- Create: `hooks/__tests__/use-cart-sync.test.ts`

- [ ] **Step 1: Install testing dependencies**

```bash
pnpm add -D @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Write the failing test**

```ts
// hooks/__tests__/use-cart-sync.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCartSync } from "../use-cart-sync";
import { useCartStore } from "../use-cart";
import { getOrCreateSessionId } from "@/lib/cart-session";

vi.mock("../use-cart", async () => {
  const actual = await vi.importActual("../use-cart");
  return { ...actual };
});

vi.mock("@/lib/cart-session", () => ({
  getOrCreateSessionId: vi.fn(),
}));

vi.mock("@/lib/cart-sync", () => ({
  fetchCart: vi.fn(),
  createCart: vi.fn(),
  updateCart: vi.fn(),
  deleteCart: vi.fn(),
  resolveCartItems: vi.fn(),
}));

const mockFetchCart = vi.fn();
const mockCreateCart = vi.fn();
const mockUpdateCart = vi.fn();
const mockResolveCartItems = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getOrCreateSessionId).mockReturnValue("test-session-id");

  // reset store
  useCartStore.setState({
    items: [],
    sessionId: null,
    cartDocumentId: null,
  });
});

// Dynamic import so mocks are resolved
async function setupCartSync() {
  const mod = await import("@/lib/cart-sync");
  vi.mocked(mod.fetchCart).mockImplementation(mockFetchCart);
  vi.mocked(mod.createCart).mockImplementation(mockCreateCart);
  vi.mocked(mod.updateCart).mockImplementation(mockUpdateCart);
  vi.mocked(mod.resolveCartItems).mockImplementation(mockResolveCartItems);

  return renderHook(() => useCartSync());
}

describe("useCartSync — initialization", () => {
  it("sets sessionId from cookie on mount", async () => {
    await act(async () => {
      await setupCartSync();
    });
    expect(useCartStore.getState().sessionId).toBe("test-session-id");
  });

  it("hydrates from Strapi when cart exists for sessionId", async () => {
    const serverCart = {
      documentId: "server-cart-doc",
      sessionId: "test-session-id",
      items: [{ quantity: "2", variantId: "variant-1" }],
    };
    const resolvedItems = [
      { productId: 1, name: "Test", price: 100, quantity: 2, variantId: "variant-1" },
    ];

    mockFetchCart.mockResolvedValueOnce(serverCart);
    mockResolveCartItems.mockResolvedValueOnce(resolvedItems);

    await act(async () => {
      await setupCartSync();
    });

    await waitFor(() => {
      expect(useCartStore.getState().cartDocumentId).toBe("server-cart-doc");
      expect(useCartStore.getState().items).toEqual(resolvedItems);
    });
  });

  it("sets empty state when no cart found in Strapi", async () => {
    mockFetchCart.mockResolvedValueOnce(null);

    await act(async () => {
      await setupCartSync();
    });

    await waitFor(() => {
      expect(useCartStore.getState().cartDocumentId).toBeNull();
    });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test hooks/__tests__/use-cart-sync.test.ts`
Expected: FAIL — module `../use-cart-sync` not found

- [ ] **Step 4: Write minimal implementation**

```ts
// hooks/use-cart-sync.ts
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCartStore } from "./use-cart";
import { getOrCreateSessionId } from "@/lib/cart-session";
import { fetchCart, createCart, updateCart, deleteCart, resolveCartItems } from "@/lib/cart-sync";
import { toast } from "sonner";

const DEBOUNCE_MS = 500;
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useCartSync() {
  const store = useCartStore();
  const syncingRef = useRef(false);
  const lastItemsRef = useRef(store.items);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryRef = useRef(0);
  const initializedRef = useRef(false);

  // Hydrate from Strapi on mount
  const hydrate = useCallback(async () => {
    const sessionId = getOrCreateSessionId();
    store.setSessionId(sessionId);

    try {
      const cart = await fetchCart({ sessionId });
      if (cart?.documentId && cart.items?.length) {
        const resolved = await resolveCartItems(cart.items);
        store.replaceCart(cart.documentId, resolved);
      }
    } catch {
      // No cart found or error — start fresh
    }
  }, []);

  // Sync to Strapi
  const syncToStrapi = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    const { items, cartDocumentId, sessionId } = useCartStore.getState();

    try {
      if (!cartDocumentId) {
        if (items.length === 0) {
          syncingRef.current = false;
          return;
        }
        // Lazy create
        const response = await createCart({ sessionId: sessionId ?? undefined, items });
        if (response.data?.documentId) {
          useCartStore.getState().setCartDocumentId(response.data.documentId);
        }
        retryRef.current = 0;
      } else if (items.length === 0) {
        // Cart is empty — delete from Strapi
        await deleteCart(cartDocumentId);
        useCartStore.getState().setCartDocumentId(null);
        retryRef.current = 0;
      } else {
        // Update existing cart
        await updateCart(cartDocumentId, { sessionId: sessionId ?? undefined, items });
        retryRef.current = 0;
      }
    } catch {
      retryRef.current++;
      if (retryRef.current <= MAX_RETRIES) {
        toast.error("Gagal sync keranjang, mencoba lagi...");
        await sleep(1000 * retryRef.current);
        syncingRef.current = false;
        syncToStrapi();
        return;
      }
      toast.error("Gagal menyimpan keranjang ke server");
      retryRef.current = 0;
    } finally {
      syncingRef.current = false;
    }
  }, []);

  // Initial hydration
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      hydrate();
    }
  }, [hydrate]);

  // Subscribe to store changes
  useEffect(() => {
    const unsub = useCartStore.subscribe((state, prev) => {
      // Only sync if items actually changed AND we're already initialized
      if (state.items === prev.items || !initializedRef.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        lastItemsRef.current = state.items;
        syncToStrapi();
      }, DEBOUNCE_MS);
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [syncToStrapi]);

  return {
    syncNow: syncToStrapi,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test hooks/__tests__/use-cart-sync.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add hooks/use-cart-sync.ts hooks/__tests__/use-cart-sync.test.ts
git commit -m "feat: add useCartSync hook (hydration + debounced sync)"
```

---

### Task 4: Wire CartSync into Providers

**Files:**
- Modify: `providers/providers.tsx`
- Create: `components/cart/cart-sync.tsx` (thin wrapper component)

**Goal:** Create a thin client component that mounts `useCartSync`, then import it in `Providers`. This is needed because `useCartSync` is a client component hook and `Providers` is already "use client".

- [ ] **Step 1: Create `components/cart/cart-sync.tsx`**

```tsx
// components/cart/cart-sync.tsx
"use client";

import { useCartSync } from "@/hooks/use-cart-sync";

export function CartSync() {
  useCartSync();
  return null;
}
```

- [ ] **Step 2: Modify `providers/providers.tsx`**

Add `<CartSync />` inside the providers wrapper, after `<QueryClientProvider>`:

```tsx
import { CartSync } from "@/components/cart/cart-sync";

// Inside the return JSX, after <HydrationBoundary>:
return (
  <QueryClientProvider client={queryClient}>
    <HydrationBoundary state={dehydratedState}>
      <CartSync />
      {children}
      <Toaster position="top-right" />
    </HydrationBoundary>
  </QueryClientProvider>
);
```

- [ ] **Step 3: Verify existing tests still pass**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add components/cart/cart-sync.tsx providers/providers.tsx
git commit -m "feat: wire CartSync into root Providers"
```

---

### Task 5: Integration — Login/Logout Cart Merge

**Files:**
- Modify: `hooks/use-auth.ts` (add `documentId` to `AuthUser`)
- Modify: `hooks/use-cart-sync.ts` (add login merge, logout reset logic)

**Goal:** When user logs in, merge guest cart with server cart. When user logs out, switch back to guest mode.

- [ ] **Step 1: Extend `AuthUser` interface in `hooks/use-auth.ts`**

```ts
interface AuthUser {
  id: number;
  documentId: string;
  username: string;
  email: string;
}
```

- [ ] **Step 2: Add login/logout detection to `useCartSync`**

The hook should accept `userDocumentId` as an optional param and react when it changes:

```ts
// In hooks/use-cart-sync.ts, modify the signature:
export function useCartSync(userDocumentId?: string | null) {
  // ...

  // Effect: when userDocumentId appears (login), merge
  useEffect(() => {
    if (!userDocumentId) return;
    if (!initializedRef.current) return;

    (async () => {
      const sessionId = store.sessionId;
      try {
        const serverCart = await fetchCart({ userDocumentId });
        if (serverCart?.items) {
          const resolved = await resolveCartItems(serverCart.items);
          store.mergeCart(serverCart.documentId!, resolved);
        } else {
          // No server cart — push current cart to server
          if (store.items.length > 0) {
            const resp = await createCart({ userDocumentId, items: store.items });
            if (resp.data?.documentId) {
              store.setCartDocumentId(resp.data.documentId);
            }
          }
        }
        // After login, clear session-based cart in Strapi
        if (store.sessionId && store.cartDocumentId !== store.sessionId) {
          try {
            const oldCart = await fetchCart({ sessionId: store.sessionId });
            if (oldCart?.documentId) {
              await deleteCart(oldCart.documentId);
            }
          } catch { /* ignore */ }
        }
      } catch {
        // Fallback: just keep current state
      }
    })();
  }, [userDocumentId]);

  // Effect: when user logs out (userDocumentId becomes null), switch to guest
  useEffect(() => {
    if (userDocumentId !== null) return; // still logged in or not yet determined
    if (!initializedRef.current) return;

    const sessionId = getOrCreateSessionId();
    store.setSessionId(sessionId);
    store.setCartDocumentId(null);

    // Re-hydrate from session cart
    (async () => {
      try {
        const cart = await fetchCart({ sessionId });
        if (cart?.documentId && cart.items?.length) {
          const resolved = await resolveCartItems(cart.items);
          store.replaceCart(cart.documentId, resolved);
        } else if (store.items.length > 0) {
          // Create new session cart with existing items
          const resp = await createCart({ sessionId, items: store.items });
          if (resp.data?.documentId) {
            store.setCartDocumentId(resp.data.documentId);
          }
        }
      } catch { /* ignore */ }
    })();
  }, [userDocumentId]);
}
```

- [ ] **Step 3: Update `CartSync` component to pass user info**

```tsx
// components/cart/cart-sync.tsx
"use client";

import { useCartSync } from "@/hooks/use-cart-sync";
import { useAuth } from "@/hooks/use-auth";

export function CartSync() {
  const { user } = useAuth();
  useCartSync(user?.documentId ?? null);
  return null;
}
```

- [ ] **Step 4: Run all tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add hooks/use-auth.ts hooks/use-cart-sync.ts components/cart/cart-sync.tsx
git commit -m "feat: add login/logout cart merge and auth integration"
```

---

### Task 6: Verify — Run full app build + lint

- [ ] **Step 1: Run TypeScript check**

```bash
pnpm exec tsc --noEmit
```
Expected: No type errors (fix any if present)

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```
Expected: No errors

- [ ] **Step 3: Run build**

```bash
pnpm build
```
Expected: Build succeeds

- [ ] **Step 4: Run all tests one final time**

```bash
pnpm test
```
Expected: ALL tests pass

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final verification — types, lint, build, tests passing"
```

---

## Verification Checklist

- [ ] `lib/cart-session.ts` — 7 tests passing
- [ ] `lib/cart-sync.ts` — fetch/create/update/delete/resolve tests passing
- [ ] `hooks/use-cart.ts` — existing + new store methods tests passing
- [ ] `hooks/use-cart-sync.ts` — hydration + sync tests passing
- [ ] `providers/providers.tsx` — CartSync wired
- [ ] `components/cart/cart-sync.tsx` — wrapper component created
- [ ] `tsc --noEmit` clean
- [ ] `pnpm lint` clean
- [ ] `pnpm build` succeeds
- [ ] Manual: add item to cart → check Strapi dashboard → cart created
- [ ] Manual: update quantity → check Strapi → items updated
- [ ] Manual: guest → login → cart merged
- [ ] Manual: login → logout → guest cart persisted
