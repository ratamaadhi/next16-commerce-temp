# Shipping Cost Check (Cek Ongkos Kirim) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate KiriminAja shipping cost API into checkout, replacing hardcoded shipping with real courier options after user selects destination subdistrict.

**Architecture:** Server-side BFF proxy routes (`/api/shipping/*`) call KiriminAja APIs. Client components (`SubdistrictSearch`, `ShippingOptions`) provide autocomplete search and courier selection. Checkout page orchestrates state: subdistrict → auto-fetch cost → user picks courier → submit.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zustand, shadcn/ui (Select, Command, Input, RadioGroup)

---

### Task 1: Env vars + dimension utility

**Files:**
- Modify: `.env.local`
- Create: `lib/shipping.ts`

- [ ] **Step 1: Add env vars to `.env.local`**

```env
# Strapi API
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_URL=http://localhost:1337

# Next.js
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# KiriminAja
KIRIMINAJA_ORIGIN_SUBDISTRICT_ID=5470
KIRIMINAJA_ORIGIN_TITLE=Jatimukti, Jatinangor, Sumedang, Jawa Barat
```

Run: `cat .env.local` — verify new vars exist.

- [ ] **Step 2: Create `lib/shipping.ts` — dimension utility + types**

```typescript
export interface SubdistrictResult {
  id: number;
  name: string;
  city?: string;
  province?: string;
}

export interface ShippingOption {
  name: string;
  price: number;
  etd?: string;
}

export function getDimensionsByWeight(totalWeightGrams: number): {
  length: number;
  width: number;
  height: number;
} {
  const kg = totalWeightGrams / 1000;
  if (kg <= 1) return { length: 20, width: 15, height: 10 };
  if (kg <= 2) return { length: 27, width: 13, height: 7 };
  if (kg <= 5) return { length: 30, width: 20, height: 15 };
  return { length: 40, width: 30, height: 20 };
}
```

Run: `ls -la lib/shipping.ts` — verify file exists.

- [ ] **Step 3: Write test for dimension utility**

Create `lib/__tests__/shipping.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getDimensionsByWeight } from "../shipping";

describe("getDimensionsByWeight", () => {
  it("returns small box for <= 1kg", () => {
    expect(getDimensionsByWeight(500)).toEqual({ length: 20, width: 15, height: 10 });
    expect(getDimensionsByWeight(1000)).toEqual({ length: 20, width: 15, height: 10 });
  });

  it("returns medium box for <= 2kg", () => {
    expect(getDimensionsByWeight(1500)).toEqual({ length: 27, width: 13, height: 7 });
    expect(getDimensionsByWeight(2000)).toEqual({ length: 27, width: 13, height: 7 });
  });

  it("returns large box for <= 5kg", () => {
    expect(getDimensionsByWeight(3500)).toEqual({ length: 30, width: 20, height: 15 });
  });

  it("returns xl box for > 5kg", () => {
    expect(getDimensionsByWeight(6000)).toEqual({ length: 40, width: 30, height: 20 });
  });
});
```

Run: `npx vitest run lib/__tests__/shipping.test.ts` — Expected: 4 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add .env.local lib/shipping.ts lib/__tests__/shipping.test.ts
git commit -m "feat: add KiriminAja env config, dimension utility, and tests"
```

---

### Task 2: Add weight to CartItem + getTotalWeight store method

**Files:**
- Modify: `hooks/use-cart.ts`
- Modify: `hooks/__tests__/use-cart.test.ts`

- [ ] **Step 1: Add `weight` to CartItem and `getTotalWeight` to store**

In `hooks/use-cart.ts`, add `weight?: number` to the CartItem interface:

```typescript
export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantId?: string;
  variantName?: string;
  weight?: number;
}
```

In the `CartStore` interface, add the method after `getItemCount`:

```typescript
  getTotalWeight: () => number;
```

In the `create` call, add the implementation after `getItemCount`:

```typescript
      getTotalWeight: () =>
        get().items.reduce((sum, i) => sum + (i.weight ?? 500) * i.quantity, 0),
