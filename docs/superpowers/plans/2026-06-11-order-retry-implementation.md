# Order Retry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement retry payment flow so users can retry failed Midtrans payments by creating a new order via Strapi's `/retry` endpoint.

**Architecture:** New Next.js API route proxies to Strapi `POST /api/orders/:documentId/retry`. OrderPaymentSection gains `handleRetry` for the "Coba Bayar Lagi" button, and `autoPay` prop from the page level triggers Snap popup automatically after redirect to the new order.

**Tech Stack:** Next.js 15 App Router, TypeScript, Strapi v5 REST API, React Testing Library + Vitest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/api/orders/[orderNumber]/retry/route.ts` | **Create** | Proxy route: fetch order → get documentId → call Strapi `/retry` → pass through response |
| `components/orders/order-payment-section.tsx` | **Edit** | Add `handleRetry`, `retrying` state, `autoPay` prop, separate retry button flow |
| `components/orders/__tests__/order-payment-section.test.tsx` | **Edit** | Add tests for failed state rendering, retry button behavior, autoPay trigger |
| `app/orders/[orderNumber]/page.tsx` | **Edit** | Pass `autoPay` prop from `searchParams` to OrderPaymentSection |

---

### Task 1: Create the retry proxy API route

**Files:**
- Create: `app/api/orders/[orderNumber]/retry/route.ts`

- [ ] **Step 1: Create the route file**

Pattern follows `app/api/orders/[orderNumber]/regenerate-snap-token/route.ts` identically.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const { orderNumber } = await params;
    if (!orderNumber) {
      return NextResponse.json({ error: "Missing order number" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const orderRes = await fetch(
      `${STRAPI_URL}/api/orders?filters[orderNumber][$eq]=${encodeURIComponent(orderNumber)}&populate=*`,
      { headers: authHeaders },
    );

    if (!orderRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch order" },
        { status: orderRes.status },
      );
    }

    const orderData = await orderRes.json();
    const documentId = orderData.data?.[0]?.documentId;

    if (!documentId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const retryRes = await fetch(
      `${STRAPI_URL}/api/orders/${documentId}/retry`,
      { method: "POST", headers: authHeaders },
    );

    const retryData = await retryRes.json().catch(() => null);

    if (!retryRes.ok) {
      return NextResponse.json(
        { error: retryData?.error?.message || "Retry failed" },
        { status: retryRes.status },
      );
    }

    return NextResponse.json(retryData);
  } catch (error) {
    console.error("[POST /orders/retry]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Verify the file exists**

```bash
ls -la app/api/orders/\[orderNumber\]/retry/route.ts
```

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/\[orderNumber\]/retry/route.ts
git commit -m "feat: add retry payment proxy route"
```

---

### Task 2: Write failing tests for OrderPaymentSection retry behavior

**Files:**
- Modify: `components/orders/__tests__/order-payment-section.test.tsx`

- [ ] **Step 1: Add test block for retry flow**

Add new `describe` block before the existing `describe("OrderPaymentSection — Snap onClose..."`:

