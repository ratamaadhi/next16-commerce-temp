# Voucher Discount Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement voucher preview, cart discount state, checkout discount totals, and order submission support for Strapi Voucher relations.

**Architecture:** Keep discount math in one pure `lib/vouchers.ts` helper and reuse it from cart state and BFF route handlers. The cart stores voucher rules, not a frozen discount amount, so totals stay reactive when quantities change. Next.js route handlers remain the BFF boundary: cart preview can run without auth, while `/api/orders` re-fetches voucher data and never trusts client-provided discount values.

**Tech Stack:** Next.js 16 App Router route handlers, React 19 client components, Zustand persist store, Strapi v5 OpenAPI types, Vitest, Testing Library, Sonner toasts.

---

## Source Spec

- Spec: `docs/superpowers/specs/2026-07-02-voucher-discount-design.md`
- Backend contract note: Strapi now exposes Voucher schemas in `types/strapi.d.ts` and `OrderRequest.data.voucher?: number | string`.
- Project rule: do not commit. Each task ends with a verification checkpoint and suggested commit message only.

---

## File Structure

- Create: `lib/vouchers.ts`
  - Owns `VoucherRules`, `computeDiscount()`, and small validation helpers used by BFF routes.
- Create: `lib/__tests__/vouchers.test.ts`
  - Unit tests for discount math and date/min-purchase helpers.
- Modify: `hooks/use-cart.ts`
  - Adds `AppliedVoucher`, `appliedVoucher`, `setAppliedVoucher()`, `getDiscount()`, and clears voucher on `clearCart()`.
- Modify: `hooks/__tests__/use-cart.test.ts`
  - Tests voucher state and reactive discount behavior.
- Create: `app/api/vouchers/apply/route.ts`
  - BFF preview endpoint. Accepts `{ code, subtotal }`, calls Strapi `GET /vouchers?filters[code][$eqi]=...`, returns `200` with `valid: true/false`.
- Create: `app/api/vouchers/apply/route.test.ts`
  - Tests preview outcomes with mocked `strapiFetch` and optional cookies token.
- Create: `components/cart/voucher-input.tsx`
  - Client UI for entering/removing vouchers.
- Modify: `app/cart/page.tsx`
  - Renders `<VoucherInput />` and discount row.
- Modify: `components/checkout/order-summary.tsx`
  - Adds `discount` prop and renders discount row between subtotal and tax.
- Modify: `app/checkout/page.tsx`
  - Uses cart voucher state, computes `tax` from `subtotal - discount`, sends `voucherDocumentId` and `discount` to `/api/orders`.
- Modify: `app/api/orders/route.ts`
  - Re-fetches voucher on order creation, recomputes discount server-side, forwards `data.voucher` and recomputed `data.discount` to Strapi.
- Modify: `lib/__tests__/orders.test.ts`
  - Verifies `createOrder()` forwards voucher in typed payload if needed.

---

### Task 1: Add Voucher Discount Math

**Files:**
- Create: `lib/vouchers.ts`
- Create: `lib/__tests__/vouchers.test.ts`

- [ ] **Step 1: Write failing tests for discount math**

Create `lib/__tests__/vouchers.test.ts`:

```ts
import { computeDiscount, isVoucherCurrentlyValid, type VoucherRules } from "../vouchers";

describe("computeDiscount", () => {
  it("computes percentage discount", () => {
    const voucher: VoucherRules = {
      documentId: "voucher-1",
      code: "HEMAT10",
      discountType: "percentage",
      discountValue: 10,
      minPurchase: 0,
    };

    expect(computeDiscount(voucher, 200000)).toBe(20000);
  });

  it("caps percentage discount with maxDiscountAmount", () => {
    const voucher: VoucherRules = {
      documentId: "voucher-1",
      code: "HEMAT50",
      discountType: "percentage",
      discountValue: 50,
      maxDiscountAmount: 30000,
      minPurchase: 0,
    };

    expect(computeDiscount(voucher, 200000)).toBe(30000);
  });

  it("computes fixed discount", () => {
    const voucher: VoucherRules = {
      documentId: "voucher-1",
      code: "POTONG20K",
      discountType: "fixed",
      discountValue: 20000,
      minPurchase: 0,
    };

    expect(computeDiscount(voucher, 150000)).toBe(20000);
  });

  it("clamps fixed discount to subtotal", () => {
    const voucher: VoucherRules = {
      documentId: "voucher-1",
      code: "POTONG200K",
      discountType: "fixed",
      discountValue: 200000,
      minPurchase: 0,
    };

    expect(computeDiscount(voucher, 150000)).toBe(150000);
  });

  it("returns 0 when subtotal is below minPurchase", () => {
    const voucher: VoucherRules = {
      documentId: "voucher-1",
      code: "MIN100K",
      discountType: "fixed",
      discountValue: 20000,
      minPurchase: 100000,
    };

    expect(computeDiscount(voucher, 50000)).toBe(0);
  });
});

describe("isVoucherCurrentlyValid", () => {
  it("accepts active voucher within date range", () => {
    const voucher: VoucherRules = {
      documentId: "voucher-1",
      code: "AKTIF",
      discountType: "fixed",
      discountValue: 10000,
      minPurchase: 0,
      isActive: true,
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-12-31T23:59:59.999Z",
    };

    expect(isVoucherCurrentlyValid(voucher, new Date("2026-07-03T00:00:00.000Z"))).toEqual({
      valid: true,
    });
  });

  it("rejects inactive voucher", () => {
    const voucher: VoucherRules = {
      documentId: "voucher-1",
      code: "MATI",
      discountType: "fixed",
      discountValue: 10000,
      minPurchase: 0,
      isActive: false,
    };

    expect(isVoucherCurrentlyValid(voucher, new Date("2026-07-03T00:00:00.000Z"))).toEqual({
      valid: false,
      reason: "inactive",
      message: "Voucher tidak aktif",
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test lib/__tests__/vouchers.test.ts`

Expected: FAIL because `../vouchers` does not exist.

- [ ] **Step 3: Implement voucher helper**

Create `lib/vouchers.ts`:

```ts
export interface VoucherRules {
  documentId: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscountAmount?: number | null;
  minPurchase?: number | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean | null;
}

export type VoucherInvalidReason = "inactive" | "not_started" | "expired";

export function computeDiscount(voucher: VoucherRules | null, subtotal: number): number {
  if (!voucher || subtotal <= 0) return 0;
  const minPurchase = Number(voucher.minPurchase ?? 0);
  if (subtotal < minPurchase) return 0;

  const discountValue = Number(voucher.discountValue ?? 0);
  let discount =
    voucher.discountType === "percentage"
      ? subtotal * (discountValue / 100)
      : discountValue;

  if (voucher.discountType === "percentage" && voucher.maxDiscountAmount) {
    discount = Math.min(discount, Number(voucher.maxDiscountAmount));
  }

  return Math.round(Math.min(discount, subtotal));
}

export function isVoucherCurrentlyValid(
  voucher: VoucherRules,
  now = new Date(),
): { valid: true } | { valid: false; reason: VoucherInvalidReason; message: string } {
  if (voucher.isActive === false) {
    return { valid: false, reason: "inactive", message: "Voucher tidak aktif" };
  }

  if (voucher.startDate && now < new Date(voucher.startDate)) {
    return { valid: false, reason: "not_started", message: "Voucher belum berlaku" };
  }

  if (voucher.endDate && now > new Date(voucher.endDate)) {
    return { valid: false, reason: "expired", message: "Voucher sudah kadaluarsa" };
  }

  return { valid: true };
}

export function toVoucherRules(input: {
  documentId?: string;
  code?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  maxDiscountAmount?: number | null;
  minPurchase?: number | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean | null;
}): VoucherRules | null {
  if (!input.documentId || !input.code || !input.discountType || input.discountValue == null) {
    return null;
  }

  return {
    documentId: input.documentId,
    code: input.code,
    discountType: input.discountType,
    discountValue: input.discountValue,
    maxDiscountAmount: input.maxDiscountAmount ?? null,
    minPurchase: input.minPurchase ?? 0,
    usageLimit: input.usageLimit ?? null,
    usageLimitPerUser: input.usageLimitPerUser ?? null,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    isActive: input.isActive ?? true,
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm test lib/__tests__/vouchers.test.ts`

Expected: PASS.

- [ ] **Checkpoint**

Suggested commit message: `feat(voucher): add discount helper`

---