```

Run: `npx tsc --noEmit` — Expected: no TypeScript errors.

- [ ] **Step 2: Write tests for getTotalWeight**

Add to `hooks/__tests__/use-cart.test.ts` after existing tests:

```typescript
describe("useCartStore — getTotalWeight", () => {
  it("sums weight * quantity for all items", () => {
    useCartStore.getState().addItem({
      productId: 1, name: "A", price: 100, quantity: 2, weight: 300,
    });
    useCartStore.getState().addItem({
      productId: 2, name: "B", price: 100, quantity: 3, weight: 200,
    });
    expect(useCartStore.getState().getTotalWeight()).toBe(1200); // 600 + 600
  });

  it("uses default 500g when weight is undefined", () => {
    useCartStore.getState().addItem({
      productId: 1, name: "A", price: 100, quantity: 2,
    });
    expect(useCartStore.getState().getTotalWeight()).toBe(1000);
  });

  it("returns 0 for empty cart", () => {
    expect(useCartStore.getState().getTotalWeight()).toBe(0);
  });
});
```

Run: `npx vitest run hooks/__tests__/use-cart.test.ts` — Expected: existing tests + 3 new tests all PASS.

- [ ] **Step 3: Commit**

```bash
git add hooks/use-cart.ts hooks/__tests__/use-cart.test.ts
git commit -m "feat: add weight to CartItem and getTotalWeight method"
```

---

### Task 3: Add weight to ProductData + populate queries

**Files:**
- Modify: `lib/products.ts`

- [ ] **Step 1: Add weight to ProductData**

In `lib/products.ts`, add `weight?: number` to `ProductData`:

```typescript
export interface ProductData {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  shortDescription?: string;
  description?: string;
  inventory?: number;
  sku?: string;
  weight?: number;
  images?: StrapiImage[];
  featured?: boolean;
  categories?: ProductData[];
  variants?: Array<{ id?: number; name: string; sku?: string; price: number; inventory?: number }>;
  specifications?: Array<{ label: string; value: string }>;
  reviews?: Array<{ id: number; rating: number; title: string; comment: string; verified: boolean; createdAt: string; user?: { username: string } }>;
  publishedAt?: string;
  createdAt?: string;
}
```

In `getProducts`, add `"weight"` to the populate array:

```typescript
    populate: ["images", "categories", "variants", "weight"],
```

In `getProductBySlug`, add `"weight"` to the populate array:

```typescript
    populate: ["images", "categories", "variants", "specifications", "reviews.user", "weight"],
```

Run: `npx tsc --noEmit` — Expected: no TypeScript errors.

- [ ] **Step 2: Commit**

```bash
git add lib/products.ts
git commit -m "feat: add weight to ProductData and Strapi populate queries"
```

---

### Task 4: Add weight to cart sync resolution

**Files:**
- Modify: `lib/cart-sync.ts`

- [ ] **Step 1: Fetch weight in resolveCartItems**

In `lib/cart-sync.ts`, modify:

a) Add `weight?: number` to `ResolvedProduct`:

```typescript
interface ResolvedProduct {
  id: number;
  documentId: string;
  name: string;
  price: number;
  weight?: number;
  images?: Array<{ url: string }>;
  variants?: Array<{
    id: number;
    name: string;
    price: number;
    sku?: string;
    inventory?: number;
  }>;
}
```

b) Fetch weight in populate:

```typescript
      populate: ["images", "variants", "weight"],