```typescript
describe("OrderPaymentSection — retry flow", () => {
  let snapCallbacks: { current: Record<string, unknown> | null };

  beforeEach(() => {
    snapCallbacks = { current: null };
    setupSnap(snapCallbacks);
    mockFetch("pending");
  });

  it('renders "Coba Bayar Lagi" button and "Gagal" badge when failed', () => {
    renderSection({ paymentStatus: "failed", snapToken: null });
    expect(screen.getByText("Coba Bayar Lagi")).toBeInTheDocument();
    expect(screen.getByText("Gagal")).toBeInTheDocument();
    expect(screen.queryByText("Bayar Sekarang")).not.toBeInTheDocument();
  });

  it("calls retry API endpoint when Coba Bayar Lagi is clicked", async () => {
    (globalThis as Record<string, unknown>).fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { orderNumber: "ORD-NEW-123", documentId: "doc-new" },
          }),
      });

    renderSection({ paymentStatus: "failed", snapToken: null });

    fireEvent.click(screen.getByText("Coba Bayar Lagi"));

    await waitFor(() => {
      const calls = (globalThis as Record<string, unknown>)
        .fetch as ReturnType<typeof vi.fn>;
      expect(calls).toHaveBeenCalledWith(
        "/api/orders/ORD-001/retry",
        { method: "POST" },
      );
    });
  });

  it("shows error toast on retry API failure", async () => {
    (globalThis as Record<string, unknown>).fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({ error: "Maximum retry limit exceeded" }),
      });

    const { toast } = await import("sonner");

    renderSection({ paymentStatus: "failed", snapToken: null });

    fireEvent.click(screen.getByText("Coba Bayar Lagi"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Maximum retry limit exceeded",
      );
    });
  });

  it("shows spinner on retry button while processing", async () => {
    let resolvePromise: (v: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (globalThis as Record<string, unknown>).fetch = vi
      .fn()
      .mockReturnValueOnce(fetchPromise);

    renderSection({ paymentStatus: "failed", snapToken: null });

    fireEvent.click(screen.getByText("Coba Bayar Lagi"));

    await waitFor(() => {
      expect(screen.getByText("Memproses...")).toBeInTheDocument();
    });

    resolvePromise!({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Failed" }),
    });

    await waitFor(() => {
      expect(screen.getByText("Coba Bayar Lagi")).toBeInTheDocument();
    });
  });

  it("auto-triggers snap.pay on mount when autoPay prop is true", async () => {
    const snap = (window as Record<string, unknown>).snap as {
      pay: ReturnType<typeof vi.fn>;
    };

    renderSection({
      paymentStatus: "pending",
      snapToken: "test-snap-token",
      autoPay: true,
    });

    await waitFor(() => {
      expect(snap.pay).toHaveBeenCalled();
    });
  });

  it("does not auto-trigger when snapToken is null even with autoPay", async () => {
    const snap = (window as Record<string, unknown>).snap as {
      pay: ReturnType<typeof vi.fn>;
    };

    renderSection({
      paymentStatus: "pending",
      snapToken: null,
      autoPay: true,
    });

    await waitFor(() => {
      expect(snap.pay).not.toHaveBeenCalled();
    });
  });
});
```

Note: The `renderSection` helper already accepts an `overrides` object with `autoPay`. No helper changes needed — just pass the autoPlay override in tests.

- [ ] **Step 2: Run tests and verify they FAIL**

```bash
npx vitest run components/orders/__tests__/order-payment-section.test.tsx
```

Expected: Tests fail because `handleRetry` is not yet implemented on the button, and `autoPay` prop is not yet wired.

- [ ] **Step 3: Commit**

```bash
git add components/orders/__tests__/order-payment-section.test.tsx
git commit -m "test: add failing tests for order retry flow"
```

---

### Task 3: Implement autoPay prop on OrderPaymentSection

**Files:**
- Modify: `components/orders/order-payment-section.tsx`

- [ ] **Step 1: Add autoPay prop to interface**

Add `autoPay?: boolean` to `OrderPaymentSectionProps` (line 16):

```typescript
interface OrderPaymentSectionProps {
  orderNumber: string;
  paymentStatus: string;
  totalAmount: number;
  currency?: string;
  snapToken: string | null;
  autoPay?: boolean;
}
```

- [ ] **Step 2: Destructure autoPay in component (line 98)**

```typescript
export function OrderPaymentSection({
  orderNumber,
  paymentStatus,
  snapToken: initialToken,
  autoPay,
}: OrderPaymentSectionProps) {
```

- [ ] **Step 3: Add hasAutoPaid ref (add to existing useRef block)**

After `const pollIntervalRef = useRef<...>(null);` on the next line:

```typescript
  const hasAutoPaid = useRef(false);
```

- [ ] **Step 4: Add useEffect for autoPay (after handlePay useCallback, before the if (paid) return)**

Insert after the closing of `handlePay` useCallback (after `}, [snapToken, orderNumber, router, stopPolling]);`):

```typescript
  useEffect(() => {
    if (autoPay && snapToken && !hasAutoPaid.current) {
      hasAutoPaid.current = true;
      handlePay();
    }
    // Only trigger on mount, eslint disabled for handlePay closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

- [ ] **Step 5: Import useEffect**

Update the React import (line 3):

```typescript
import { useState, useCallback, useRef, useEffect } from "react";
```

- [ ] **Step 6: Commit**

```bash
git add components/orders/order-payment-section.tsx
git commit -m "feat: add autoPay prop to trigger snap popup on mount"
```

---

### Task 4: Implement handleRetry on OrderPaymentSection

**Files:**
- Modify: `components/orders/order-payment-section.tsx`

- [ ] **Step 1: Add retrying state**

After `const [polling, setPolling] = useState(false);` (line 100):

```typescript
  const [paid, setPaid] = useState(paymentStatus === "paid");
  const [retrying, setRetrying] = useState(false);
