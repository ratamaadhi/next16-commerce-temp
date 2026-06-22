# WhatsApp Product Inquiry Button — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Tanyakan Produk" button on the product detail page that opens WhatsApp with a pre-filled message about the product.

**Architecture:** A Next.js API route proxies `GET /api/store-setting` to Strapi. A `useStoreSettings` hook fetches it once via React Query (`staleTime: Infinity`) and caches for the session. `ProductActions` reads `whatsappNumber` from the hook and conditionally renders an `<a>` styled with `buttonVariants`.

**Tech Stack:** Next.js App Router, React Query (`@tanstack/react-query`), Vitest + jsdom, `buttonVariants` (CVA), `cn` utility.

## Global Constraints

- Button hidden (no render) when `whatsappNumber` is null, empty, loading, or on error — never render a broken link
- WhatsApp URL format: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
- Number format already `628xxxxxxxxx` — no parsing needed
- Button opens in new tab (`target="_blank" rel="noopener noreferrer"`)
- Message is hardcoded in FE: `Halo, saya ingin bertanya tentang produk: ${productName}`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `app/api/store-setting/route.ts` | Proxy GET to Strapi, normalize response |
| Create | `hooks/use-store-settings.ts` | React Query hook, `staleTime: Infinity` |
| Create | `hooks/__tests__/use-store-settings.test.ts` | Unit tests for hook |
| Modify | `components/products/product-actions.tsx` | Add WhatsApp button below AddToCartButton |
| Create | `components/products/__tests__/product-actions-whatsapp.test.tsx` | Render tests for button visibility |

---

### Task 1: API Route — `app/api/store-setting/route.ts`

**Files:**
- Create: `app/api/store-setting/route.ts`

**Interfaces:**
- Produces: `GET /api/store-setting` → `{ data: { whatsappNumber: string | null } }`

- [ ] **Step 1: Create the route file**

```ts
// app/api/store-setting/route.ts
import { NextResponse } from "next/server";

const STRAPI_URL =
  process.env.STRAPI_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  "http://localhost:1337";

export async function GET() {
  try {
    const res = await fetch(`${STRAPI_URL}/api/store-setting`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ data: { whatsappNumber: null } });
    }
    const json = await res.json();
    return NextResponse.json({
      data: { whatsappNumber: json.data?.whatsappNumber ?? null },
    });
  } catch {
    return NextResponse.json({ data: { whatsappNumber: null } });
  }
}
```

- [ ] **Step 2: Verify the route is reachable**

Start the dev server (`pnpm dev`) and run:
```bash
curl http://localhost:3000/api/store-setting
```
Expected: `{ "data": { "whatsappNumber": "628..." } }` or `{ "data": { "whatsappNumber": null } }` if Strapi returns nothing.

- [ ] **Step 3: Commit**

```bash
git add app/api/store-setting/route.ts
git commit -m "feat: add store-setting API route"
```

---

### Task 2: `useStoreSettings` Hook

**Files:**
- Create: `hooks/use-store-settings.ts`
- Test: `hooks/__tests__/use-store-settings.test.ts`

**Interfaces:**
- Consumes: `GET /api/store-setting` (Task 1)
- Produces: `useStoreSettings() → { whatsappNumber: string | null }`

- [ ] **Step 1: Write the failing test**

```ts
// hooks/__tests__/use-store-settings.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useStoreSettings } from "../use-store-settings";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useStoreSettings", () => {
  it("returns whatsappNumber from API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { whatsappNumber: "628123456789" } }), {
        status: 200,
      })
    );
    const { result } = renderHook(() => useStoreSettings(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.whatsappNumber).toBe("628123456789"));
  });

  it("returns null when API fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 })
    );
    const { result } = renderHook(() => useStoreSettings(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.whatsappNumber).toBeNull());
  });

  it("returns null when whatsappNumber missing from response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ data: {} }), { status: 200 })
    );
    const { result } = renderHook(() => useStoreSettings(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.whatsappNumber).toBeNull());
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm test hooks/__tests__/use-store-settings.test.ts
```
Expected: FAIL — `Cannot find module '../use-store-settings'`

- [ ] **Step 3: Implement the hook**