```

c) Include weight in the returned CartItem:

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

Run: `npx tsc --noEmit` — Expected: no TypeScript errors.

- [ ] **Step 2: Commit**

```bash
git add lib/cart-sync.ts
git commit -m "feat: add weight to cart sync resolution"
```

---

### Task 5: Pass weight through product → add-to-cart chain

**Files:**
- Modify: `components/cart/add-to-cart-button.tsx`
- Modify: `components/products/product-actions.tsx`
- Modify: `app/products/[slug]/page.tsx`

- [ ] **Step 1: Add weight prop to AddToCartButton**

In `components/cart/add-to-cart-button.tsx`, add `weight` to interface:

```typescript
interface AddToCartButtonProps {
  productId: number;
  productName: string;
  price: number;
  image?: string;
  variantId?: string;
  variantName?: string;
  disabled?: boolean;
  weight?: number;
}
```

Add `weight` to destructure:

```typescript
export function AddToCartButton({
  productId,
  productName,
  price,
  image,
  variantId,
  variantName,
  disabled,
  weight,
}: AddToCartButtonProps) {
```

Pass weight to addItem:

```typescript
    addItem({
      productId,
      name: productName,
      price,
      image,
      quantity,
      variantId,
      variantName,
      weight,
    });
```

- [ ] **Step 2: Pass weight from ProductActions**

In `components/products/product-actions.tsx`, add `weight={product.weight}` to the `<AddToCartButton>` call:

```typescript
      <AddToCartButton
        productId={product.id}
        productName={product.name}
        price={displayPrice}
        image={product.images?.[0]?.url}
        variantId={selected?.id?.toString()}
        variantName={selected?.name}
        weight={product.weight}
        disabled={
          (selected?.inventory ?? product.inventory ?? 0) <= 0
        }
      />
```

- [ ] **Step 3: Verify product page passes weight**

Check `app/products/[slug]/page.tsx` — it already passes `product={product}` to `<ProductActions>`. Since `product` includes weight from the populate query (Task 3), no change needed here.

Run: `npx tsc --noEmit` — Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add components/cart/add-to-cart-button.tsx components/products/product-actions.tsx
git commit -m "feat: pass product weight through add-to-cart chain"
```

---

### Task 6: API route — search district

**Files:**
- Create: `app/api/shipping/search-district/route.ts`

- [ ] **Step 1: Create the route handler**

```typescript
import { NextRequest, NextResponse } from "next/server";
import type { SubdistrictResult } from "@/lib/shipping";

const API_URL = "https://prd-kaj-srvc-dshbd-api-ext.kiriminaja.com/api/dm/v1/coverage/allleveldistrict/search";
const API_KEY = "base64:RG/ODAHrZ33diOUid/6oRzkUEu1WBVnjKoqgSqle0gA=";
const AUTH_TOKEN = "Bearer 31106721|4waTRjcj0ZDevak4CKx46GAniyboU4fYrSPiEvbAe45ff6cc";
const DEVICE_ID = "U2FsdGVkX1-U4uV821rGO7TNJgiY2eH2ls7Izfik";

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("keyword");

  if (!keyword || keyword.length < 3) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const url = `${API_URL}?keyword=${encodeURIComponent(keyword)}`;
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "api-key": API_KEY,
        authorization: AUTH_TOKEN,
        "device-id": DEVICE_ID,
        "device-time-zone": "wib",
        origin: "https://app.kiriminaja.com",
        referer: "https://app.kiriminaja.com/",
        "user-agent": "next-commerce/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `KiriminAja API error: ${response.status}` },
        { status: 502 },
      );
    }

    const data = await response.json();
    const results: SubdistrictResult[] = Array.isArray(data) ? data : (data.data ?? []);

    return NextResponse.json(results);
  } catch (error) {
    console.error("[search-district] error:", error);
    return NextResponse.json({ error: "Gagal mencari lokasi" }, { status: 500 });
  }
}
```

Run: `ls -la app/api/shipping/search-district/route.ts` — verify file exists.

- [ ] **Step 2: Verify route works**

Run: `npx next dev --port 3000 &` (start dev server, then test)

```bash
curl "http://localhost:3000/api/shipping/search-district?keyword=cinunuk"
```

Expected: JSON array of subdistrict results (or test with any valid keyword).

- [ ] **Step 3: Commit**

```bash
git add app/api/shipping/search-district/route.ts
git commit -m "feat: add shipping search-district API route"
```

---

### Task 7: API route — shipping cost

**Files:**
- Create: `app/api/shipping/cost/route.ts`

- [ ] **Step 1: Create the route handler**

```typescript
import { NextRequest, NextResponse } from "next/server";
import type { ShippingOption } from "@/lib/shipping";

const API_URL = "https://prd-kaj-srvc-dshbd-api-ext.kiriminaja.com/api/dm/v1/shipping/express";
const API_KEY = "base64:RG/ODAHrZ33diOUid/6oRzkUEu1WBVnjKoqgSqle0gA=";
const AUTH_TOKEN = "Bearer 31106721|4waTRjcj0ZDevak4CKx46GAniyboU4fYrSPiEvbAe45ff6cc";
const DEVICE_ID = "U2FsdGVkX1-U4uV821rGO7TNJgiY2eH2ls7Izfik";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const subdistrictDestination = searchParams.get("subdistrict_destination");
  const weight = searchParams.get("weight") || "2000";
  const length = searchParams.get("length") || "27";
  const width = searchParams.get("width") || "13";
  const height = searchParams.get("height") || "7";

  const originId = process.env.KIRIMINAJA_ORIGIN_SUBDISTRICT_ID || "5470";
  const originTitle = encodeURIComponent(process.env.KIRIMINAJA_ORIGIN_TITLE || "Origin");

  if (!subdistrictDestination) {
    return NextResponse.json({ error: "subdistrict_destination is required" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      subdistrict_origin: originId,
      subdistrict_destination: subdistrictDestination,
      originTitle,
      destinationTitle: subdistrictDestination,
      weight,
      length,
      width,
      height,
      insurance: "false",
      cod: "false",
      item_value: "0",
    });

    const url = `${API_URL}?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "api-key": API_KEY,
        authorization: AUTH_TOKEN,
        "device-id": DEVICE_ID,
        "device-time-zone": "wib",
        origin: "https://app.kiriminaja.com",
        referer: "https://app.kiriminaja.com/",
        "user-agent": "next-commerce/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `KiriminAja API error: ${response.status}` },
        { status: 502 },
      );
    }

    const data = await response.json();
    const results: ShippingOption[] = Array.isArray(data) ? data : (data.data ?? []);

    return NextResponse.json(results);
  } catch (error) {
    console.error("[shipping-cost] error:", error);
    return NextResponse.json({ error: "Gagal mengambil ongkos kirim" }, { status: 500 });
  }
}
```

Run: `ls -la app/api/shipping/cost/route.ts` — verify file exists.

- [ ] **Step 2: Commit**

```bash
git add app/api/shipping/cost/route.ts
git commit -m "feat: add shipping cost API route"
```

---

### Task 8: SubdistrictSearch component

**Files:**
- Create: `components/checkout/subdistrict-search.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SubdistrictResult } from "@/lib/shipping";