```

Wait, `paid` is already on line 101. In the current file:

```
  const [snapToken, setSnapToken] = useState<string | null>(initialToken);
  const [polling, setPolling] = useState(false);
  const [paid, setPaid] = useState(paymentStatus === "paid");
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoPaid = useRef(false);
```

Add retrying after paid:

```typescript
  const [paid, setPaid] = useState(paymentStatus === "paid");
  const [retrying, setRetrying] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoPaid = useRef(false);
```

- [ ] **Step 2: Add handleRetry function**

Insert after `handlePay` useCallback (after line 195, before the `if (paid)` return):

```typescript
  const handleRetry = useCallback(async () => {
    setLoading(true);
    setRetrying(true);
    try {
      const res = await fetch(`/api/orders/${orderNumber}/retry`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal memproses retry");
      }
      const data = await res.json();
      const newOrderNumber = data.data?.orderNumber;
      if (!newOrderNumber) throw new Error("Gagal memproses retry");
      window.location.href = `/orders/${newOrderNumber}?autoPay=true`;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memproses retry";
      toast.error(message);
      setLoading(false);
      setRetrying(false);
    }
  }, [orderNumber]);
```

- [ ] **Step 3: Wire up button onClick to use handleRetry when failed**

Replace the existing button (lines 241-257) with:

```typescript
      <Button
        onClick={isFailed ? handleRetry : handlePay}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <span className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Memproses...
          </span>
        ) : (
          <span className="flex items-center">
            {isFailed ? (
              <RefreshCw className="mr-2 h-4 w-4" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            {isFailed ? "Coba Bayar Lagi" : "Bayar Sekarang"}
          </span>
        )}
      </Button>
```

- [ ] **Step 4: Commit**

```bash
git add components/orders/order-payment-section.tsx
git commit -m "feat: add handleRetry for failed payment flow"
```

---

### Task 5: Pass autoPay from order detail page

**Files:**
- Modify: `app/orders/[orderNumber]/page.tsx`

- [ ] **Step 1: Update page component to read searchParams and pass autoPay**

The page component signature needs to accept `searchParams`. Change the component props and add `autoPay` extraction:

Replace the interface (line 14-16):

```typescript
interface OrderDetailPageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ autoPay?: string }>;
}
```

Replace the component function signature (line 18) and add searchParams:

```typescript
export default async function OrderDetailPage({ params, searchParams }: OrderDetailPageProps) {
  const { orderNumber } = await params;
  const { autoPay } = await searchParams;
```

- [ ] **Step 2: Pass autoPay to OrderPaymentSection**

Replace the OrderPaymentSection JSX (lines 170-176):

```typescript
              <OrderPaymentSection
                orderNumber={orderNumber}
                paymentStatus={order.paymentStatus ?? "pending"}
                totalAmount={order.totalAmount ?? 0}
                currency={order.currency}
                snapToken={order.midtransSnapToken ?? null}
                autoPay={autoPay === "true"}
              />
```

- [ ] **Step 3: Commit**

```bash
git add app/orders/\[orderNumber\]/page.tsx
git commit -m "feat: pass autoPay from searchParams to OrderPaymentSection"
```

---

### Task 6: Run tests and verify all pass

**Files:** None (verification only)

- [ ] **Step 1: Run the test suite**

```bash
npx vitest run components/orders/__tests__/order-payment-section.test.tsx
```

Expected: All tests PASS, including the new retry tests.

- [ ] **Step 2: Run full test suite to catch regressions**

```bash
npx vitest run
```

Expected: All tests PASS with no new failures.

---

### Task 7: Manual verification checklist

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify the route is reachable**

```bash
curl -X POST http://localhost:3000/api/orders/NONEXISTENT/retry
```

Expected: 404 with `{ "error": "Order not found" }`

- [ ] **Step 3: Create a test order with paymentStatus "failed" via Strapi admin, then visit the order detail page and verify the "Coba Bayar Lagi" button appears**

- [ ] **Step 4: Click "Coba Bayar Lagi" and verify redirect to new order page with `?autoPay=true`**

- [ ] **Step 5: Verify Snap popup opens automatically on the new order page**
