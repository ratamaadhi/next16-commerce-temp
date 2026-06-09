# Midtrans Snap Frontend Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Midtrans Snap payment popup to order detail page with token regeneration and payment status polling.

**Architecture:** Strapi handles all Midtrans logic (token generation, webhook notifications, regenerate). Next.js FE adds: (1) `GET /api/orders/[orderNumber]` route for polling, (2) `POST /api/orders/[orderNumber]/regenerate-snap-token` route to proxy regenerate to Strapi, (3) `OrderPaymentSection` client component with on-demand Snap.js load, `snap.pay()` callbacks, and polling, (4) server component `page.tsx` renders `OrderPaymentSection` passing `documentId`, `midtransSnapToken`, and order data.

**Tech Stack:** Next.js 15 App Router, React 19, Midtrans Snap.js (CDN), Vitest + React Testing Library

---

## File Structure

```
app/api/orders/[orderNumber]/route.ts                    [Create]  — GET: proxy getOrderByNumber for client polling
app/api/orders/[orderNumber]/regenerate-snap-token/route.ts  [Create]  — POST: proxy regenerate to Strapi
components/orders/order-payment-section.tsx               [Create]  — Client component: load Snap.js, snap.pay(), polling
app/orders/[orderNumber]/page.tsx                         [Modify]  — Pass props + render OrderPaymentSection
```

---

### Task 1: Create GET /api/orders/[orderNumber] Route

**Files:**
- Create: `app/api/orders/[orderNumber]/route.ts`

This route enables the client component to poll for updated order status.

- [ ] **Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { strapiFetch } from "@/lib/strapi";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const { orderNumber } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await strapiFetch<{ data: Array<Record<string, unknown>> }>(
      "/orders",
      {
        filters: { orderNumber: { $eq: orderNumber } },
        populate: "*",
      },
      {},
      token,
    );

    const order = response.data?.[0];

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ data: order });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: 8 files, 97 tests pass

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/[orderNumber]/route.ts
git commit -m "feat: add GET order by number API route for polling"
```

---

### Task 2: Create Regenerate Snap Token API Route

**Files:**
- Create: `app/api/orders/[orderNumber]/regenerate-snap-token/route.ts`

This proxies the regenerate request to Strapi. It receives `orderNumber`, fetches the order from Strapi to get `documentId`, then calls Strapi's `/api/orders/{documentId}/regenerate-snap-token`.

- [ ] **Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const { orderNumber } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // 1. Fetch order to get documentId
    const orderRes = await fetch(
      `${STRAPI_URL}/api/orders?filters[orderNumber][$eq]=${encodeURIComponent(orderNumber)}&populate=*`,
      { headers },
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

    // 2. Call Strapi regenerate endpoint
    const regenRes = await fetch(
      `${STRAPI_URL}/api/orders/${documentId}/regenerate-snap-token`,
      { method: "POST", headers },
    );

    const regenData = await regenRes.json().catch(() => null);

    if (!regenRes.ok) {
      return NextResponse.json(
        { error: regenData || "Regenerate failed" },
        { status: regenRes.status },
      );
    }

    return NextResponse.json(regenData);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: 8 files, 97 tests pass

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/[orderNumber]/regenerate-snap-token
git commit -m "feat: add regenerate snap token API route"
```

---

### Task 3: Create OrderPaymentSection Client Component