### Task 2: Extend Cart Store With Applied Voucher State

**Files:**
- Modify: `hooks/use-cart.ts`
- Modify: `hooks/__tests__/use-cart.test.ts`

- [ ] **Step 1: Write failing cart store tests**

Append to `hooks/__tests__/use-cart.test.ts`:

```ts
describe("useCartStore — voucher discount", () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      cartDocumentId: null,
      sessionId: null,
      appliedVoucher: null,
    });
  });

  it("stores and clears an applied voucher", () => {
    useCartStore.getState().setAppliedVoucher({
      documentId: "voucher-doc-1",
      code: "HEMAT10",
      discountType: "percentage",
      discountValue: 10,
      minPurchase: 0,
    });

    expect(useCartStore.getState().appliedVoucher?.code).toBe("HEMAT10");

    useCartStore.getState().setAppliedVoucher(null);

    expect(useCartStore.getState().appliedVoucher).toBeNull();
  });

  it("computes discount reactively from cart total", () => {
    useCartStore.getState().setItems([
      { productId: 1, name: "A", price: 100000, quantity: 2 },
    ]);
    useCartStore.getState().setAppliedVoucher({
      documentId: "voucher-doc-1",
      code: "HEMAT10",
      discountType: "percentage",
      discountValue: 10,
      minPurchase: 0,
    });

    expect(useCartStore.getState().getDiscount()).toBe(20000);

    useCartStore.getState().updateQuantity(1, 3);

    expect(useCartStore.getState().getDiscount()).toBe(30000);
  });

  it("returns 0 discount when subtotal is below minPurchase", () => {
    useCartStore.getState().setItems([
      { productId: 1, name: "A", price: 50000, quantity: 1 },
    ]);
    useCartStore.getState().setAppliedVoucher({
      documentId: "voucher-doc-1",
      code: "MIN100K",
      discountType: "fixed",
      discountValue: 20000,
      minPurchase: 100000,
    });

    expect(useCartStore.getState().getDiscount()).toBe(0);
  });

  it("clears voucher when cart is cleared", () => {
    useCartStore.getState().setItems([
      { productId: 1, name: "A", price: 100000, quantity: 1 },
    ]);
    useCartStore.getState().setAppliedVoucher({
      documentId: "voucher-doc-1",
      code: "HEMAT10",
      discountType: "percentage",
      discountValue: 10,
      minPurchase: 0,
    });

    useCartStore.getState().clearCart();

    expect(useCartStore.getState().appliedVoucher).toBeNull();
    expect(useCartStore.getState().getDiscount()).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test hooks/__tests__/use-cart.test.ts`

Expected: FAIL because voucher store fields do not exist.

- [ ] **Step 3: Modify cart store types and implementation**

In `hooks/use-cart.ts`, add import:

```ts
import { computeDiscount, type VoucherRules } from "@/lib/vouchers";
```

Add exported type near `CartItem`:

```ts
export type AppliedVoucher = VoucherRules;
```

Add to `CartStore`:

```ts
  appliedVoucher: AppliedVoucher | null;
  setAppliedVoucher: (voucher: AppliedVoucher | null) => void;
  getDiscount: () => number;
```

Add initial state inside store:

```ts
      appliedVoucher: null,
```

Change `clearCart` to:

```ts
      clearCart: () => set({ items: [], cartDocumentId: null, appliedVoucher: null }),
```

Add methods near totals:

```ts
      setAppliedVoucher: (voucher) => set({ appliedVoucher: voucher }),

      getDiscount: () => computeDiscount(get().appliedVoucher, get().getTotal()),
```

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm test hooks/__tests__/use-cart.test.ts lib/__tests__/vouchers.test.ts`

Expected: PASS.

- [ ] **Checkpoint**

Suggested commit message: `feat(cart): store applied voucher`

---

### Task 3: Add Voucher Apply BFF Route

**Files:**
- Create: `app/api/vouchers/apply/route.ts`
- Create: `app/api/vouchers/apply/route.test.ts`

- [ ] **Step 1: Write failing route tests**

Create `app/api/vouchers/apply/route.test.ts`:

```ts
import { POST } from "./route";

const { mockStrapiFetch, mockCookies } = vi.hoisted(() => ({
  mockStrapiFetch: vi.fn(),
  mockCookies: vi.fn(),
}));

