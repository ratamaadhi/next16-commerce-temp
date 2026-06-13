# Product Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to write product reviews from delivered order detail pages (Shadcn Dialog), and display approved reviews with rating summary on product detail pages.

**Architecture:** Next.js API route (`/api/reviews`) acts as validation proxy — checks JWT ownership + order `delivered` status before forwarding to Strapi POST `/reviews`. `verified` and `user` fields are set by Strapi lifecycle hooks (FE never sends them). Product detail page populates only `approved` reviews and renders them with a rating summary (average + star breakdown) and "Muat lebih banyak" pagination.

**Tech Stack:** Next.js 15 App Router, TypeScript, Strapi v5 REST API, Shadcn (@base-ui/react dialog), Sonner toast, Vitest + React Testing Library

**Design Direction:** Warm, editorial e-commerce aesthetic. Earth-toned rating stars (amber/gold), refined card shadows, progressive loading with staggered animation reveals. Clean typography with generous whitespace. Reviews feel like curated testimonials rather than raw data dumps.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/reviews.ts` | **Create** | `createReview()` Strapi wrapper |
| `lib/__tests__/reviews.test.ts` | **Create** | vitest tests for `createReview` |
| `app/api/reviews/route.ts` | **Create** | POST handler: JWT + order validation proxy |
| `components/reviews/star-rating-input.tsx` | **Create** | Interactive star picker (client, hover/click) |
| `components/reviews/review-form.tsx` | **Create** | Rating + title + comment form (client) |
| `components/reviews/review-dialog.tsx` | **Create** | Dialog trigger button + form wrapper (client) |
| `components/reviews/rating-summary.tsx` | **Create** | Average + star breakdown bars (server, presentational) |
| `components/reviews/review-list.tsx` | **Create** | Review cards with pagination (client) |
| `components/reviews/review-section.tsx` | **Modify** | Server container: RatingSummary + ReviewList |
| `app/orders/[orderNumber]/page.tsx` | **Modify** | Add ReviewDialog per item when `delivered` |
| `lib/products.ts` | **Modify** | Filter populated reviews to `approved` only |
| `app/products/[slug]/page.tsx` | **Modify** | Pass `reviews` to ReviewSection |

---

## Shared Types

### lib/reviews.ts

```typescript
export interface ReviewSubmission {
  rating: number;        // 1-5
  title: string;
  comment: string;
  productDocumentId: string;
  orderNumber: string;
}

export interface ReviewItem {
  id: number;
  documentId?: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  reviewStatus?: "pending" | "approved" | "rejected";
  createdAt: string;
  user?: {
    id?: number;
    documentId?: string;
    username?: string;
  };
}
```

All components that display reviews use `ReviewItem`. `ReviewSubmission` is the shape sent from the review form to the API route.

---

### Task 1: Create `lib/reviews.ts` + tests

**Files:**
- Create: `lib/reviews.ts`
- Create: `lib/__tests__/reviews.test.ts`

- [ ] **Step 1: Write `lib/__tests__/reviews.test.ts` (failing test)**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createReview } from "../reviews";

const { mockStrapiFetch, MockStrapiError } = vi.hoisted(() => ({
  mockStrapiFetch: vi.fn(),
  MockStrapiError: class extends Error {
    status: number;
    constructor(message: string, status: number, public details?: unknown) {
      super(message);
      this.name = "StrapiError";
      this.status = status;
    }
  },
}));

vi.mock("../strapi", () => ({
  strapiFetch: (...args: unknown[]) => mockStrapiFetch(...args),
  StrapiError: MockStrapiError,
}));

const mockToken = "valid-jwt-token";

const mockReviewData = {
  rating: 5,
  title: "Great product",
  comment: "Really love this!",
  reviewStatus: "pending",
  product: "prod-doc-1",
};

describe("createReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls strapiFetch with correct POST endpoint and body", async () => {
    mockStrapiFetch.mockResolvedValueOnce({
      data: {
        id: 1,
        documentId: "rev-doc-1",
        rating: 5,
        title: "Great product",
        comment: "Really love this!",
        reviewStatus: "pending",
      },
      meta: {},
    });

    await createReview(mockReviewData, mockToken);

    expect(mockStrapiFetch).toHaveBeenCalledWith(
      "/reviews",
      {},
      {
        method: "POST",
        body: JSON.stringify({ data: mockReviewData }),
      },
      mockToken,
    );
  });

  it("throws StrapiError on failure", async () => {
    mockStrapiFetch.mockRejectedValueOnce(
      new MockStrapiError("Bad Request", 400),
    );

    await expect(createReview(mockReviewData, mockToken)).rejects.toThrow(
      MockStrapiError,
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run lib/__tests__/reviews.test.ts
```

Expected: FAIL — `createReview` not exported from `../reviews`.

- [ ] **Step 3: Create `lib/reviews.ts`**