interface SubdistrictSearchProps {
  onSelect: (result: { id: number; title: string }) => void;
}

export function SubdistrictSearch({ onSelect }: SubdistrictSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SubdistrictResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/shipping/search-district?keyword=${encodeURIComponent(query)}`,
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setResults(Array.isArray(data) ? data : []);
        setIsOpen(true);
      } catch {
        setError("Gagal mencari lokasi");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(result: SubdistrictResult) {
    const title = [result.name, result.city, result.province]
      .filter(Boolean)
      .join(", ");
    setQuery(result.name);
    setIsOpen(false);
    setResults([]);
    onSelect({ id: result.id, title });
  }

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      <Label className="text-xs">Kecamatan / Kelurahan</Label>
      <Input
        placeholder="Cari kecamatan atau kelurahan..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onSelect({ id: 0, title: "" });
        }}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
      />
      {isLoading && (
        <div className="absolute z-10 mt-1 w-full bg-background border rounded-md p-2 text-xs text-muted-foreground">
          Mencari...
        </div>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors"
              onClick={() => handleSelect(r)}
            >
              <span className="font-medium">{r.name}</span>
              {r.city && (
                <span className="text-muted-foreground">, {r.city}</span>
              )}
              {r.province && (
                <span className="text-muted-foreground">, {r.province}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {isOpen && results.length === 0 && !isLoading && query.length >= 3 && (
        <div className="absolute z-10 mt-1 w-full bg-background border rounded-md p-2 text-xs text-muted-foreground">
          Tidak ada hasil
        </div>
      )}
    </div>
  );
}
```

Run: `npx tsc --noEmit` — Expected: no TypeScript errors.

- [ ] **Step 2: Commit**

```bash
git add components/checkout/subdistrict-search.tsx
git commit -m "feat: add SubdistrictSearch autocomplete component"
```

---

### Task 9: ShippingOptions component

**Files:**
- Create: `components/checkout/shipping-options.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Truck, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/strapi";
import type { ShippingOption } from "@/lib/shipping";

interface ShippingOptionsProps {
  destinationId: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  onSelect: (option: ShippingOption | null) => void;
}

export function ShippingOptions({
  destinationId,
  weight,
  length,
  width,
  height,
  onSelect,
}: ShippingOptionsProps) {
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    if (!destinationId) return;

    setSelected(null);
    setOptions([]);
    setHasFetched(false);

    async function fetchCost() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          subdistrict_destination: String(destinationId),
          weight: String(weight),
          length: String(length),
          width: String(width),
          height: String(height),
        });
        const res = await fetch(`/api/shipping/cost?${params}`);
        if (!res.ok) throw new Error("Shipping cost fetch failed");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setOptions(Array.isArray(data) ? data : []);
        setHasFetched(true);
      } catch {
        setError("Gagal mengambil ongkos kirim");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCost();
  }, [destinationId, weight, length, width, height, retryTrigger]);

  if (!destinationId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="rounded-md border p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Mengambil ongkos kirim...
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="size-3" />
          {error}
        </div>
        <button
          type="button"
          className="text-xs text-primary flex items-center gap-1"
          onClick={() => {
            setError(null);
            setRetryTrigger((c) => c + 1);
          }}
        >
          <RefreshCw className="size-3" />
          Coba Lagi
        </button>
      </div>
    );
  }

  if (hasFetched && options.length === 0) {
    return (
      <div className="rounded-md border p-3 text-xs text-muted-foreground">
        Maaf, belum tersedia pengiriman ke lokasi Anda.
      </div>
    );
  }

  if (options.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center gap-1">
        <Truck className="size-3" />
        Pilih Kurir
      </Label>
      <div className="rounded-md border divide-y">
        {options.map((opt) => {
          const isSelected = selected === opt.name;
          return (
            <label
              key={opt.name}
              className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${
                isSelected ? "bg-primary/5" : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="shipping-option"
                  className="size-3.5 accent-primary"
                  checked={isSelected}
                  onChange={() => {
                    setSelected(opt.name);
                    onSelect(opt);
                  }}
                />
                <div>
                  <p className="text-xs font-medium">{opt.name}</p>
                  {opt.etd && (
                    <p className="text-[10px] text-muted-foreground">
                      Estimasi: {opt.etd}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs font-semibold">{formatPrice(opt.price)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
```

Run: `npx tsc --noEmit` — Expected: no TypeScript errors.

- [ ] **Step 2: Commit**

```bash
git add components/checkout/shipping-options.tsx
git commit -m "feat: add ShippingOptions component"
```

---

### Task 10: Update checkout page

**Files:**
- Modify: `app/checkout/page.tsx`

- [ ] **Step 1: Rewrite checkout page with shipping integration**

Replace the entire content of `app/checkout/page.tsx`:

```typescript
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderSummary } from "@/components/checkout/order-summary";
import { SubdistrictSearch } from "@/components/checkout/subdistrict-search";
import { ShippingOptions } from "@/components/checkout/shipping-options";
import { getDimensionsByWeight } from "@/lib/shipping";
import type { ShippingOption } from "@/lib/shipping";
import { toast } from "sonner";

const TAX_RATE = 0.11;
const FREE_SHIPPING_THRESHOLD = 200000;

export default function CheckoutPage() {
  const { items, getTotal, getTotalWeight, clearCart } = useCartStore();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
  });
  const [notes, setNotes] = useState("");

  const [selectedSubdistrict, setSelectedSubdistrict] = useState<{
    id: number;
    title: string;
  } | null>(null);

  const [selectedCourier, setSelectedCourier] = useState<ShippingOption | null>(null);
  const [shippingCost, setShippingCost] = useState(0);

  const subtotal = useMemo(() => getTotal(), [getTotal]);
  const tax = Math.round(subtotal * TAX_RATE);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : shippingCost;
  const total = subtotal + tax + shipping;
  const totalWeight = useMemo(() => getTotalWeight(), [getTotalWeight]);
  const dimensions = getDimensionsByWeight(totalWeight);

  useEffect(() => {
    if (!items.length) {
      router.push("/cart");
    }
  }, [items.length, router]);

  const handleInputChange = (field: string, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (!selectedCourier && subtotal < FREE_SHIPPING_THRESHOLD) {
      toast.error("Silakan pilih kurir pengiriman");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const fullAddress = selectedSubdistrict
        ? `${shippingAddress.addressLine1}, ${selectedSubdistrict.title}`
        : shippingAddress.addressLine1;

      const shippingNotes = selectedCourier
        ? `${notes ? notes + " | " : ""}Kurir: ${selectedCourier.name}`
        : notes;

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productName: item.name,
            quantity: String(item.quantity),
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            variantInfo: item.variantName,
          })),
          shippingAddress: {
            ...shippingAddress,
            addressLine1: fullAddress,
            city: selectedSubdistrict?.title ?? "",
            state: "",
            postalCode: "",
            country: "Indonesia",
          },
          billingAddress: {
            ...shippingAddress,
            addressLine1: fullAddress,
            city: selectedSubdistrict?.title ?? "",
            state: "",
            postalCode: "",
            country: "Indonesia",
          },
          notes: shippingNotes,
          subtotal,
          tax,
          shippingCost: shipping,
          totalAmount: total,
          currency: "IDR",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
          errorData?.error?.error?.error?.message ||
          errorData?.error?.error?.message ||
          errorData?.error?.message ||
          "Gagal membuat pesanan";
        console.error("Checkout error response:", errorData);
        setError(message);
        return;
      }

      const order = await response.json();
      clearCart();
      router.push(`/orders/${order.data.orderNumber}`);
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Terjadi kesalahan, silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!items.length) return null;

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-xl font-semibold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Alamat Pengiriman</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama Depan</Label>
                    <Input required value={shippingAddress.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama Belakang</Label>
                    <Input required value={shippingAddress.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Telepon</Label>
                  <Input required type="tel" value={shippingAddress.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Alamat</Label>
                  <Input required value={shippingAddress.addressLine1} onChange={(e) => handleInputChange("addressLine1", e.target.value)} />
                </div>
                <SubdistrictSearch
                  onSelect={(subdistrict) => {
                    setSelectedSubdistrict(subdistrict.id ? subdistrict : null);
                    setSelectedCourier(null);
                    setShippingCost(0);
                  }}
                />
              </CardContent>
            </Card>

            {selectedSubdistrict && selectedSubdistrict.id > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Ongkos Kirim</CardTitle>
                </CardHeader>
                <CardContent>
                  <ShippingOptions
                    destinationId={selectedSubdistrict.id}
                    weight={totalWeight}
                    length={dimensions.length}
                    width={dimensions.width}
                    height={dimensions.height}
                    onSelect={(option) => {
                      setSelectedCourier(option);
                      setShippingCost(option?.price ?? 0);
                    }}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Catatan</CardTitle>
              </CardHeader>
              <CardContent>
                <Input placeholder="Catatan untuk pesanan (opsional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-md px-3 py-2 mb-3">{error}</p>
            )}
            <OrderSummary
              items={items}
              subtotal={subtotal}
              tax={tax}
              shipping={shipping}
              total={total}
              shippingMethod={selectedCourier?.name}
              isSubmitting={isSubmitting}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </div>
      </form>
    </main>
  );
}
```

Run: `npx tsc --noEmit` — Expected: no TypeScript errors.

- [ ] **Step 2: Commit**

```bash
git add app/checkout/page.tsx
git commit -m "feat: integrate subdistrict search and shipping cost into checkout"
```

---

### Task 11: Update OrderSummary with shippingMethod prop

**Files:**
- Modify: `components/checkout/order-summary.tsx`

- [ ] **Step 1: Add shippingMethod prop and display it**

In `components/checkout/order-summary.tsx`:

a) Add `shippingMethod` to the props interface:

```typescript
interface OrderSummaryProps {
  items: OrderSummaryItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingMethod?: string;
  isSubmitting?: boolean;
  isAuthenticated?: boolean;
}
```

b) Add it to destructure:

```typescript
export function OrderSummary({ items, subtotal, tax, shipping, total, shippingMethod, isSubmitting, isAuthenticated }: OrderSummaryProps) {
```

c) In the shipping cost display area (after the shipping line), show the courier name when non-free:

```typescript
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Truck className="size-3" />
                Ongkir
                {shippingMethod && shipping > 0 && (
                  <span className="text-[10px]">({shippingMethod})</span>
                )}
              </span>
              {shipping === 0 ? (
                <span className="text-green-600 text-[10px] font-medium flex items-center gap-0.5">
                  GRATIS
                </span>
              ) : (
                <span>{formatPrice(shipping)}</span>
              )}
            </div>
```

Run: `npx tsc --noEmit` — Expected: no TypeScript errors.

- [ ] **Step 2: Commit**

```bash
git add components/checkout/order-summary.tsx
git commit -m "feat: add shippingMethod display to OrderSummary"
```

---

### Task 12: Final verification

- [ ] **Step 1: Run full type check**

```bash
npx tsc --noEmit
```

Expected: no TypeScript errors.

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: all existing tests + new dimension test PASS.

- [ ] **Step 3: Verify build**

```bash
npx next build
```

Expected: successful build.

- [ ] **Step 4: Quick manual E2E flow**

Run dev server (`npx next dev`) and verify:
1. Add product to cart → product weight stored
2. Go to checkout → subdistrict search works
3. Type "bandung" → dropdown appears with results
4. Select subdistrict → shipping options load
5. Select courier → total updates
6. Submit → order created with shipping cost