vi.mock("@/lib/strapi", () => ({
  strapiFetch: (...args: unknown[]) => mockStrapiFetch(...args),
}));

vi.mock("next/headers", () => ({
  cookies: () => mockCookies(),
}));

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/vouchers/apply", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/vouchers/apply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies.mockResolvedValue({ get: () => undefined });
  });

  it("returns valid voucher preview", async () => {
    mockStrapiFetch.mockResolvedValueOnce({
      data: [
        {
          documentId: "voucher-doc-1",
          code: "HEMAT20K",
          discountType: "fixed",
          discountValue: 20000,
          minPurchase: 100000,
          isActive: true,
        },
      ],
    });

    const response = await POST(jsonRequest({ code: "hemat20k", subtotal: 150000 }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      valid: true,
      voucherDocumentId: "voucher-doc-1",
      code: "HEMAT20K",
      discountType: "fixed",
      discountValue: 20000,
      maxDiscountAmount: null,
      minPurchase: 100000,
      discountAmount: 20000,
    });
    expect(mockStrapiFetch).toHaveBeenCalledWith(
      "/vouchers",
      { filters: { code: { $eqi: "hemat20k" } }, pagination: { pageSize: 1 } },
      {},
      undefined,
    );
  });

  it("returns invalid when voucher is missing", async () => {
    mockStrapiFetch.mockResolvedValueOnce({ data: [] });

    const response = await POST(jsonRequest({ code: "NOPE", subtotal: 150000 }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      valid: false,
      reason: "not_found",
      message: "Kode voucher tidak ditemukan",
    });
  });

  it("returns invalid when subtotal is below minPurchase", async () => {
    mockStrapiFetch.mockResolvedValueOnce({
      data: [
        {
          documentId: "voucher-doc-1",
          code: "MIN100K",
          discountType: "fixed",
          discountValue: 20000,
          minPurchase: 100000,
          isActive: true,
        },
      ],
    });

    const response = await POST(jsonRequest({ code: "MIN100K", subtotal: 50000 }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      valid: false,
      reason: "min_purchase",
      message: "Minimal belanja Rp100000 untuk memakai voucher ini",
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test app/api/vouchers/apply/route.test.ts`

Expected: FAIL because route does not exist.

- [ ] **Step 3: Implement route handler**

Create `app/api/vouchers/apply/route.ts`:

```ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { computeDiscount, isVoucherCurrentlyValid, toVoucherRules } from "@/lib/vouchers";
import { strapiFetch } from "@/lib/strapi";
import type { components } from "@/types/strapi";

type Voucher = components["schemas"]["Voucher"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = String(body.code ?? "").trim();
    const subtotal = Number(body.subtotal ?? 0);

    if (!code) {
      return NextResponse.json({
        valid: false,
        reason: "empty_code",
        message: "Masukkan kode voucher",
      });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const response = await strapiFetch<{ data?: Voucher[] }>(
      "/vouchers",
      { filters: { code: { $eqi: code } }, pagination: { pageSize: 1 } },
      {},
      token,
    );

    const voucher = response.data?.[0];
    if (!voucher) {
      return NextResponse.json({
        valid: false,
        reason: "not_found",
        message: "Kode voucher tidak ditemukan",
      });
    }

    const rules = toVoucherRules(voucher);
    if (!rules) {
      return NextResponse.json({
        valid: false,
        reason: "invalid_voucher",
        message: "Voucher tidak valid",
      });
    }

    const dateCheck = isVoucherCurrentlyValid(rules);
    if (!dateCheck.valid) {
      return NextResponse.json(dateCheck);
    }

    const minPurchase = Number(rules.minPurchase ?? 0);
    if (subtotal < minPurchase) {
      return NextResponse.json({
        valid: false,
        reason: "min_purchase",
        message: `Minimal belanja Rp${minPurchase} untuk memakai voucher ini`,
      });
    }

    return NextResponse.json({
      valid: true,
      voucherDocumentId: rules.documentId,
      code: rules.code,
      discountType: rules.discountType,
      discountValue: rules.discountValue,
      maxDiscountAmount: rules.maxDiscountAmount ?? null,
      minPurchase: minPurchase,
      discountAmount: computeDiscount(rules, subtotal),
    });
  } catch (error) {
    console.error("[POST /api/vouchers/apply]", error);
    return NextResponse.json(
      { valid: false, reason: "server_error", message: "Gagal memvalidasi voucher" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm test app/api/vouchers/apply/route.test.ts lib/__tests__/vouchers.test.ts`

Expected: PASS.

- [ ] **Checkpoint**

Suggested commit message: `feat(voucher): add apply route`

---

### Task 4: Add Voucher Input Component

**Files:**
- Create: `components/cart/voucher-input.tsx`

- [ ] **Step 1: Create client voucher input component**

Create `components/cart/voucher-input.tsx`:

```tsx
"use client";

import { useState } from "react";
import { X, Loader2, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/strapi";

export function VoucherInput() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { appliedVoucher, setAppliedVoucher, getTotal, getDiscount } = useCartStore();
  const subtotal = getTotal();
  const discount = getDiscount();

  const minPurchase = Number(appliedVoucher?.minPurchase ?? 0);
  const remaining = Math.max(0, minPurchase - subtotal);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error("Masukkan kode voucher");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/vouchers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed, subtotal }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        toast.error(data.message || "Kode voucher tidak valid");
        return;
      }

      setAppliedVoucher({
        documentId: data.voucherDocumentId,
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxDiscountAmount: data.maxDiscountAmount,
        minPurchase: data.minPurchase,
      });
      setCode("");
      toast.success("Voucher berhasil diterapkan");
    } catch (error) {
      console.error("[VoucherInput]", error);
      toast.error("Gagal menerapkan voucher");
    } finally {
      setLoading(false);
    }
  }

  if (appliedVoucher) {
    return (
      <div className="space-y-2 rounded-md border bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <TicketPercent className="size-3" />
            {appliedVoucher.code}
          </Badge>
          <button
            type="button"
            onClick={() => setAppliedVoucher(null)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Hapus voucher"
          >
            <X className="size-4" />
          </button>
        </div>
        {discount > 0 ? (
          <p className="text-xs text-green-600">Diskon {formatPrice(discount)} diterapkan</p>
        ) : remaining > 0 ? (
          <p className="text-xs text-muted-foreground">
            Kurang {formatPrice(remaining)} lagi untuk pakai voucher ini
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Kode voucher"
          className="h-9 text-sm"
          disabled={loading}
        />
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Terapkan"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Run TypeScript/lint check for component imports**

Run: `pnpm lint`

Expected: PASS or only existing unrelated lint failures. If `Badge`/`Button` import paths differ, adjust to existing UI component paths.

- [ ] **Checkpoint**

Suggested commit message: `feat(cart): add voucher input`

---

### Task 5: Integrate Voucher Preview Into Cart Page

**Files:**
- Modify: `app/cart/page.tsx`

- [ ] **Step 1: Add voucher store data and component import**

Add import:

```ts
import { VoucherInput } from "@/components/cart/voucher-input";
```

Change store destructure:

```ts
const { items, removeItem, updateQuantity, getTotal, getItemCount, getDiscount } = useCartStore();
```

Add after `subtotal`:

```ts
const discount = getDiscount();
const total = Math.max(0, subtotal - discount);
```

- [ ] **Step 2: Add voucher UI and discount rows**

Inside the summary panel in `app/cart/page.tsx`, place `<VoucherInput />` after the first `<Separator />` and before the totals block:

```tsx
<VoucherInput />
<Separator />
```

In the totals block, render discount when positive:

```tsx
{discount > 0 && (
  <div className="flex justify-between text-green-600">
    <span>Diskon</span>
    <span>-{formatPrice(discount)}</span>
  </div>
)}
```

Change total render from `formatPrice(subtotal)` to:

```tsx
{formatPrice(total)}
```

- [ ] **Step 3: Verify cart page compiles**

Run: `pnpm lint`

Expected: PASS or only existing unrelated lint failures.

- [ ] **Checkpoint**

Suggested commit message: `feat(cart): show voucher preview`

---

### Task 6: Update Checkout Summary For Discount

**Files:**
- Modify: `components/checkout/order-summary.tsx`

- [ ] **Step 1: Add discount prop**

Change `OrderSummaryProps`:

```ts
interface OrderSummaryProps {
  items: OrderSummaryItem[];
  subtotal: number;
  discount: number;
  tax: number;
  selectedCourier?: ShippingOption | null;
  total: number;
  isSubmitting?: boolean;
  isAuthenticated?: boolean;
  canSubmit?: boolean;
}
```

Change function signature:

```tsx
export function OrderSummary({
  items,
  subtotal,
  discount,
  tax,
  selectedCourier,
  total,
  isSubmitting,
  isAuthenticated,
  canSubmit,
}: OrderSummaryProps) {
```

- [ ] **Step 2: Render discount between subtotal and tax**

Add after subtotal row:

```tsx
{discount > 0 && (
  <div className="flex justify-between text-xs text-green-600">
    <span>Diskon</span>
    <span>-{formatPrice(discount)}</span>
  </div>
)}
```

- [ ] **Step 3: Run lint to expose callsite errors**

Run: `pnpm lint`

Expected: FAIL until `app/checkout/page.tsx` passes `discount` prop in Task 7.

- [ ] **Checkpoint**

Suggested commit message: `feat(checkout): show discount row`

---

### Task 7: Update Checkout Calculations And Payload

**Files:**
- Modify: `app/checkout/page.tsx`

- [ ] **Step 1: Read voucher state from cart store**

Change cart store destructure:

```ts
const { items, getTotal, clearCart, appliedVoucher, getDiscount, setAppliedVoucher } = useCartStore();
```

Change calculations:

```ts
const subtotal = getTotal();
const discount = getDiscount();
const taxableSubtotal = Math.max(0, subtotal - discount);
const tax = Math.round(taxableSubtotal * TAX_RATE);
const shipping = selectedCourier?.price ?? 0;
const total = taxableSubtotal + tax + shipping;
```

- [ ] **Step 2: Send voucherDocumentId and discount to local `/api/orders`**

In the fetch body, add near totals:

```ts
voucherDocumentId: appliedVoucher?.documentId,
discount,
```

Keep existing `subtotal`, `tax`, `shippingCost`, `totalAmount`, and `currency` fields because the BFF route needs `subtotal` to re-compute discount and the UI still previews local totals.

- [ ] **Step 3: Clear voucher on known voucher rejection**

In the `!response.ok` block, after `toast.error(message);`, add:

```ts
if (
  message === "Voucher tidak ditemukan" ||
  message === "Voucher tidak aktif" ||
  message === "Voucher belum berlaku" ||
  message === "Voucher sudah kadaluarsa" ||
  message === "Kuota voucher sudah habis" ||
  message === "Voucher ini sudah pernah kamu pakai" ||
  message.startsWith("Minimal belanja Rp")
) {
  setAppliedVoucher(null);
}
```

- [ ] **Step 4: Pass discount to OrderSummary**

Update component props:

```tsx
<OrderSummary
  items={items}
  subtotal={subtotal}
  discount={discount}
  tax={tax}
  selectedCourier={selectedCourier}
  total={total}
  isSubmitting={isSubmitting}
  isAuthenticated={isAuthenticated}
  canSubmit={canSubmit}
/>
```

- [ ] **Step 5: Run lint**

Run: `pnpm lint`

Expected: PASS or only existing unrelated lint failures.

- [ ] **Checkpoint**

Suggested commit message: `feat(checkout): submit voucher`

---

### Task 8: Recompute Discount In Order BFF Route

**Files:**
- Modify: `app/api/orders/route.ts`

- [ ] **Step 1: Import voucher helpers and types**

Add imports:

```ts
import { computeDiscount, toVoucherRules } from "@/lib/vouchers";
import type { components } from "@/types/strapi";
```

Add type alias near imports:

```ts
type Voucher = components["schemas"]["Voucher"];
```

- [ ] **Step 2: Add helper to fetch voucher rules**

Add below `resolveItemDocumentIds`:

```ts
async function resolveVoucher(voucherDocumentId: unknown, token: string) {
  if (!voucherDocumentId) return null;

  const response = await strapiFetch<{ data?: Voucher[] }>(
    "/vouchers",
    { filters: { documentId: { $eq: String(voucherDocumentId) } }, pagination: { pageSize: 1 } },
    {},
    token,
  );

  const voucher = response.data?.[0];
  return voucher ? toVoucherRules(voucher) : null;
}
```

- [ ] **Step 3: Replace client discount trust with server recomputation**

Before `const order = await createOrder(...)`, add:

```ts
const voucher = await resolveVoucher(body.voucherDocumentId, token);
const discount = voucher ? computeDiscount(voucher, Number(body.subtotal ?? 0)) : 0;
```

In `createOrder({ ... })`, change:

```ts
discount: body.discount ?? 0,
```

to:

```ts
discount,
voucher: voucher?.documentId,
```

- [ ] **Step 4: Verify the route still returns Strapi lifecycle errors untouched**

Keep the existing `StrapiError` block:

```ts
if (error instanceof StrapiError) {
  return NextResponse.json(
    { error: error.message, details: error.details },
    { status: error.status },
  );
}
```

This preserves backend messages like `Voucher tidak aktif`.

- [ ] **Step 5: Run lint**

Run: `pnpm lint`

Expected: PASS or only existing unrelated lint failures.

- [ ] **Checkpoint**

Suggested commit message: `feat(order): validate voucher server-side`

---

### Task 9: Update Order Tests For Voucher Payload

**Files:**
- Modify: `lib/__tests__/orders.test.ts`

- [ ] **Step 1: Add createOrder voucher forwarding test**

Append inside `describe("createOrder", () => { ... })`:

```ts
it("forwards voucher relation in order payload", async () => {
  mockStrapiFetch.mockResolvedValueOnce({
    data: { ...mockOrder, voucher: { documentId: "voucher-doc-1" }, discount: 20000 },
    meta: {},
  });

  const orderWithVoucher = {
    ...orderData,
    voucher: "voucher-doc-1",
    discount: 20000,
  };

  await createOrder(orderWithVoucher, mockToken);

  expect(mockStrapiFetch).toHaveBeenCalledWith(
    "/orders",
    {},
    { method: "POST", body: JSON.stringify({ data: orderWithVoucher }) },
    mockToken,
  );
});
```

- [ ] **Step 2: Run order tests**

Run: `pnpm test lib/__tests__/orders.test.ts`

Expected: PASS. If TypeScript complains about `voucher`, confirm `types/strapi.d.ts` includes `OrderRequest.data.voucher?: number | string`.

- [ ] **Checkpoint**

Suggested commit message: `test(order): cover voucher payload`

---

### Task 10: Manual QA

**Files:**
- No code changes.

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm test lib/__tests__/vouchers.test.ts hooks/__tests__/use-cart.test.ts app/api/vouchers/apply/route.test.ts lib/__tests__/orders.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run lint**

Run: `pnpm lint`

Expected: PASS.

- [ ] **Step 3: Run production build**

Run: `pnpm build`

Expected: PASS.

- [ ] **Step 4: Browser QA against Strapi backend**

Start app: `pnpm dev`

Verify manually:

- Cart page shows voucher input before login.
- Invalid code returns toast `Kode voucher tidak ditemukan`.
- Valid fixed voucher shows discount row and reduced cart total.
- Valid percentage voucher respects `maxDiscountAmount`.
- Subtotal below `minPurchase` keeps the chip but discount is `0` and helper text shows remaining amount.
- Checkout summary shows discount between subtotal and tax.
- Checkout tax is calculated from `subtotal - discount`.
- `POST /api/orders` includes `voucherDocumentId` in request body from browser devtools.
- Order detail page shows server-returned `discount` and `totalAmount`.
- If backend rejects voucher during order creation, toast displays the exact Indonesian message from Strapi and voucher state clears.

- [ ] **Step 5: Update graphify after code changes**

Run: `graphify update .`

Expected: graph outputs refresh without blocking feature verification.

- [ ] **Checkpoint**

Suggested commit message: `feat(voucher): implement discount flow`

---

## Self-Review

- Spec coverage: discount math, cart preview, state storage, checkout tax, BFF apply route, order route recomputation, Strapi error passthrough, and testing are covered.
- Backend extra note: `PUT /api/orders/:id` restriction is not implemented here because current FE has no `PUT /api/orders` call. Keep as non-action unless an order-edit flow is added.
- Security: `/api/orders` recomputes discount from fetched voucher rules and does not trust `body.discount`.
- Known limitation: Next.js route handler only performs preview-friendly validation. Final quota and per-user validation remains authoritative in Strapi lifecycle hook.