```typescript
import { strapiFetch, StrapiError } from "./strapi";
import type { components } from "@/types/strapi";

type ReviewRequest = components["schemas"]["ReviewRequest"];
type ReviewResponse = components["schemas"]["ReviewResponse"];

export interface ReviewSubmission {
  rating: number;
  title: string;
  comment: string;
  productDocumentId: string;
  orderNumber: string;
}

export interface ReviewItem {
  id: number;
  documentId?: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  reviewStatus?: "pending" | "approved" | "rejected";
  createdAt: string;
  user?: {
    id?: number;
    documentId?: string;
    username?: string;
  };
}

export async function createReview(
  data: ReviewRequest["data"],
  token: string,
): Promise<ReviewResponse> {
  return strapiFetch<ReviewResponse>(
    "/reviews",
    {},
    {
      method: "POST",
      body: JSON.stringify({ data }),
    },
    token,
  );
}

export { StrapiError };
export type { ReviewResponse };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run lib/__tests__/reviews.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/reviews.ts lib/__tests__/reviews.test.ts
git commit -m "feat: add review data layer with createReview"
```

---

### Task 2: Create `app/api/reviews/route.ts` — validation proxy

**Files:**
- Create: `app/api/reviews/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createReview, type ReviewSubmission } from "@/lib/reviews";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ReviewSubmission = await req.json();

    if (!body.rating || !body.title || !body.comment || !body.productDocumentId || !body.orderNumber) {
      return NextResponse.json(
        { error: "Missing required fields: rating, title, comment, productDocumentId, orderNumber" },
        { status: 400 },
      );
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (body.title.length > 200) {
      return NextResponse.json({ error: "Title must be 200 characters or less" }, { status: 400 });
    }

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const orderRes = await fetch(
      `${STRAPI_URL}/api/orders?filters[orderNumber][$eq]=${encodeURIComponent(body.orderNumber)}&populate=*`,
      { headers: authHeaders },
    );

    if (!orderRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch order" },
        { status: orderRes.status },
      );
    }

    const orderData = await orderRes.json();
    const order = orderData.data?.[0];

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.orderStatus !== "delivered") {
      return NextResponse.json(
        { error: "Only delivered orders can be reviewed" },
        { status: 403 },
      );
    }

    const itemMatch = order.items?.some(
      (item: { productDocumentId?: string }) =>
        item.productDocumentId === body.productDocumentId,
    );

    if (!itemMatch) {
      return NextResponse.json(
        { error: "Product not found in this order" },
        { status: 403 },
      );
    }

    const review = await createReview(
      {
        rating: body.rating,
        title: body.title,
        comment: body.comment,
        reviewStatus: "pending",
        product: body.productDocumentId,
      },
      token,
    );

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("[POST /api/reviews]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Verify the route file exists and compiles**

```bash
npx tsc --noEmit app/api/reviews/route.ts 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add app/api/reviews/route.ts
git commit -m "feat: add review submission API route with double-layer validation"
```

---

### Task 3: Create `components/reviews/star-rating-input.tsx`

**Files:**
- Create: `components/reviews/star-rating-input.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export function StarRatingInput({ value, onChange, disabled = false }: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const displayValue = hoverValue || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHoverValue(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className={cn(
            "p-0.5 transition-transform duration-150 rounded-sm",
            !disabled && "hover:scale-110 cursor-pointer",
            disabled && "cursor-default",
          )}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          onClick={() => !disabled && onChange(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "size-6 transition-colors duration-150",
              star <= displayValue
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-muted-foreground/30",
            )}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reviews/star-rating-input.tsx
git commit -m "feat: add interactive star rating input component"
```

---

### Task 4: Create `components/reviews/review-form.tsx`

**Files:**
- Create: `components/reviews/review-form.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { StarRatingInput } from "./star-rating-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReviewFormProps {
  productDocumentId: string;
  orderNumber: string;
  onSuccess?: () => void;
  onClose: () => void;
}

export function ReviewForm({ productDocumentId, orderNumber, onSuccess, onClose }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = rating > 0 && title.trim().length > 0 && comment.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim(),
          comment: comment.trim(),
          productDocumentId,
          orderNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal mengirim review");
        return;
      }

      toast.success("Review terkirim! Menunggu moderasi.");
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center gap-1.5">
        <Label className="text-xs text-muted-foreground">Rating</Label>
        <StarRatingInput value={rating} onChange={setRating} disabled={isSubmitting} />
        {rating > 0 && (
          <p className="text-xs text-muted-foreground">
            {rating === 5 ? "Luar Biasa!" : rating === 4 ? "Bagus!" : rating === 3 ? "Cukup" : rating === 2 ? "Kurang" : "Buruk"}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor="review-title">
          Judul Review
        </Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ringkasan pengalaman Anda"
          maxLength={200}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor="review-comment">
          Ulasan Anda
        </Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ceritakan pengalaman Anda dengan produk ini..."
          rows={4}
          required
          disabled={isSubmitting}
        />
      </div>

      <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Mengirim...
          </>
        ) : (
          "Kirim Review"
        )}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reviews/review-form.tsx
git commit -m "feat: add review form with star rating, title, and comment"
```

---

### Task 5: Create `components/reviews/review-dialog.tsx`

**Files:**
- Create: `components/reviews/review-dialog.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquareText } from "lucide-react";
import { ReviewForm } from "./review-form";

interface ReviewDialogProps {
  productDocumentId: string;
  productName?: string;
  orderNumber: string;
}