```ts
// hooks/use-store-settings.ts
"use client";

import { useQuery } from "@tanstack/react-query";

interface StoreSettings {
  whatsappNumber: string | null;
}

async function fetchStoreSettings(): Promise<StoreSettings> {
  const res = await fetch("/api/store-setting");
  if (!res.ok) return { whatsappNumber: null };
  const json = await res.json();
  return { whatsappNumber: json.data?.whatsappNumber ?? null };
}

export function useStoreSettings() {
  const { data } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchStoreSettings,
    staleTime: Infinity,
    retry: false,
  });

  return {
    whatsappNumber: data?.whatsappNumber ?? null,
  };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm test hooks/__tests__/use-store-settings.test.ts
```
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/use-store-settings.ts hooks/__tests__/use-store-settings.test.ts
git commit -m "feat: add useStoreSettings hook with React Query"
```

---

### Task 3: WhatsApp Button in `ProductActions`

**Files:**
- Modify: `components/products/product-actions.tsx`
- Test: `components/products/__tests__/product-actions-whatsapp.test.tsx`

**Interfaces:**
- Consumes: `useStoreSettings() → { whatsappNumber }` (Task 2)
- Consumes: `buttonVariants({ variant: "outline" })` from `@/components/ui/button`
- Consumes: `cn` from `@/lib/utils`

- [ ] **Step 1: Write the failing test**

```tsx
// components/products/__tests__/product-actions-whatsapp.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductActions } from "../product-actions";

// Mock useStoreSettings
vi.mock("@/hooks/use-store-settings", () => ({
  useStoreSettings: vi.fn(),
}));

// Mock AddToCartButton (avoids Zustand/QueryClient deps in test)
vi.mock("@/components/cart/add-to-cart-button", () => ({
  AddToCartButton: () => null,
}));

// Mock VariantSelector
vi.mock("../variant-selector", () => ({
  VariantSelector: () => null,
}));

// Mock formatPrice
vi.mock("@/lib/strapi", () => ({
  formatPrice: (p: number) => `Rp${p}`,
}));

import { useStoreSettings } from "@/hooks/use-store-settings";

const baseProduct = {
  id: 1,
  documentId: "abc",
  name: "Produk Test",
  price: 100000,
  shortDescription: null,
  compareAtPrice: null,
  images: [],
  variants: [],
  inventory: 10,
  dimensions: null,
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("ProductActions — WhatsApp button", () => {
  it("renders WhatsApp link when whatsappNumber is set", () => {
    vi.mocked(useStoreSettings).mockReturnValue({ whatsappNumber: "628123456789" });
    render(<ProductActions product={baseProduct as any} variants={[]} />);
    const link = screen.getByRole("link", { name: /tanyakan produk/i });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toContain("wa.me/628123456789");
    expect(link.getAttribute("href")).toContain("Produk%20Test");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("hides WhatsApp link when whatsappNumber is null", () => {
    vi.mocked(useStoreSettings).mockReturnValue({ whatsappNumber: null });
    render(<ProductActions product={baseProduct as any} variants={[]} />);
    expect(screen.queryByRole("link", { name: /tanyakan produk/i })).toBeNull();
  });

  it("hides WhatsApp link when whatsappNumber is empty string", () => {
    vi.mocked(useStoreSettings).mockReturnValue({ whatsappNumber: "" });
    render(<ProductActions product={baseProduct as any} variants={[]} />);
    expect(screen.queryByRole("link", { name: /tanyakan produk/i })).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm test components/products/__tests__/product-actions-whatsapp.test.tsx
```
Expected: FAIL — WhatsApp link not found in render output

- [ ] **Step 3: Update `ProductActions`**

Replace the contents of `components/products/product-actions.tsx`:

```tsx
"use client";

import { useState } from "react";
import { VariantSelector } from "./variant-selector";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { formatPrice } from "@/lib/strapi";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  const selected = selectedVariant !== null ? variants?.[selectedVariant] : null;
  const displayPrice = selected?.price ?? product.price;
  const hasVariants = !!(variants && variants.length > 0);
  const needsVariant = hasVariants && selectedVariant === null;
  const { whatsappNumber } = useStoreSettings();

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
        image={product.images?.[0]?.formats?.small?.url ?? product.images?.[0]?.url}
        variantId={selected?.id?.toString()}
        variantName={selected?.name}
        variantSku={selected?.sku}
        dimensions={product.dimensions}
        needsVariant={needsVariant}
        maxQuantity={Number(selected?.inventory ?? product.inventory) || undefined}
        disabled={needsVariant || (selected?.inventory ?? product.inventory ?? 0) <= 0}
      />

      {whatsappNumber && (
        <a
          href={buildWhatsAppUrl(whatsappNumber, product.name)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "w-full gap-2")}
        >
          <WhatsAppIcon />
          Tanyakan Produk
        </a>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm test components/products/__tests__/product-actions-whatsapp.test.tsx
```
Expected: 3 tests PASS

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
pnpm test
```
Expected: All tests PASS

- [ ] **Step 6: Verify visually**

Open `http://localhost:3000/products/<any-slug>`. With `whatsappNumber` set in Strapi:
- Button "Tanyakan Produk" appears below "Tambah ke Keranjang"
- Click opens WhatsApp web/app in a new tab with pre-filled message
- With `whatsappNumber` unset/null in Strapi: button not rendered

- [ ] **Step 7: Commit**

```bash
git add components/products/product-actions.tsx components/products/__tests__/product-actions-whatsapp.test.tsx
git commit -m "feat: add WhatsApp inquiry button to product detail page"
```