**Files:**
- Create: `components/orders/order-payment-section.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/strapi";
import { Loader2, CreditCard, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface OrderPaymentSectionProps {
  orderNumber: string;
  paymentStatus: string;
  totalAmount: number;
  currency?: string;
  snapToken: string | null;
}

const POLL_INTERVAL = 3000;
const POLL_MAX = 10;

function getSnapScriptUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ||
    "https://app.sandbox.midtrans.com/snap/snap.js"
  );
}

function loadSnapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window not available"));
      return;
    }
    if ((window as Record<string, unknown>).snap) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = getSnapScriptUrl();
    script.setAttribute(
      "data-client-key",
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
    );
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Snap.js"));
    document.head.appendChild(script);
  });
}

async function regenerateToken(orderNumber: string): Promise<string> {
  const res = await fetch(`/api/orders/${orderNumber}/regenerate-snap-token`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to regenerate token");
  }
  const data = await res.json();
  return data.snapToken || data.token || data.data?.attributes?.midtransSnapToken;
}

function pollPaymentStatus(
  orderNumber: string,
  onPaid: () => void,
  onTimeout: () => void,
) {
  let attempts = 0;
  const interval = setInterval(async () => {
    attempts++;
    try {
      const res = await fetch(`/api/orders/${orderNumber}`);
      if (!res.ok) return;
      const data = await res.json();
      const status = data?.data?.paymentStatus;
      if (status === "paid") {
        clearInterval(interval);
        onPaid();
      }
    } catch {
      // ignore polling errors
    }
    if (attempts >= POLL_MAX) {
      clearInterval(interval);
      onTimeout();
    }
  }, POLL_INTERVAL);
}

export function OrderPaymentSection({
  orderNumber,
  paymentStatus,
  totalAmount,
  currency = "IDR",
  snapToken: initialToken,
}: OrderPaymentSectionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [snapToken, setSnapToken] = useState<string | null>(initialToken);
  const [polling, setPolling] = useState(false);
  const [paid, setPaid] = useState(paymentStatus === "paid");

  const handlePay = useCallback(async () => {
    setLoading(true);
    try {
      await loadSnapScript();

      let token = snapToken;
      if (!token) {
        token = await regenerateToken(orderNumber);
        setSnapToken(token);
      }

      const snap = (window as Record<string, unknown>).snap as {
        pay: (
          token: string,
          callbacks?: {
            onSuccess?: (result: unknown) => void;
            onPending?: (result: unknown) => void;
            onError?: (result: unknown) => void;
            onClose?: () => void;
          },
        ) => void;
      };

      snap.pay(token, {
        onSuccess: () => {
          setPolling(true);
          pollPaymentStatus(
            orderNumber,
            () => {
              setPaid(true);
              setPolling(false);
              router.refresh();
              toast.success("Pembayaran berhasil!");
            },
            () => {
              setPolling(false);
              router.refresh();
              toast.info(
                "Pembayaran sedang diproses. Refresh halaman untuk status terbaru.",
              );
            },
          );
        },
        onPending: () => {
          setPolling(true);
          pollPaymentStatus(
            orderNumber,
            () => {
              setPaid(true);
              setPolling(false);
              router.refresh();
            },
            () => {
              setPolling(false);
            },
          );
        },
        onError: async () => {
          toast.error("Pembayaran gagal. Mencoba generate token baru...");
          try {
            const newToken = await regenerateToken(orderNumber);
            setSnapToken(newToken);
            toast.success("Token baru tersedia. Silakan coba bayar lagi.");
          } catch {
            toast.error("Gagal generate token baru. Silakan coba lagi.");
          }
        },
        onClose: () => {
          toast.info(
            "Popup pembayaran ditutup. Anda dapat membayar kembali nanti.",
          );
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memuat pembayaran";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [snapToken, orderNumber, router]);

  if (paid) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pembayaran</span>
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Lunas
          </Badge>
        </div>
      </div>
    );
  }

  if (polling) {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pembayaran</span>
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Memproses...
          </Badge>
        </div>
      </div>
    );
  }

  const isFailed = paymentStatus === "failed";

  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Pembayaran</span>
        <Badge
          variant="outline"
          className={
            isFailed
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }
        >
          {isFailed ? "Gagal" : "Pending"}
        </Badge>
      </div>
      <Button onClick={handlePay} disabled={loading} className="w-full" size="lg">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            {isFailed ? (
              <RefreshCw className="mr-2 h-4 w-4" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            {isFailed
              ? "Coba Bayar Lagi"
              : `Bayar Sekarang — ${formatPrice(totalAmount, currency)}`}
          </>
        )}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add components/orders/order-payment-section.tsx
git commit -m "feat: add OrderPaymentSection with Midtrans Snap integration"
```

---

### Task 4: Wire into Order Detail Page

**Files:**
- Modify: `app/orders/[orderNumber]/page.tsx`

Replace the existing payment badge section with `OrderPaymentSection` client component.

- [ ] **Step 1: Edit the page**

Add import right after Badge import (line 5 area):
```typescript
import { OrderPaymentSection } from "@/components/orders/order-payment-section";
```

Replace lines 168-181 (payment badge section inside the ringkasan summary):
Before:
```typescript
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pembayaran</span>
                <Badge
                  variant="outline"
                  className={
                    order.paymentStatus === "paid"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }
                >
                  {order.paymentStatus}
                </Badge>
              </div>
```

After:
```typescript
              <Separator />
              <OrderPaymentSection
                orderNumber={orderNumber}
                paymentStatus={order.paymentStatus ?? "pending"}
                totalAmount={order.totalAmount ?? 0}
                currency={order.currency}
                snapToken={order.midtransSnapToken ?? null}
              />
```

The `formatPrice` import on line 6 is still used for item prices/subtotal, so keep it.
The `ORDER_STATUS_TITLES` and `Badge` on lines 4-5 are still used, so keep them.

- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add app/orders/[orderNumber]/page.tsx
git commit -m "feat: wire OrderPaymentSection into order detail page"
```

---

### Task 5: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No new TypeScript errors (3 pre-existing in orders.test.ts are OK)

- [ ] **Step 3: Fix any issues found**

- [ ] **Step 4: Commit if fixes needed**

```bash
git add -A
git commit -m "chore: fix issues after Midtrans integration"
```