export function ReviewDialog({ productDocumentId, productName, orderNumber }: ReviewDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <MessageSquareText className="size-3.5" />
        Tulis Review
      </Button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tulis Review</DialogTitle>
          <DialogDescription>
            {productName ? (
              <>Bagikan pengalaman Anda menggunakan <span className="font-medium text-foreground">{productName}</span></>
            ) : (
              "Bagikan pengalaman Anda dengan produk ini"
            )}
          </DialogDescription>
        </DialogHeader>

        <ReviewForm
          productDocumentId={productDocumentId}
          orderNumber={orderNumber}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reviews/review-dialog.tsx
git commit -m "feat: add review dialog with trigger button and form"
```

---

### Task 6: Modify `app/orders/[orderNumber]/page.tsx` — integrate review buttons

**Files:**
- Modify: `app/orders/[orderNumber]/page.tsx:1-187`

- [ ] **Step 1: Add import for ReviewDialog**

Edit `app/orders/[orderNumber]/page.tsx`. At line 11, after the `Image` import, add:

```typescript
import { ReviewDialog } from "@/components/reviews/review-dialog";
```

- [ ] **Step 2: Add "Tulis Review" button in each order item**

Find the item loop: lines 64-93. After the `totalPrice` paragraph (line 93, just before the closing `</div>` on line 93), add the review button below the item content. The exact edit should add a new div after the price line (end of line 93):

For the edit at line 93, replace:
```typescript
                  <p className="font-medium text-sm text-foreground whitespace-nowrap">
                    {formatPrice(item.totalPrice ?? 0)}
                  </p>
                </div>
```

With:
```typescript
                  <p className="font-medium text-sm text-foreground whitespace-nowrap">
                    {formatPrice(item.totalPrice ?? 0)}
                  </p>
                </div>
                {order.orderStatus === "delivered" && item.productDocumentId && (
                  <div className="mt-2">
                    <ReviewDialog
                      productDocumentId={item.productDocumentId}
                      productName={item.productName}
                      orderNumber={orderNumber}
                    />
                  </div>
                )}
```

The full item block (lines 64-95) should now look like:

```typescript
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground overflow-hidden relative">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName ?? ""}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        item.productName?.slice(0, 2).toUpperCase() ?? "?"
                      )}
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
                  {order.orderStatus === "delivered" && item.productDocumentId && (
                    <div className="mt-2">
                      <ReviewDialog
                        productDocumentId={item.productDocumentId}
                        productName={item.productName}
                        orderNumber={orderNumber}
                      />
                    </div>
                  )}
                </div>
              ))}
```

Note: the item wrapper `<div>` now includes the button below the item content row, so the `divide-y` still works correctly. The outer `py-3` is kept on the item wrapper.

- [ ] **Step 3: Commit**

```bash
git add app/orders/\[orderNumber\]/page.tsx
git commit -m "feat: add review dialog trigger on each order item for delivered orders"
```

---

### Task 7: Create `components/reviews/rating-summary.tsx`

**Files:**
- Create: `components/reviews/rating-summary.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { Star } from "lucide-react";
import type { ReviewItem } from "@/lib/reviews";

interface RatingSummaryProps {
  reviews: ReviewItem[];
}

function getStarCounts(reviews: ReviewItem[]) {
  const counts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    const idx = r.rating - 1;
    if (idx >= 0 && idx < 5) counts[idx]++;
  });
  return counts;
}

export function RatingSummary({ reviews }: RatingSummaryProps) {
  const total = reviews.length;
  if (total === 0) return null;

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
  const counts = getStarCounts(reviews);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-xl border bg-card">
      {/* Big average */}
      <div className="flex flex-col items-center min-w-[80px]">
        <span className="text-4xl font-bold text-foreground tabular-nums">
          {avg.toFixed(1)}
        </span>
        <div className="flex items-center gap-0.5 mt-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={star <= Math.round(avg) ? "size-3.5 fill-amber-400 text-amber-400" : "size-3.5 fill-none text-muted-foreground/30"}
              strokeWidth={1.5}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {total} ulasan
        </span>
      </div>

      {/* Star breakdown bars */}
      <div className="flex-1 w-full space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[star - 1];
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-muted-foreground tabular-nums text-right">
                {star}
              </span>
              <Star className="size-3 fill-amber-400 text-amber-400" strokeWidth={1.5} />
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-muted-foreground tabular-nums text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reviews/rating-summary.tsx
git commit -m "feat: add rating summary with average and star breakdown"
```

---

### Task 8: Create `components/reviews/review-list.tsx`

**Files:**
- Create: `components/reviews/review-list.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviewItem } from "@/lib/reviews";

interface ReviewListProps {
  reviews: ReviewItem[];
}

const PER_PAGE = 5;

