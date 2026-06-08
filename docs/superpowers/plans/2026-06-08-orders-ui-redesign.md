# Orders UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Major redesign of `/orders` (list) and `/orders/[orderNumber]` (detail) pages with timeline-centric, warm minimalist approach.

**Architecture:** Server components by default. Only `OrderFilterBar` is a client component (URL-based filter/search). New reusable components in `components/orders/`. Data flow unchanged — existing `lib/orders.ts` + `lib/strapi.ts`.

**Tech Stack:** Next.js 16 App Router, React 19, shadcn/ui, Tailwind 4, tw-animate-css, lucide-react, vitest

**Test commands:** `npx vitest run` for unit tests, `npx next build` for build verification.

---

### Task 1: Shared orders constants and utilities

**Files:**
- Create: `components/orders/constants.ts`
- Create: `components/orders/__tests__/constants.test.ts`

- [ ] **Step 1: Write the test file**

Create `components/orders/__tests__/constants.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  ORDER_STATUSES,
  ORDER_STATUS_TITLES,
  getStatusBadgeClass,
  getTimelineSteps,
} from "../constants";

describe("ORDER_STATUSES", () => {
  it("contains all order statuses", () => {
    expect(ORDER_STATUSES).toEqual([
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ]);
  });
});

describe("ORDER_STATUS_TITLES", () => {
  it("maps each status to a display title", () => {
    expect(ORDER_STATUS_TITLES.pending).toBe("Pending");
    expect(ORDER_STATUS_TITLES.processing).toBe("Processing");
    expect(ORDER_STATUS_TITLES.shipped).toBe("Dikirim");
    expect(ORDER_STATUS_TITLES.delivered).toBe("Selesai");
    expect(ORDER_STATUS_TITLES.cancelled).toBe("Dibatalkan");
  });
});

describe("getStatusBadgeClass", () => {
  it("returns amber classes for pending", () => {
    expect(getStatusBadgeClass("pending")).toContain("bg-amber-50");
    expect(getStatusBadgeClass("pending")).toContain("text-amber-700");
  });

  it("returns blue classes for processing", () => {
    expect(getStatusBadgeClass("processing")).toContain("bg-blue-50");
    expect(getStatusBadgeClass("processing")).toContain("text-blue-700");
  });

  it("returns purple classes for shipped", () => {
    expect(getStatusBadgeClass("shipped")).toContain("bg-purple-50");
    expect(getStatusBadgeClass("shipped")).toContain("text-purple-700");
  });

  it("returns green classes for delivered", () => {
    expect(getStatusBadgeClass("delivered")).toContain("bg-green-50");
    expect(getStatusBadgeClass("delivered")).toContain("text-green-700");
  });

  it("returns red classes for cancelled", () => {
    expect(getStatusBadgeClass("cancelled")).toContain("bg-red-50");
    expect(getStatusBadgeClass("cancelled")).toContain("text-red-700");
  });

  it("returns gray classes for unknown status", () => {
    expect(getStatusBadgeClass("unknown_xyz")).toContain("bg-muted");
    expect(getStatusBadgeClass("unknown_xyz")).toContain("text-muted-foreground");
  });
});

describe("getTimelineSteps", () => {
  it("returns 4 base steps in order", () => {
    const steps = getTimelineSteps();
    expect(steps).toHaveLength(4);
    expect(steps[0]).toMatchObject({ key: "pending", label: "Pending" });
    expect(steps[1]).toMatchObject({ key: "processing", label: "Processing" });
    expect(steps[2]).toMatchObject({ key: "shipped", label: "Dikirim" });
    expect(steps[3]).toMatchObject({ key: "delivered", label: "Selesai" });
  });

  it("marks steps as completed before current status", () => {
    const steps = getTimelineSteps("processing");
    expect(steps[0].completed).toBe(true);
    expect(steps[1].completed).toBe(false);
    expect(steps[2].completed).toBe(false);
    expect(steps[3].completed).toBe(false);
  });

  it("marks current step as active", () => {
    const steps = getTimelineSteps("processing");
    expect(steps[0].active).toBe(false);
    expect(steps[1].active).toBe(true);
    expect(steps[2].active).toBe(false);
    expect(steps[3].active).toBe(false);
  });

  it("does not return timeline for cancelled orders", () => {
    const steps = getTimelineSteps("cancelled");
    expect(steps).toEqual([]);
  });

  it("returns completed timeline for delivered", () => {
    const steps = getTimelineSteps("delivered");
    expect(steps.every((s) => s.completed)).toBe(true);
    expect(steps[3].active).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run components/orders/__tests__/constants.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `components/orders/constants.ts`**

```typescript
export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_TITLES: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Dikirim",
  delivered: "Selesai",
  cancelled: "Dibatalkan",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export function getStatusBadgeClass(status: string): string {
  return STATUS_BADGE_CLASSES[status] ?? "bg-muted text-muted-foreground border-border";
}