export function ReviewList({ reviews }: ReviewListProps) {
  const [visible, setVisible] = useState(PER_PAGE);
  const hasMore = visible < reviews.length;

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Belum ada ulasan untuk produk ini.</p>
        <p className="text-xs mt-1">Jadilah yang pertama memberikan ulasan!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.slice(0, visible).map((review, idx) => (
        <div
          key={review.documentId ?? review.id}
          className="rounded-lg border bg-card p-4 space-y-2 animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${idx % PER_PAGE * 75}ms`, animationFillMode: "backwards" }}
        >
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`size-3.5 ${
                  star <= review.rating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-none text-muted-foreground/30"
                }`}
                strokeWidth={1.5}
              />
            ))}
            {review.verified && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <span className="size-1 rounded-full bg-emerald-500" />
                Verified Purchase
              </span>
            )}
          </div>
          <h4 className="font-semibold text-sm text-foreground">{review.title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{review.user?.username || "Anonim"}</span>
            <span>{new Date(review.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisible((prev) => prev + PER_PAGE)}
          >
            Muat lebih banyak ({reviews.length - visible} ulasan)
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reviews/review-list.tsx
git commit -m "feat: add review list with pagination and verified badge"
```

---

### Task 9: Rewrite `components/reviews/review-section.tsx`

**Files:**
- Modify: `components/reviews/review-section.tsx`

- [ ] **Step 1: Replace the entire file**

Replace all existing content with:

```typescript
import { RatingSummary } from "./rating-summary";
import { ReviewList } from "./review-list";
import type { ReviewItem } from "@/lib/reviews";

interface ReviewSectionProps {
  reviews: ReviewItem[];
}

export function ReviewSection({ reviews }: ReviewSectionProps) {
  return (
    <div className="space-y-6">
      <RatingSummary reviews={reviews} />
      <ReviewList reviews={reviews} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reviews/review-section.tsx
git commit -m "feat: rewrite review section with summary and paginated list"
```

---

### Task 10: Modify `lib/products.ts` — filter reviews to approved only

**Files:**
- Modify: `lib/products.ts:93-98`

- [ ] **Step 1: Change `getProductBySlug` populate from array to filtered object**

Edit `lib/products.ts`. Replace lines 93-98 (the `getProductBySlug` function body):

From:
```typescript
export async function getProductBySlug(slug: string) {
  return strapiFetch<ProductsResponse>("/products", {
    filters: { slug: { $eq: slug } },
    populate: ["images", "categories", "variants", "specifications", "reviews.user"],
  });
}
```

To:
```typescript
export async function getProductBySlug(slug: string) {
  return strapiFetch<ProductsResponse>("/products", {
    filters: { slug: { $eq: slug } },
    populate: {
      images: true,
      categories: true,
      variants: true,
      specifications: true,
      reviews: {
        filters: {
          reviewStatus: { $eq: "approved" },
        },
        populate: ["user"],
      },
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/products.ts
git commit -m "feat: filter product reviews to approved only"
```

---

### Task 11: Modify `app/products/[slug]/page.tsx` — wire up reviews

**Files:**
- Modify: `app/products/[slug]/page.tsx:63-66`

- [ ] **Step 1: Pass reviews to ReviewSection**

Edit `app/products/[slug]/page.tsx`. Replace lines 63-66:

From:
```typescript
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Ulasan</h2>
        <ReviewSection />
      </div>
```

To:
```typescript
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Ulasan</h2>
        <ReviewSection reviews={(product.reviews ?? []) as Array<{ id: number; rating: number; title: string; comment: string; verified: boolean; createdAt: string; user?: { username: string } }>} />
      </div>
```

Wait — we need a cleaner type import. Let's check the `ProductData` type in `lib/products.ts`:

Line 54 of `lib/products.ts` shows:
```typescript
reviews?: Array<{ id: number; rating: number; title: string; comment: string; verified: boolean; createdAt: string; user?: { username: string } }>;
```

The `ReviewSection` now expects `ReviewItem[]` which has `username?: string` as optional. The `ProductData.reviews` user only has `{ username: string }` (required username). This is compatible — we can just cast or rely on structural typing.

The actual edit should be simpler. Since `ProductData.reviews` matches `ReviewItem` structurally enough, we skip the cast and just pass directly:

```typescript
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Ulasan</h2>
        <ReviewSection reviews={(product.reviews ?? []) as any} />
      </div>
```

Actually, let's do it cleanly with a proper cast:

The best approach: the `ProductData.reviews` array elements are compatible with `ReviewItem` since both have `id: number`, `rating: number`, `title: string`, `comment: string`, `verified: boolean`, `createdAt: string`, `user?: { username: string }`. The `ReviewItem` has extra optional fields (`documentId`, `reviewStatus`). So `ProductData.reviews` elements can be treated as `ReviewItem[]` (extra optional fields are OK in TypeScript when passing as props since it's structural).

Actually no, TypeScript would complain because `ReviewItem` has `verified: boolean` (required) and `ProductData.reviews` element also has `verified: boolean` (required). Let's just use `as unknown as ReviewItem[]`:

```typescript
import type { ReviewItem } from "@/lib/reviews";

// ...inside component:
<ReviewSection reviews={(product.reviews ?? []) as unknown as ReviewItem[]} />
```

But adding the import clutters the page. Simpler: just cast inline:

```typescript
<ReviewSection reviews={(product.reviews ?? []) as ReviewItem[]} />
```

This works because the structural types are compatible. TypeScript won't error because `ReviewItem` has more optional fields than the source type, and the required fields match.

OK, let's use this approach — import `ReviewItem` type.

**Actual edit:**

At `app/products/[slug]/page.tsx`, add the import at line 8:
```typescript
import type { ReviewItem } from "@/lib/reviews";
```

Replace lines 63-66:
```typescript
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Ulasan</h2>
        <ReviewSection reviews={product.reviews as ReviewItem[] ?? []} />
      </div>
```

Wait, that's wrong due to operator precedence. Should be:

```typescript
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Ulasan</h2>
        <ReviewSection reviews={(product.reviews as ReviewItem[]) ?? []} />
      </div>
```

Or simpler since the ReviewSection already handles empty:
```typescript
<ReviewSection reviews={(product.reviews ?? []) as ReviewItem[]} />
```

Let's go with the operational edit being:

**Step 1: Edit `app/products/[slug]/page.tsx`**

Add import at line 8:
```typescript
import { StarRatingInput } from "@/lib/reviews";
```

No wait, `ReviewItem` is from `@/lib/reviews`. The import would be:
```typescript
import { ReviewItem } from "@/lib/reviews";
```

Wait, that's a value import, not a type import. Should be:
```typescript
import type { ReviewItem } from "@/lib/reviews";
```

OK let me be precise. The edit:

At line 8 (after the existing imports), add:
```
import type { ReviewItem } from "@/lib/reviews";
```

Replace lines 63-66 from:
```
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Ulasan</h2>
        <ReviewSection />
      </div>
```
to:
```
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Ulasan</h2>
        <ReviewSection reviews={(product.reviews ?? []) as ReviewItem[]} />
      </div>
```

That's what I'll put in the plan.

Actually wait, looking at the existing file again:

Line 6: `import { ReviewSection } from "@/components/reviews/review-section";`
Line 8: `import type { Metadata } from "next";`

I should add the ReviewItem import near the other type imports. Let me put it after line 8:
```
import type { Metadata } from "next";
import type { ReviewItem } from "@/lib/reviews";
```

OK this is getting overly detailed. Let me fix the plan for Task 11 and then write the file.<｜end▁of▁thinking｜>

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="write">
<｜｜DSML｜｜parameter name="content" string="true"># Product Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to write product reviews from delivered order detail pages (Shadcn Dialog), and display approved reviews with rating summary on product detail pages.

**Architecture:** Next.js API route (`/api/reviews`) acts as validation proxy — checks JWT ownership + order `delivered` status before forwarding to Strapi POST `/reviews`. `verified` and `user` fields are set by Strapi lifecycle hooks (FE never sends them). Product detail page populates only `approved` reviews and renders them with a rating summary (average + star breakdown) and "Muat lebih banyak" pagination.

**Tech Stack:** Next.js 15 App Router, TypeScript, Strapi v5 REST API, @base-ui/react Dialog, Sonner toast, Vitest

**Design Direction:** Refined editorial aesthetic. Amber/gold star ratings, clean card shadows, progressive animation reveals. Reviews feel like curated testimonials.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/reviews.ts` | **Create** | `createReview()` Strapi wrapper + types |
| `lib/__tests__/reviews.test.ts` | **Create** | vitest tests for `createReview` |
| `app/api/reviews/route.ts` | **Create** | POST handler: JWT + order validation proxy |
| `components/reviews/star-rating-input.tsx` | **Create** | Interactive star picker (client, hover/click) |
| `components/reviews/review-form.tsx` | **Create** | Rating + title + comment form (client) |
| `components/reviews/review-dialog.tsx` | **Create** | Dialog trigger button + form wrapper (client) |
| `components/reviews/rating-summary.tsx` | **Create** | Average + star breakdown bars (presentational) |
| `components/reviews/review-list.tsx` | **Create** | Review cards with "Muat lebih banyak" pagination (client) |
| `components/reviews/review-section.tsx` | **Modify** | Container: RatingSummary + ReviewList |
| `app/orders/[orderNumber]/page.tsx` | **Modify** | Add ReviewDialog per item when `delivered` |
| `lib/products.ts` | **Modify** | Filter populated reviews to `approved` only |
| `app/products/[slug]/page.tsx` | **Modify** | Pass `reviews` data to ReviewSection |

---

### Task 1: Create `lib/reviews.ts` + tests

**Files:**
- Create: `lib/reviews.ts`
- Create: `lib/__tests__/reviews.test.ts`

- [ ] **Step 1: Write `lib/__tests__/reviews.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createReview } from "../reviews";

const { mockStrapiFetch, MockStrapiError } = vi.hoisted(() => ({
  mockStrapiFetch: vi.fn(),
  MockStrapiError: class extends Error {
    status: number;
    constructor(message: string, status: number, public details?: unknown) {
      super(message);
      this.name = "StrapiError";
      this.status = status;
    }
  },
}));

vi.mock("../strapi", () => ({
  strapiFetch: (...args: unknown[]) => mockStrapiFetch(...args),
  StrapiError: MockStrapiError,
}));

const mockToken = "valid-jwt-token";

const mockReviewData = {
  rating: 5,
  title: "Great product",
  comment: "Really love this!",
  reviewStatus: "pending",
  product: "prod-doc-1",
};

describe("createReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls strapiFetch with correct POST endpoint and body", async () => {
    mockStrapiFetch.mockResolvedValueOnce({
      data: { id: 1, documentId: "rev-doc-1", rating: 5, title: "Great product", comment: "Really love this!", reviewStatus: "pending" },
      meta: {},
    });

    await createReview(mockReviewData, mockToken);

    expect(mockStrapiFetch).toHaveBeenCalledWith(
      "/reviews",
      {},
      { method: "POST", body: JSON.stringify({ data: mockReviewData }) },
      mockToken,
    );
  });

  it("throws StrapiError on failure", async () => {
    mockStrapiFetch.mockRejectedValueOnce(new MockStrapiError("Bad Request", 400));
    await expect(createReview(mockReviewData, mockToken)).rejects.toThrow(MockStrapiError);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run lib/__tests__/reviews.test.ts
```

Expected: FAIL — `createReview` not exported from `../reviews`.

- [ ] **Step 3: Create `lib/reviews.ts`**

```typescript
import { strapiFetch, StrapiError } from "./strapi";
import type { components } from "@/types/strapi";

type ReviewRequest = components["schemas"]["ReviewRequest"];
type ReviewResponse = components["schemas"]["ReviewResponse"];

export interface ReviewSubmission {
  rating: number;
  title: string;
  comment: string;
  productDocumentId: string;
  orderNumber: string;
}

export interface ReviewItem {
  id: number;
  documentId?: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  reviewStatus?: "pending" | "approved" | "rejected";
  createdAt: string;
  user?: {
    id?: number;
    documentId?: string;
    username?: string;
  };
}

export async function createReview(
  data: ReviewRequest["data"],
  token: string,
): Promise<ReviewResponse> {
  return strapiFetch<ReviewResponse>(
    "/reviews",
    {},
    {
      method: "POST",
      body: JSON.stringify({ data }),
    },
    token,
  );
}

export { StrapiError };
export type { ReviewResponse };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run lib/__tests__/reviews.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/reviews.ts lib/__tests__/reviews.test.ts
git commit -m "feat: add review data layer with createReview"
```

---

### Task 2: Create `app/api/reviews/route.ts` — validation proxy

**Files:**
- Create: `app/api/reviews/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createReview, type ReviewSubmission, StrapiError } from "@/lib/reviews";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ReviewSubmission = await req.json();

    if (!body.rating || !body.title || !body.comment || !body.productDocumentId || !body.orderNumber) {
      return NextResponse.json(
        { error: "Missing required fields: rating, title, comment, productDocumentId, orderNumber" },
        { status: 400 },
      );
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (body.title.length > 200) {
      return NextResponse.json({ error: "Title must be 200 characters or less" }, { status: 400 });
    }

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const orderRes = await fetch(
      `${STRAPI_URL}/api/orders?filters[orderNumber][$eq]=${encodeURIComponent(body.orderNumber)}&populate=*`,
      { headers: authHeaders },
    );

    if (!orderRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch order" },
        { status: orderRes.status },
      );
    }

    const orderData = await orderRes.json();
    const order = orderData.data?.[0];

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.orderStatus !== "delivered") {
      return NextResponse.json(
        { error: "Only delivered orders can be reviewed" },
        { status: 403 },
      );
    }

    const itemMatch = order.items?.some(
      (item: { productDocumentId?: string }) =>
        item.productDocumentId === body.productDocumentId,
    );

    if (!itemMatch) {
      return NextResponse.json(
        { error: "Product not found in this order" },
        { status: 403 },
      );
    }

    const review = await createReview(
      {
        rating: body.rating,
        title: body.title,
        comment: body.comment,
        reviewStatus: "pending",
        product: body.productDocumentId,
      },
      token,
    );

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof StrapiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status },
      );
    }
    console.error("[POST /api/reviews]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/reviews/route.ts
git commit -m "feat: add review submission API route with double-layer validation"
```

---

### Task 3: Create `components/reviews/star-rating-input.tsx`

**Files:**
- Create: `components/reviews/star-rating-input.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export function StarRatingInput({ value, onChange, disabled = false }: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const displayValue = hoverValue || value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHoverValue(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className={cn(
            "p-0.5 transition-transform duration-150 rounded-sm",
            !disabled && "hover:scale-110 cursor-pointer",
            disabled && "cursor-default",
          )}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          onClick={() => !disabled && onChange(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "size-6 transition-colors duration-150",
              star <= displayValue
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-muted-foreground/30",
            )}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reviews/star-rating-input.tsx
git commit -m "feat: add interactive star rating input component"
```

---

### Task 4: Create `components/reviews/review-form.tsx`

**Files:**
- Create: `components/reviews/review-form.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { StarRatingInput } from "./star-rating-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReviewFormProps {
  productDocumentId: string;
  orderNumber: string;
  onSuccess?: () => void;
  onClose: () => void;
}

export function ReviewForm({ productDocumentId, orderNumber, onSuccess, onClose }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = rating > 0 && title.trim().length > 0 && comment.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim(),
          comment: comment.trim(),
          productDocumentId,
          orderNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal mengirim review");
        return;
      }

      toast.success("Review terkirim! Menunggu moderasi.");
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center gap-1.5">
        <Label className="text-xs text-muted-foreground">Rating</Label>
        <StarRatingInput value={rating} onChange={setRating} disabled={isSubmitting} />
        {rating > 0 && (
          <p className="text-xs text-muted-foreground">
            {rating === 5 ? "Luar Biasa!" : rating === 4 ? "Bagus!" : rating === 3 ? "Cukup" : rating === 2 ? "Kurang" : "Buruk"}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor="review-title">Judul Review</Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ringkasan pengalaman Anda"
          maxLength={200}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor="review-comment">Ulasan Anda</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ceritakan pengalaman Anda dengan produk ini..."
          rows={4}
          required
          disabled={isSubmitting}
        />
      </div>

      <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Mengirim...
          </>
        ) : (
          "Kirim Review"
        )}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reviews/review-form.tsx
git commit -m "feat: add review form with star rating, title, and comment"
```

---

### Task 5: Create `components/reviews/review-dialog.tsx`

**Files:**
- Create: `components/reviews/review-dialog.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquareText } from "lucide-react";
import { ReviewForm } from "./review-form";

interface ReviewDialogProps {
  productDocumentId: string;
  productName?: string;
  orderNumber: string;
}

export function ReviewDialog({ productDocumentId, productName, orderNumber }: ReviewDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <MessageSquareText className="size-3.5" />
        Tulis Review
      </Button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tulis Review</DialogTitle>
          <DialogDescription>
            {productName ? (
              <>Bagikan pengalaman Anda menggunakan <span className="font-medium text-foreground">{productName}</span></>
            ) : (
              "Bagikan pengalaman Anda dengan produk ini"
            )}
          </DialogDescription>
        </DialogHeader>

        <ReviewForm
          productDocumentId={productDocumentId}
          orderNumber={orderNumber}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reviews/review-dialog.tsx
git commit -m "feat: add review dialog with trigger button and form"
```

---

### Task 6: Modify `app/orders/[orderNumber]/page.tsx` — integrate review buttons

**Files:**
- Modify: `app/orders/[orderNumber]/page.tsx`

- [ ] **Step 1: Add import**

Edit line 11, add after `import Image from "next/image";`:

```typescript
import { ReviewDialog } from "@/components/reviews/review-dialog";
```

- [ ] **Step 2: Restructure item loop to add review button**

The current item block is a `<div>` inside `.divide-y` (lines 64-94). Replace the entire item map block (lines 64-94 in the original file — the lines between `<div className="divide-y">` and its closing `</div>`) with:

```typescript
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground overflow-hidden relative">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName ?? ""}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        item.productName?.slice(0, 2).toUpperCase() ?? "?"
                      )}
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
                  {order.orderStatus === "delivered" && item.productDocumentId && (
                    <div className="mt-2">
                      <ReviewDialog
                        productDocumentId={item.productDocumentId}
                        productName={item.productName}
                        orderNumber={orderNumber}
                      />
                    </div>
                  )}
                </div>
              ))}
```

The key changes: each item is now wrapped in an outer `<div className="py-3 first:pt-0 last:pb-0">`, the item content is in an inner `<div className="flex items-center gap-3">`, and the review button sits below it, gated on `order.orderStatus === "delivered" && item.productDocumentId`.

- [ ] **Step 3: Commit**

```bash
git add app/orders/\[orderNumber\]/page.tsx
git commit -m "feat: add review dialog trigger on each order item for delivered orders"
```

---

### Task 7: Create `components/reviews/rating-summary.tsx`

**Files:**
- Create: `components/reviews/rating-summary.tsx`

- [ ] **Step 1: Create the component**

```typescript
import { Star } from "lucide-react";
import type { ReviewItem } from "@/lib/reviews";

interface RatingSummaryProps {
  reviews: ReviewItem[];
}

function getStarCounts(reviews: ReviewItem[]) {
  const counts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    const idx = r.rating - 1;
    if (idx >= 0 && idx < 5) counts[idx]++;
  });
  return counts;
}

export function RatingSummary({ reviews }: RatingSummaryProps) {
  const total = reviews.length;
  if (total === 0) return null;

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
  const counts = getStarCounts(reviews);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-xl border bg-card">
      <div className="flex flex-col items-center min-w-[80px]">
        <span className="text-4xl font-bold text-foreground tabular-nums">
          {avg.toFixed(1)}
        </span>
        <div className="flex items-center gap-0.5 mt-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={
                star <= Math.round(avg)
                  ? "size-3.5 fill-amber-400 text-amber-400"
                  : "size-3.5 fill-none text-muted-foreground/30"
              }
              strokeWidth={1.5}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground mt-1">{total} ulasan</span>
      </div>

      <div className="flex-1 w-full space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[star - 1];
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-muted-foreground tabular-nums text-right">{star}</span>
              <Star className="size-3 fill-amber-400 text-amber-400" strokeWidth={1.5} />
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-muted-foreground tabular-nums text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reviews/rating-summary.tsx
git commit -m "feat: add rating summary with average and star breakdown"
```

---

### Task 8: Create `components/reviews/review-list.tsx`

**Files:**
- Create: `components/reviews/review-list.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviewItem } from "@/lib/reviews";

interface ReviewListProps {
  reviews: ReviewItem[];
}

const PER_PAGE = 5;

export function ReviewList({ reviews }: ReviewListProps) {
  const [visible, setVisible] = useState(PER_PAGE);
  const hasMore = visible < reviews.length;

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">Belum ada ulasan untuk produk ini.</p>
        <p className="text-xs mt-1">Jadilah yang pertama memberikan ulasan!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.slice(0, visible).map((review, idx) => (
        <div
          key={review.documentId ?? review.id}
          className="rounded-lg border bg-card p-4 space-y-2 animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${idx % PER_PAGE * 75}ms`, animationFillMode: "backwards" }}
        >
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`size-3.5 ${
                  star <= review.rating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-none text-muted-foreground/30"
                }`}
                strokeWidth={1.5}
              />
            ))}
            {review.verified && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <span className="size-1 rounded-full bg-emerald-500" />
                Verified Purchase
              </span>
            )}
          </div>
          <h4 className="font-semibold text-sm text-foreground">{review.title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{review.user?.username || "Anonim"}</span>
            <span>
              {new Date(review.createdAt).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisible((prev) => prev + PER_PAGE)}
          >
            Muat lebih banyak ({reviews.length - visible} ulasan)
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reviews/review-list.tsx
git commit -m "feat: add review list with pagination and verified badge"
```

---

### Task 9: Rewrite `components/reviews/review-section.tsx`

**Files:**
- Modify: `components/reviews/review-section.tsx`

- [ ] **Step 1: Replace the entire file**

```typescript
import { RatingSummary } from "./rating-summary";
import { ReviewList } from "./review-list";
import type { ReviewItem } from "@/lib/reviews";

interface ReviewSectionProps {
  reviews: ReviewItem[];
}

export function ReviewSection({ reviews }: ReviewSectionProps) {
  return (
    <div className="space-y-6">
      <RatingSummary reviews={reviews} />
      <ReviewList reviews={reviews} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/reviews/review-section.tsx
git commit -m "feat: rewrite review section with summary and paginated list"
```

---

### Task 10: Modify `lib/products.ts` — filter reviews to approved only

**Files:**
- Modify: `lib/products.ts`

- [ ] **Step 1: Change `getProductBySlug` populate from array to filtered object**

Edit `lib/products.ts`. Replace lines 93-98 (the entire `getProductBySlug` function body):

From:
```typescript
export async function getProductBySlug(slug: string) {
  return strapiFetch<ProductsResponse>("/products", {
    filters: { slug: { $eq: slug } },
    populate: ["images", "categories", "variants", "specifications", "reviews.user"],
  });
}
```

To:
```typescript
export async function getProductBySlug(slug: string) {
  return strapiFetch<ProductsResponse>("/products", {
    filters: { slug: { $eq: slug } },
    populate: {
      images: true,
      categories: true,
      variants: true,
      specifications: true,
      reviews: {
        filters: {
          reviewStatus: { $eq: "approved" },
        },
        populate: ["user"],
      },
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/products.ts
git commit -m "feat: filter product reviews to approved only"
```

---

### Task 11: Modify `app/products/[slug]/page.tsx` — wire up reviews

**Files:**
- Modify: `app/products/[slug]/page.tsx`

- [ ] **Step 1: Add type import and pass reviews to ReviewSection**

Edit `app/products/[slug]/page.tsx`.

Add import at line 8 after `import type { Metadata } from "next";`:
```typescript
import type { ReviewItem } from "@/lib/reviews";
```

Replace lines 63-66:
```typescript
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Ulasan</h2>
        <ReviewSection />
      </div>
```

With:
```typescript
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Ulasan</h2>
        <ReviewSection reviews={(product.reviews ?? []) as ReviewItem[]} />
      </div>
```

- [ ] **Step 2: Commit**

```bash
git add app/products/\[slug\]/page.tsx
git commit -m "feat: wire up approved reviews to product detail page"
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - ✅ Entry point: order detail delivered items → Task 5 (Dialog) + Task 6 (integration)
   - ✅ Gate delivered only → API route checks in Task 2
   - ✅ `verified` backend-only → FE never sends it, Task 2, 4
   - ✅ `user` backend-only → FE never sends it, Task 2
   - ✅ Multiple reviews allowed → no uniqueness check, by omission ✅
   - ✅ `reviewStatus: "pending"` on submit → Task 2 sets it
   - ✅ Product page shows `approved` only → Task 10 filters populate
   - ✅ Rating summary + star breakdown → Task 7
   - ✅ "Verified Purchase" badge → Task 8
   - ✅ 5-10 per page with "Muat lebih banyak" → Task 8 (PER_PAGE = 5)
   - ✅ Dialog/Modal form → Task 5 (Dialog) + Task 4 (Form)

2. **Placeholder scan:** No TBD, TODO, or placeholder patterns found.

3. **Type consistency:**
   - `ReviewItem` defined in `lib/reviews.ts` → used in `rating-summary.tsx`, `review-list.tsx`, `review-section.tsx`, `app/products/[slug]/page.tsx` ✅
   - `ReviewSubmission` defined in `lib/reviews.ts` → used in `app/api/reviews/route.ts` ✅
   - `createReview` signature matches API route usage ✅
   - `ReviewDialog` props: `productDocumentId`, `productName?`, `orderNumber` → matches order detail page usage ✅
   - `ReviewForm` props: `productDocumentId`, `orderNumber`, `onSuccess?`, `onClose` → matches Dialog usage ✅