interface TimelineStep {
  key: string;
  label: string;
  completed: boolean;
  active: boolean;
}

const TIMELINE_BASE_STEPS = [
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Dikirim" },
  { key: "delivered", label: "Selesai" },
];

export function getTimelineSteps(currentStatus?: string): TimelineStep[] {
  if (currentStatus === "cancelled") return [];
  const currentIdx = TIMELINE_BASE_STEPS.findIndex((s) => s.key === currentStatus);
  return TIMELINE_BASE_STEPS.map((step, idx) => ({
    ...step,
    completed: idx < currentIdx || (currentStatus === "delivered" && idx === currentIdx),
    active: idx === currentIdx,
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run components/orders/__tests__/constants.test.ts
```

Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add components/orders/constants.ts components/orders/__tests__/constants.test.ts
git commit -m "feat: add order constants and timeline step utility"
```

---

### Task 2: OrderTimeline component

**Files:**
- Create: `components/orders/order-timeline.tsx`

- [ ] **Step 1: Create `components/orders/order-timeline.tsx`**

```typescript
import { getTimelineSteps, ORDER_STATUS_TITLES } from "./constants";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface OrderTimelineProps {
  orderStatus?: string;
  className?: string;
}

export function OrderTimeline({ orderStatus, className }: OrderTimelineProps) {
  const steps = getTimelineSteps(orderStatus);
  if (steps.length === 0) return null;

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = steps.length > 1
    ? Math.round((completedCount / (steps.length - 1)) * 100)
    : completedCount > 0 ? 100 : 0;

  return (
    <div className={cn("bg-card rounded-xl border p-6", className)}>
      <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-5">
        Status Pesanan
      </h3>
      <div className="relative">
        {/* Background track */}
        <div className="absolute top-4 left-[calc(12.5%)] right-[calc(12.5%)] h-0.5 bg-border" />
        {/* Progress fill */}
        <div
          className="absolute top-4 left-[calc(12.5%)] h-0.5 bg-primary transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, idx) => (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                  step.completed && "border-primary bg-primary text-primary-foreground",
                  step.active && !step.completed && "border-primary bg-background text-primary",
                  !step.completed && !step.active && "border-border bg-card text-muted-foreground",
                )}
              >
                {step.completed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium transition-colors duration-300",
                  (step.completed || step.active) ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {ORDER_STATUS_TITLES[step.key] ?? step.key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/orders/order-timeline.tsx
git commit -m "feat: add OrderTimeline component"
```

---

### Task 3: OrderEmptyState component

**Files:**
- Create: `components/orders/order-empty-state.tsx`

- [ ] **Step 1: Create `components/orders/order-empty-state.tsx`**

```typescript
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ClipboardList, AlertCircle, Search } from "lucide-react";

interface OrderEmptyStateProps {
  type: "empty" | "error" | "filter-empty";
  onRetry?: () => void;
}

const configs = {
  empty: {
    Icon: ClipboardList,
    title: "Belum Ada Pesanan",
    description: "Kamu belum memiliki pesanan. Yuk mulai belanja dan temukan produk favoritmu!",
  },
  error: {
    Icon: AlertCircle,
    title: "Gagal Memuat Pesanan",
    description: "Terjadi kesalahan saat mengambil data. Coba lagi dalam beberapa saat.",
  },
  "filter-empty": {
    Icon: Search,
    title: "Tidak Ditemukan",
    description: "Tidak ada pesanan dengan filter yang dipilih. Coba filter lain.",
  },
};

export function OrderEmptyState({ type, onRetry }: OrderEmptyStateProps) {
  const config = configs[type];
  const Icon = config.Icon;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-6 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{config.title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{config.description}</p>
      <div className="flex gap-3">
        {type === "empty" && (
          <Link href="/products" className={buttonVariants()}>
            Mulai Belanja
          </Link>
        )}
        {type === "error" && (
          <>
            {onRetry && (
              <button onClick={onRetry} className={buttonVariants()}>
                Coba Lagi
              </button>
            )}
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Kembali ke Beranda
            </Link>
          </>
        )}
        {type === "filter-empty" && onRetry && (
          <button onClick={onRetry} className={buttonVariants({ variant: "outline" })}>
            Reset Filter
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/orders/order-empty-state.tsx
git commit -m "feat: add OrderEmptyState component"
```

---

### Task 4: OrderSkeleton components

**Files:**
- Create: `components/orders/order-skeleton.tsx`

- [ ] **Step 1: Create `components/orders/order-skeleton.tsx`**

```typescript
import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="flex gap-2 mb-3">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-14" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export function OrderListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <CardSkeleton />
      <div className="opacity-60">
        <CardSkeleton />
      </div>
      <div className="opacity-30">
        <CardSkeleton />
      </div>
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      {/* Timeline skeleton */}
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="h-3 w-28 mb-5" />
        <div className="flex justify-between">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <Skeleton className="h-8 w-8 rounded-full mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <Skeleton className="h-3 w-24 mb-4" />
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b last:border-0">
                <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-36 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-card p-5">
            <Skeleton className="h-3 w-32 mb-3" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <Skeleton className="h-3 w-20 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 w-full mb-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Check if `Skeleton` component exists; if not, create it using shadcn**

```bash
ls components/ui/skeleton.tsx 2>/dev/null || echo "NOT FOUND"
```

If NOT FOUND, create it:

```typescript
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

- [ ] **Step 3: Commit**

```bash
git add components/orders/order-skeleton.tsx
git commit -m "feat: add OrderListSkeleton and OrderDetailSkeleton"
```

---

### Task 5: OrderCard component

**Files:**
- Create: `components/orders/order-card.tsx`

- [ ] **Step 1: Create `components/orders/order-card.tsx`**

```typescript
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/strapi";
import { getStatusBadgeClass } from "./constants";
import type { Order } from "@/lib/orders";
import { Package, Calendar } from "lucide-react";

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const itemCount = order.items?.length ?? 0;

  return (
    <Link href={`/orders/${order.orderNumber}`} className="group block">
      <Card className="group-hover:border-primary/30 group-hover:shadow-[0_4px_16px_rgba(212,163,115,0.12)] group-hover:-translate-y-0.5 transition-all duration-200 p-5 gap-0">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="font-bold text-foreground">
              #{order.orderNumber}
            </span>
            <Badge variant="outline" className={`ml-2 ${getStatusBadgeClass(order.orderStatus ?? "")}`}>
              {order.orderStatus}
            </Badge>
          </div>
          <span className="font-bold text-foreground group-hover:text-primary transition-colors duration-200">
            {formatPrice(order.totalAmount ?? 0, order.currency)}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(order.createdAt ?? "")}
          </span>
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1">
            <Package className="h-3 w-3" />
            {itemCount} item
          </span>
        </div>

        {/* Thumbnails + detail link */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {order.items?.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-background bg-muted text-xs font-medium text-muted-foreground"
                title={item.productName}
              >
                {item.productName?.slice(0, 2).toUpperCase() ?? "?"}
              </div>
            ))}
            {itemCount > 4 && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-background bg-muted text-xs text-muted-foreground">
                +{itemCount - 4}
              </div>
            )}
          </div>
          <span className="text-sm text-primary font-medium group-hover:underline">
            Lihat Detail
          </span>
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/orders/order-card.tsx
git commit -m "feat: add OrderCard component with hover effects"
```

---

### Task 6: OrderFilterBar component (client)

**Files:**
- Create: `components/orders/order-filter-bar.tsx`

- [ ] **Step 1: Create `components/orders/order-filter-bar.tsx`**

```typescript
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES, ORDER_STATUS_TITLES } from "./constants";
import { Search, X } from "lucide-react";

export function OrderFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "";
  const currentSearch = searchParams.get("q") ?? "";
  const [searchValue, setSearchValue] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const updateParams = useCallback(
    (status: string, search: string) => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("q", search);
      const query = params.toString();
      router.push(`/orders${query ? `?${query}` : ""}`);
    },
    [router],
  );

  const handleStatusClick = (status: string) => {
    const next = currentStatus === status ? "" : status;
    updateParams(next, currentSearch);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams(currentStatus, value);
    }, 300);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    updateParams(currentStatus, "");
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
      {/* Status chips */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => handleStatusClick(status)}
            className={cn(
              "flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors duration-200",
              currentStatus === status
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
            )}
          >
            {ORDER_STATUS_TITLES[status] ?? status}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative sm:ml-auto sm:w-56">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Cari no. pesanan..."
          className="w-full h-9 rounded-full border bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-shadow"
        />
        {searchValue && (
          <button
            onClick={handleClearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/orders/order-filter-bar.tsx
git commit -m "feat: add OrderFilterBar with status chips and search"
```

---

### Task 7: Rewrite OrdersPage (list)

**Files:**
- Modify: `app/orders/page.tsx`

- [ ] **Step 1: Rewrite `app/orders/page.tsx`**

Remove the old implementation and replace with:

```typescript
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getOrders } from "@/lib/orders";
import { OrderFilterBar } from "@/components/orders/order-filter-bar";
import { OrderCard } from "@/components/orders/order-card";
import { OrderListSkeleton } from "@/components/orders/order-skeleton";
import { OrderEmptyState } from "@/components/orders/order-empty-state";

interface OrdersPageProps {
  searchParams: Promise<{ status?: string; q?: string }>;
}

function filterOrders(orders: Awaited<ReturnType<typeof getOrders>>["data"], status: string, q: string) {
  if (!orders) return [];
  let filtered = orders;
  if (status) {
    filtered = filtered.filter((o) => o.orderStatus === status);
  }
  if (q) {
    const search = q.toLowerCase();
    filtered = filtered.filter((o) => o.orderNumber?.toLowerCase().includes(search));
  }
  return filtered;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/auth/login");

  const params = await searchParams;
  const status = params.status ?? "";
  const q = params.q ?? "";

  const { data: orders } = await getOrders(token);
  const filtered = filterOrders(orders, status, q);

  const hasActiveFilter = status !== "" || q !== "";

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pesanan Saya</h1>
          {orders && (
            <p className="text-sm text-muted-foreground mt-1">
              {filtered?.length ?? 0} pesanan{hasActiveFilter && (orders?.length !== filtered?.length) && ` dari ${orders?.length}`}
            </p>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <OrderFilterBar />
      </Suspense>

      {!filtered?.length ? (
        <OrderEmptyState type={hasActiveFilter ? "filter-empty" : "empty"} />
      ) : (
        <div className="space-y-3">
          {filtered.map((order, idx) => (
            <div
              key={order.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${idx * 80}ms`, opacity: 0 }}
            >
              <OrderCard order={order} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Run build to verify**

```bash
npx next build 2>&1 | tail -20
```

Check for compilation errors. Expected: no errors related to orders page.

- [ ] **Step 3: Commit**

```bash
git add app/orders/page.tsx
git commit -m "feat: redesign orders list page with filter, cards, and states"
```

---

### Task 8: Rewrite OrderDetailPage

**Files:**
- Modify: `app/orders/[orderNumber]/page.tsx`

- [ ] **Step 1: Rewrite `app/orders/[orderNumber]/page.tsx`**

Replace with:

```typescript
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatDate } from "@/lib/strapi";
import { getOrderByNumber } from "@/lib/orders";
import type { Order } from "@/lib/orders";
import { getStatusBadgeClass } from "@/components/orders/constants";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { ArrowLeft, MapPin } from "lucide-react";

interface OrderDetailPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderNumber } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/auth/login");

  const { data: orders } = await getOrderByNumber(orderNumber, token);
  const order = orders?.[0];

  if (!order) notFound();

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Pesanan #{orderNumber}</h1>
        <Badge variant="outline" className={getStatusBadgeClass(order.orderStatus ?? "")}>
          {order.orderStatus}
        </Badge>
      </div>

      {/* Hero Timeline */}
      <div className="mb-6">
        <OrderTimeline orderStatus={order.orderStatus} />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: items, shipping, notes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-4">
              Item Pesanan ({order.items?.length ?? 0})
            </h3>
            <div className="divide-y">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                    {item.productName?.slice(0, 2).toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {item.productName}
                    </p>
                    {item.variantInfo && (
                      <p className="text-xs text-muted-foreground">{item.variantInfo}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(item.unitPrice ?? 0)} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium text-sm text-foreground whitespace-nowrap">
                    {formatPrice(item.totalPrice ?? 0)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">
                Alamat Pengiriman
              </h3>
              <div className="flex gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm text-foreground space-y-0.5">
                  <p className="font-medium">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
                  <p className="text-muted-foreground">{order.shippingAddress.addressLine1}</p>
                  <p className="text-muted-foreground">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </p>
                  <p className="text-muted-foreground">{order.shippingAddress.country}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">
                Catatan
              </h3>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right: summary */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-card p-5 lg:sticky lg:top-24">
            <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-4">
              Ringkasan
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal</span>
                <span>{formatDate(order.createdAt ?? "")}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal ?? 0, order.currency)}</span>
              </div>
              {(order.tax ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pajak</span>
                  <span>{formatPrice(order.tax ?? 0, order.currency)}</span>
                </div>
              )}
              {(order.shippingCost ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ongkos Kirim</span>
                  <span>{formatPrice(order.shippingCost ?? 0, order.currency)}</span>
                </div>
              )}
              {(order.discount ?? 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="text-muted-foreground">Diskon</span>
                  <span>-{formatPrice(order.discount ?? 0, order.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.totalAmount ?? 0, order.currency)}</span>
              </div>
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
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Run build to verify**

```bash
npx next build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/orders/[orderNumber]/page.tsx
git commit -m "feat: redesign order detail page with timeline and improved layout"
```

---

### Task 9: Add entrance animation support

**Files:**
- Modify: `app/globals.css` (append)

- [ ] **Step 1: Append card entrance animation to `app/globals.css`**

Add these keyframes and utility class (the `animate-fade-in-up` already exists; add `animate-slide-up`):

```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 0.4s ease-out forwards;
}
```

The existing `animate-fade-in-up` class is already used by the list page cards with `animation-delay`. Verify it works with the existing `animate-delay-*` classes.

- [ ] **Step 2: Run build to verify**

```bash
npx next build 2>&1 | tail -5
```

Expected: no CSS-related errors.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add slide-up entrance animation"
```

---

### Task 10: Final verification and cleanup

**Files:**
- Modify: `app/orders/page.tsx` (remove `console.log` if present)

- [ ] **Step 1: Remove debug `console.log` from orders page**

Check that `app/orders/page.tsx` has no `console.log("orders", orders);` statement (the old code had one). Remove if found.

- [ ] **Step 2: Run full build**

```bash
npx next build 2>&1
```

Expected: successful build, no warnings about unused imports/variables.

- [ ] **Step 3: Run tests**

```bash
npx vitest run
```

Expected: all existing + new tests pass.

- [ ] **Step 4: Run lint**

```bash
npx next lint 2>&1
```

Expected: no errors (existing warnings about `img` elements are pre-existing, not from our changes).

- [ ] **Step 5: Final commit**

```bash
git add -A && git diff --cached --stat
```

Review diff, then:

```bash
git commit -m "feat: complete orders UI redesign with timeline-centric design"
```

---

## Verification Checklist

Before marking complete:
- [ ] `npx vitest run` — all tests pass
- [ ] `npx next build` — builds without errors
- [ ] Orders list page renders: header, filter chips, search, cards with thumbnails, empty state
- [ ] Order detail page renders: timeline, items with placeholders, shipping, notes, summary sidebar
- [ ] Filter chips toggle correctly (URL params update)
- [ ] Search input debounces and filters
- [ ] Skeleton components match layout
- [ ] Empty state shows with CTA
- [ ] Responsive: mobile stack, desktop 2-column
- [ ] Hover effects on cards (lift, shadow, border glow)
- [ ] Timeline fills correctly for each status
