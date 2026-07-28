# Manual Bank Transfer Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a manual bank-transfer payment option to checkout — customer picks bank transfer, sees bank accounts, places order, uploads a payment proof image, and tracks admin approval — alongside the existing Midtrans gateway flow.

**Architecture:** This repo uses httpOnly cookie auth; the browser never holds the JWT. Every Strapi call goes through a Next.js route handler that reads the `token` cookie and forwards it. So the manual-payment upload and the payment-methods lookup each get a thin proxy route handler. UI branches on `order.paymentMethod`: gateway keeps the existing `OrderPaymentSection`, `manual_transfer` renders a new `ManualPaymentSection` on the same order detail page. Pure logic (file validation, error mapping, method resolution) lives in `lib/payment.ts` and is unit-tested; route handlers and components consume it.

**Tech Stack:** Next.js (App Router, route handlers), React client components, TanStack Query, sonner (toast), Tailwind + existing shadcn-style UI primitives, Vitest + jsdom.

## Global Constraints

- All new Strapi access from the browser MUST proxy through a Next route handler that reads `cookies().get("token")?.value` — never call Strapi directly from client code, never expose the JWT. (Matches every existing `app/api/*/route.ts`.)
- `orderDocumentId` in the upload path is the Strapi `documentId` (string), NOT the numeric `id`.
- Proof upload: `multipart/form-data`, field name exactly `image`. Do NOT set a `Content-Type` header manually on multipart requests (the boundary must be auto-generated).
- Allowed proof types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. Max size: 5 MB (`5 * 1024 * 1024` bytes).
- All user-facing copy in Bahasa Indonesia.
- `paymentMethod` values are exactly `"gateway"` and `"manual_transfer"`. Treat a missing/undefined `paymentMethod` on an existing order as `"gateway"` (legacy orders).
- Do NOT build admin approve/reject UI — Strapi admin handles it.
- Reuse existing UI primitives from `components/ui/*`; add no new primitives.
- `STRAPI_URL` env var is the Strapi base (see `app/api/store-setting/route.ts`).

---

### Task 1: Payment domain module — types + pure helpers

Central module for shared types and pure, testable logic used by later tasks (selector, upload route, upload form).

**Files:**
- Create: `lib/payment.ts`
- Test: `lib/__tests__/payment.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type BankAccount = { bankName: string; accountNumber: string; accountHolder: string; instructions: string | null }`
  - `type PaymentMethods = { gateway: boolean; manualTransfer: boolean; bankAccounts: BankAccount[] }`
  - `type PaymentMethod = "gateway" | "manual_transfer"`
  - `type ManualPaymentStatus = "awaiting_proof" | "under_review" | "approved" | "rejected"`
  - `const PROOF_MAX_BYTES = 5 * 1024 * 1024`
  - `const PROOF_ALLOWED_MIME: string[]`
  - `function validateProofFile(file: { type: string; size: number }): { ok: true } | { ok: false; error: string }`
  - `function mapProofUploadError(message: string | undefined): string`
  - `function resolveInitialMethod(m: PaymentMethods): PaymentMethod | null`

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/payment.test.ts
import { describe, expect, it } from "vitest";
import {
  validateProofFile,
  mapProofUploadError,
  resolveInitialMethod,
  PROOF_MAX_BYTES,
} from "@/lib/payment";

describe("validateProofFile", () => {
  it("accepts a valid jpeg under the size limit", () => {
    expect(validateProofFile({ type: "image/jpeg", size: 1000 })).toEqual({ ok: true });
  });

  it("rejects a non-image type", () => {
    const r = validateProofFile({ type: "application/pdf", size: 1000 });
    expect(r).toEqual({ ok: false, error: "Format file harus JPG, PNG, WEBP, atau GIF" });
  });

  it("rejects a file over 5MB", () => {
    const r = validateProofFile({ type: "image/png", size: PROOF_MAX_BYTES + 1 });
    expect(r).toEqual({ ok: false, error: "Ukuran file maksimal 5MB" });
  });
});

describe("mapProofUploadError", () => {
  it("maps the inactive-order message", () => {
    expect(mapProofUploadError("Order is no longer active")).toBe(
      "Pesanan ini kadaluarsa atau dibatalkan",
    );
  });

  it("maps the wrong-status message", () => {
    expect(mapProofUploadError("Cannot upload proof in current payment status")).toBe(
      "Upload tidak diizinkan pada status pembayaran saat ini",
    );
  });

  it("falls back to the original message", () => {
    expect(mapProofUploadError("Some other error")).toBe("Some other error");
  });

  it("falls back to a generic message when undefined", () => {
    expect(mapProofUploadError(undefined)).toBe("Gagal mengunggah bukti pembayaran");
  });
});

describe("resolveInitialMethod", () => {
  const banks = { gateway: true, manualTransfer: true, bankAccounts: [] };
  it("prefers gateway when both enabled", () => {
    expect(resolveInitialMethod(banks)).toBe("gateway");
  });
  it("returns manual_transfer when only manual enabled", () => {
    expect(resolveInitialMethod({ ...banks, gateway: false })).toBe("manual_transfer");
  });
  it("returns gateway when only gateway enabled", () => {
    expect(resolveInitialMethod({ ...banks, manualTransfer: false })).toBe("gateway");
  });
  it("returns null when none enabled", () => {
    expect(resolveInitialMethod({ gateway: false, manualTransfer: false, bankAccounts: [] })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk test pnpm vitest run lib/__tests__/payment.test.ts`
Expected: FAIL — cannot resolve `@/lib/payment`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/payment.ts
export type BankAccount = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  instructions: string | null;
};

export type PaymentMethods = {
  gateway: boolean;
  manualTransfer: boolean;
  bankAccounts: BankAccount[];
};

export type PaymentMethod = "gateway" | "manual_transfer";

export type ManualPaymentStatus =
  | "awaiting_proof"
  | "under_review"
  | "approved"
  | "rejected";

export const PROOF_MAX_BYTES = 5 * 1024 * 1024;

export const PROOF_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export function validateProofFile(
  file: { type: string; size: number },
): { ok: true } | { ok: false; error: string } {
  if (!PROOF_ALLOWED_MIME.includes(file.type)) {
    return { ok: false, error: "Format file harus JPG, PNG, WEBP, atau GIF" };
  }
  if (file.size > PROOF_MAX_BYTES) {
    return { ok: false, error: "Ukuran file maksimal 5MB" };
  }
  return { ok: true };
}

export function mapProofUploadError(message: string | undefined): string {
  if (!message) return "Gagal mengunggah bukti pembayaran";
  if (message.includes("no longer active")) {
    return "Pesanan ini kadaluarsa atau dibatalkan";
  }
  if (message.includes("current payment status")) {
    return "Upload tidak diizinkan pada status pembayaran saat ini";
  }
  return message;
}

export function resolveInitialMethod(m: PaymentMethods): PaymentMethod | null {
  if (m.gateway) return "gateway";
  if (m.manualTransfer) return "manual_transfer";
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk test pnpm vitest run lib/__tests__/payment.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add lib/payment.ts lib/__tests__/payment.test.ts
git commit -m "feat(payment): add payment domain types and helpers"
```

---

### Task 2: Payment-methods proxy route + hook

Expose the public Strapi `/store-setting/payment-methods` endpoint to the client through a route handler, and a query hook the checkout page consumes.

**Files:**
- Create: `app/api/store-setting/payment-methods/route.ts`
- Create: `hooks/use-payment-methods.ts`
- Test: `app/api/store-setting/payment-methods/route.test.ts`

**Interfaces:**
- Consumes: `PaymentMethods` from `lib/payment.ts` (Task 1).
- Produces:
  - Route `GET /api/store-setting/payment-methods` → `{ data: PaymentMethods }`.
  - `function usePaymentMethods(): { methods: PaymentMethods | undefined; isLoading: boolean }`

- [ ] **Step 1: Write the failing test**

```ts
// app/api/store-setting/payment-methods/route.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

import { GET } from "./route";

beforeEach(() => {
  fetchMock.mockReset();
  process.env.STRAPI_URL = "https://strapi.example.com";
});

describe("GET /api/store-setting/payment-methods", () => {
  it("passes through the Strapi payment methods payload", async () => {
    const payload = {
      data: {
        gateway: true,
        manualTransfer: true,
        bankAccounts: [
          {
            bankName: "BCA",
            accountNumber: "1234567890",
            accountHolder: "Toko Jaya",
            instructions: null,
          },
        ],
      },
    };
    fetchMock.mockResolvedValue({ ok: true, json: async () => payload });

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://strapi.example.com/api/store-setting/payment-methods",
      { cache: "no-store" },
    );
  });

  it("returns disabled defaults when Strapi errors", async () => {
    fetchMock.mockResolvedValue({ ok: false });

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: { gateway: false, manualTransfer: false, bankAccounts: [] },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk test pnpm vitest run app/api/store-setting/payment-methods/route.test.ts`
Expected: FAIL — cannot resolve `./route`.

- [ ] **Step 3: Write minimal implementation**

```ts
// app/api/store-setting/payment-methods/route.ts
import { NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL!;

const DISABLED = { gateway: false, manualTransfer: false, bankAccounts: [] };

export async function GET() {
  try {
    const res = await fetch(`${STRAPI_URL}/api/store-setting/payment-methods`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ data: DISABLED });
    }
    const json = await res.json();
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ data: DISABLED });
  }
}
```

```ts
// hooks/use-payment-methods.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import type { PaymentMethods } from "@/lib/payment";

const DISABLED: PaymentMethods = {
  gateway: false,
  manualTransfer: false,
  bankAccounts: [],
};

async function fetchPaymentMethods(): Promise<PaymentMethods> {
  const res = await fetch("/api/store-setting/payment-methods");
  if (!res.ok) return DISABLED;
  const json = await res.json();
  return {
    gateway: !!json.data?.gateway,
    manualTransfer: !!json.data?.manualTransfer,
    bankAccounts: json.data?.bankAccounts ?? [],
  };
}

export function usePaymentMethods() {
  const { data, isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: fetchPaymentMethods,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return { methods: data, isLoading };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk test pnpm vitest run app/api/store-setting/payment-methods/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/store-setting/payment-methods/route.ts app/api/store-setting/payment-methods/route.test.ts hooks/use-payment-methods.ts
git commit -m "feat(payment): add payment-methods proxy route and hook"
```

---

### Task 3: Order create route accepts paymentMethod

Thread the chosen `paymentMethod` from the request body into the Strapi order create call. Defaults to `"gateway"` to preserve existing behavior.

**Files:**
- Modify: `app/api/orders/route.ts:54-71` (the `createOrder({...})` call)
- Test: `app/api/orders/route.test.ts`

**Interfaces:**
- Consumes: `createOrder` (existing, `lib/orders.ts`) — its `data` type (`OrderRequest["data"]`) already includes `paymentMethod?: "gateway" | "manual_transfer"`.
- Produces: `POST /api/orders` forwards `paymentMethod` (default `"gateway"`) into the order.

- [ ] **Step 1: Write the failing test**

```ts
// app/api/orders/route.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesGet = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: cookiesGet })),
}));
vi.stubGlobal("fetch", fetchMock);

import { POST } from "./route";
import { NextRequest } from "next/server";

beforeEach(() => {
  cookiesGet.mockReset();
  fetchMock.mockReset();
  process.env.STRAPI_URL = "https://strapi.example.com";
});

function bodyOf(call: unknown): Record<string, unknown> {
  const init = (call as [string, RequestInit])[1];
  return JSON.parse(init.body as string).data;
}

describe("POST /api/orders paymentMethod", () => {
  it("forwards manual_transfer when provided", async () => {
    cookiesGet.mockReturnValue({ value: "token-123" });
    // First fetch = order create; respond ok with an order.
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      statusText: "Created",
      json: async () => ({ data: { orderNumber: "ORD-1" } }),
    });

    const req = new NextRequest("http://localhost/api/orders", {
      method: "POST",
      body: JSON.stringify({
        items: [{ productDocumentId: "p1" }],
        subtotal: 100000,
        totalAmount: 100000,
        paymentMethod: "manual_transfer",
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const createCall = fetchMock.mock.calls.find((c) =>
      String(c[0]).endsWith("/api/orders"),
    )!;
    expect(bodyOf(createCall).paymentMethod).toBe("manual_transfer");
  });

  it("defaults to gateway when omitted", async () => {
    cookiesGet.mockReturnValue({ value: "token-123" });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      statusText: "Created",
      json: async () => ({ data: { orderNumber: "ORD-1" } }),
    });

    const req = new NextRequest("http://localhost/api/orders", {
      method: "POST",
      body: JSON.stringify({
        items: [{ productDocumentId: "p1" }],
        subtotal: 100000,
        totalAmount: 100000,
      }),
    });
    await POST(req);

    const createCall = fetchMock.mock.calls.find((c) =>
      String(c[0]).endsWith("/api/orders"),
    )!;
    expect(bodyOf(createCall).paymentMethod).toBe("gateway");
  });
});
```

> Note: `resolveItemDocumentIds` only calls Strapi when `productDocumentId` is missing; the tests pass `productDocumentId: "p1"` so the only `fetch` is the order create. `fetchVoucherByDocumentId` runs only when `voucherDocumentId` is a string — omitted here.

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk test pnpm vitest run app/api/orders/route.test.ts`
Expected: FAIL — `paymentMethod` is `"gateway"` in the manual case (currently never read from body) OR `undefined`.

- [ ] **Step 3: Write minimal implementation**

In `app/api/orders/route.ts`, inside the `createOrder({ ... }, token)` object literal (currently lines 55-70), add one field. Place it right after `currency: body.currency || "IDR",`:

```ts
        currency: body.currency || "IDR",
        paymentMethod: body.paymentMethod === "manual_transfer" ? "manual_transfer" : "gateway",
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk test pnpm vitest run app/api/orders/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/orders/route.ts app/api/orders/route.test.ts
git commit -m "feat(orders): forward paymentMethod on order create"
```

---

### Task 4: Bank account list component (shared display)

A presentational component that renders one or more bank accounts with a copy-to-clipboard on the account number. Reused by checkout selector (Task 5) and manual payment section (Task 7).

**Files:**
- Create: `components/checkout/bank-account-list.tsx`

**Interfaces:**
- Consumes: `BankAccount` from `lib/payment.ts` (Task 1).
- Produces: `function BankAccountList({ accounts }: { accounts: BankAccount[] }): JSX.Element`

- [ ] **Step 1: Write the implementation** (presentational only; verified by typecheck + usage in later tasks — no unit test)

```tsx
// components/checkout/bank-account-list.tsx
"use client";

import { useState } from "react";
import { Copy, Check, Landmark } from "lucide-react";
import type { BankAccount } from "@/lib/payment";

export function BankAccountList({ accounts }: { accounts: BankAccount[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied((c) => (c === value ? null : c)), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  if (!accounts.length) {
    return (
      <p className="text-xs text-muted-foreground">
        Belum ada rekening bank yang tersedia. Hubungi penjual.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((acc, idx) => (
        <div key={idx} className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Landmark className="size-3.5 text-muted-foreground" />
            {acc.bankName}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm tabular-nums">{acc.accountNumber}</span>
            <button
              type="button"
              onClick={() => copy(acc.accountNumber)}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
            >
              {copied === acc.accountNumber ? (
                <>
                  <Check className="size-3" /> Tersalin
                </>
              ) : (
                <>
                  <Copy className="size-3" /> Salin
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">a.n. {acc.accountHolder}</p>
          {acc.instructions && (
            <p className="text-xs text-muted-foreground border-t pt-1.5 mt-1.5 whitespace-pre-line">
              {acc.instructions}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `rtk tsc pnpm tsc --noEmit`
Expected: no errors in `bank-account-list.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/checkout/bank-account-list.tsx
git commit -m "feat(checkout): add bank account list component"
```

---

### Task 5: Checkout payment method selector + integration

Render the payment-method choice on checkout, gated by the flags. Auto-select and hide the selector when only one method is enabled; radio when both. Show bank accounts inline when manual is chosen. Include `paymentMethod` in the order POST body.

**Files:**
- Create: `components/checkout/payment-method-selector.tsx`
- Modify: `app/checkout/page.tsx` (add state, render selector, add to POST body, gate submit)

**Interfaces:**
- Consumes: `usePaymentMethods` (Task 2), `resolveInitialMethod` + `PaymentMethod` + `PaymentMethods` (Task 1), `BankAccountList` (Task 4), existing `Card`/`RadioGroup` UI primitives.
- Produces: `function PaymentMethodSelector({ methods, value, onChange }: { methods: PaymentMethods; value: PaymentMethod | null; onChange: (m: PaymentMethod) => void }): JSX.Element`

- [ ] **Step 1: Write the selector component**

```tsx
// components/checkout/payment-method-selector.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Landmark } from "lucide-react";
import { BankAccountList } from "@/components/checkout/bank-account-list";
import type { PaymentMethod, PaymentMethods } from "@/lib/payment";

interface Props {
  methods: PaymentMethods;
  value: PaymentMethod | null;
  onChange: (m: PaymentMethod) => void;
}

export function PaymentMethodSelector({ methods, value, onChange }: Props) {
  const both = methods.gateway && methods.manualTransfer;
  const none = !methods.gateway && !methods.manualTransfer;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Metode Pembayaran</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {none && (
          <p className="text-xs text-destructive">
            Belum ada metode pembayaran yang aktif. Silakan hubungi penjual.
          </p>
        )}

        {both && (
          <RadioGroup
            value={value ?? undefined}
            onValueChange={(v) => onChange(v as PaymentMethod)}
            className="space-y-2"
          >
            <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
              <RadioGroupItem value="gateway" id="pm-gateway" />
              <CreditCard className="size-4 text-muted-foreground" />
              <span className="text-sm">Pembayaran Online (Kartu / VA / E-wallet)</span>
            </label>
            <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
              <RadioGroupItem value="manual_transfer" id="pm-manual" />
              <Landmark className="size-4 text-muted-foreground" />
              <span className="text-sm">Transfer Bank Manual</span>
            </label>
          </RadioGroup>
        )}

        {!both && !none && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {value === "manual_transfer" ? (
              <Landmark className="size-4" />
            ) : (
              <CreditCard className="size-4" />
            )}
            {value === "manual_transfer"
              ? "Transfer Bank Manual"
              : "Pembayaran Online"}
          </p>
        )}

        {value === "manual_transfer" && (
          <div className="space-y-2">
            <Label className="text-xs">Transfer ke salah satu rekening berikut:</Label>
            <BankAccountList accounts={methods.bankAccounts} />
            <p className="text-xs text-muted-foreground">
              Setelah pesanan dibuat, unggah bukti transfer di halaman pesanan.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Wire into `app/checkout/page.tsx`**

Add imports near the other imports (top of file):

```tsx
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector";
import { resolveInitialMethod, type PaymentMethod } from "@/lib/payment";
```

Inside `CheckoutPage`, after the existing hooks (e.g. after `const router = useRouter();`), add:

```tsx
  const { methods } = usePaymentMethods();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (methods && paymentMethod === null) {
      setPaymentMethod(resolveInitialMethod(methods));
    }
  }, [methods, paymentMethod]);
```

Extend `canSubmit` so submit is blocked when no method is selected. Find the `canSubmit` `useMemo` and add a guard plus dependency:

```tsx
    if (!selectedCourier) return false;
    if (!paymentMethod) return false;
    return true;
  }, [isAuthenticated, shippingAddress, effectiveSubdistrict, selectedCourier, paymentMethod]);
```

Add `paymentMethod` to the order POST body. In the `fetch("/api/orders", ...)` JSON body object, add a line next to `currency: "IDR",`:

```tsx
          currency: "IDR",
          paymentMethod,
          voucherDocumentId: appliedVoucher?.documentId ?? null,
```

Render the selector in the left column, immediately after the "Catatan" `<Card>` (before the closing `</div>` of `lg:col-span-2`):

```tsx
            {methods && (
              <PaymentMethodSelector
                methods={methods}
                value={paymentMethod}
                onChange={setPaymentMethod}
              />
            )}
```

- [ ] **Step 3: Typecheck**

Run: `rtk tsc pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke check**

Run: `rtk lint pnpm lint`
Expected: no new lint errors in the touched files. Confirm visually (if running the app) that: both flags on → radio; one flag → static label, no radio; manual selected → bank list shows.

- [ ] **Step 5: Commit**

```bash
git add components/checkout/payment-method-selector.tsx app/checkout/page.tsx
git commit -m "feat(checkout): add payment method selector"
```

---

### Task 6: Proof upload proxy route

Route handler that accepts a multipart upload from the browser, reads the cookie token, and forwards it to Strapi's manual-payments proofs endpoint. Passes Strapi error status + message straight back.

**Files:**
- Create: `app/api/manual-payments/[orderDocumentId]/proofs/route.ts`
- Test: `app/api/manual-payments/[orderDocumentId]/proofs/route.test.ts`

**Interfaces:**
- Consumes: cookie `token`; `STRAPI_URL`.
- Produces: `POST /api/manual-payments/:orderDocumentId/proofs` — multipart in (field `image`), forwards to `${STRAPI_URL}/api/manual-payments/:orderDocumentId/proofs`; returns Strapi's JSON with its status. `401` if no token, `400` if no `image` field.

- [ ] **Step 1: Write the failing test**

```ts
// app/api/manual-payments/[orderDocumentId]/proofs/route.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesGet = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: cookiesGet })),
}));
vi.stubGlobal("fetch", fetchMock);

import { POST } from "./route";

beforeEach(() => {
  cookiesGet.mockReset();
  fetchMock.mockReset();
  process.env.STRAPI_URL = "https://strapi.example.com";
});

function makeReq(hasImage: boolean) {
  const form = new FormData();
  if (hasImage) {
    form.append("image", new File(["x"], "proof.png", { type: "image/png" }));
  }
  return new Request("http://localhost/api/manual-payments/doc-1/proofs", {
    method: "POST",
    body: form,
  });
}

const ctx = { params: Promise.resolve({ orderDocumentId: "doc-1" }) };

describe("POST /api/manual-payments/:id/proofs", () => {
  it("401 when no token", async () => {
    cookiesGet.mockReturnValue(undefined);
    const res = await POST(makeReq(true), ctx);
    expect(res.status).toBe(401);
  });

  it("400 when no image field", async () => {
    cookiesGet.mockReturnValue({ value: "t" });
    const res = await POST(makeReq(false), ctx);
    expect(res.status).toBe(400);
  });

  it("forwards to Strapi and returns its payload", async () => {
    cookiesGet.mockReturnValue({ value: "token-123" });
    fetchMock.mockResolvedValue({
      status: 200,
      json: async () => ({ data: { status: "under_review" } }),
    });

    const res = await POST(makeReq(true), ctx);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { status: "under_review" } });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://strapi.example.com/api/manual-payments/doc-1/proofs");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer token-123");
    // must NOT set Content-Type manually (boundary is auto-generated)
    expect(init.headers["Content-Type"]).toBeUndefined();
    expect(init.body).toBeInstanceOf(FormData);
  });

  it("passes through Strapi error status and message", async () => {
    cookiesGet.mockReturnValue({ value: "token-123" });
    fetchMock.mockResolvedValue({
      status: 400,
      json: async () => ({ error: { message: "Order is no longer active" } }),
    });

    const res = await POST(makeReq(true), ctx);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: { message: "Order is no longer active" },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk test pnpm vitest run "app/api/manual-payments/[orderDocumentId]/proofs/route.test.ts"`
Expected: FAIL — cannot resolve `./route`.

- [ ] **Step 3: Write minimal implementation**

```ts
// app/api/manual-payments/[orderDocumentId]/proofs/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderDocumentId: string }> },
) {
  const { orderDocumentId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const incoming = await req.formData();
  const image = incoming.get("image");
  if (!image || typeof image === "string") {
    return NextResponse.json(
      { error: "File bukti pembayaran wajib diisi" },
      { status: 400 },
    );
  }

  const forward = new FormData();
  forward.append("image", image);

  const res = await fetch(
    `${STRAPI_URL}/api/manual-payments/${orderDocumentId}/proofs`,
    {
      method: "POST",
      // NOTE: no Content-Type header — fetch sets the multipart boundary.
      headers: { Authorization: `Bearer ${token}` },
      body: forward,
    },
  );

  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk test pnpm vitest run "app/api/manual-payments/[orderDocumentId]/proofs/route.test.ts"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/api/manual-payments/[orderDocumentId]/proofs/route.ts" "app/api/manual-payments/[orderDocumentId]/proofs/route.test.ts"
git commit -m "feat(payment): add proof upload proxy route"
```

---

### Task 7: Proof upload form component

Client component: pick an image, validate inline (type/size) before upload, POST via `XMLHttpRequest` to show upload progress, map errors, refresh on success.

**Files:**
- Create: `components/orders/proof-upload-form.tsx`

**Interfaces:**
- Consumes: `validateProofFile`, `mapProofUploadError`, `PROOF_ALLOWED_MIME` (Task 1); upload route (Task 6); existing `Button`, `Label`; `toast`; `useRouter`.
- Produces: `function ProofUploadForm({ orderDocumentId }: { orderDocumentId: string }): JSX.Element`

- [ ] **Step 1: Write the component**

```tsx
// components/orders/proof-upload-form.tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import {
  validateProofFile,
  mapProofUploadError,
  PROOF_ALLOWED_MIME,
} from "@/lib/payment";

export function ProofUploadForm({ orderDocumentId }: { orderDocumentId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    setError(null);
    if (!picked) {
      setFile(null);
      return;
    }
    const check = validateProofFile({ type: picked.type, size: picked.size });
    if (!check.ok) {
      setError(check.error);
      setFile(null);
      return;
    }
    setFile(picked);
  };

  const upload = () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    const form = new FormData();
    form.append("image", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/manual-payments/${orderDocumentId}/proofs`);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        setProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        toast.success("Bukti pembayaran berhasil diunggah");
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
        return;
      }
      let message: string | undefined;
      try {
        const body = JSON.parse(xhr.responseText);
        message = body?.error?.message ?? body?.error ?? body?.message;
      } catch {
        // non-JSON error body
      }
      toast.error(mapProofUploadError(message));
    };

    xhr.onerror = () => {
      setUploading(false);
      toast.error("Gagal mengunggah bukti pembayaran");
    };

    xhr.send(form);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Bukti Transfer (JPG/PNG/WEBP/GIF, maks 5MB)</Label>
        <input
          ref={inputRef}
          type="file"
          accept={PROOF_ALLOWED_MIME.join(",")}
          onChange={onPick}
          disabled={uploading}
          className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-muted/70"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {uploading && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <Button
        type="button"
        onClick={upload}
        disabled={!file || uploading}
        className="w-full"
        size="sm"
      >
        {uploading ? (
          <span className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Mengunggah... {progress}%
          </span>
        ) : (
          <span className="flex items-center">
            <Upload className="mr-2 h-4 w-4" />
            Unggah Bukti
          </span>
        )}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `rtk tsc pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/orders/proof-upload-form.tsx
git commit -m "feat(orders): add proof upload form"
```

---

### Task 8: Manual payment section + order detail branch

The status-aware panel shown on the order detail page for `manual_transfer` orders: badge per the UX table, bank details, and the upload form when appropriate. Branch the order detail page by `paymentMethod`, and deepen the order populate so `manualPayment` (+ proofs) comes back.

**Files:**
- Create: `components/orders/manual-payment-section.tsx`
- Modify: `lib/orders.ts:22-32` (`getOrderByNumber` populate)
- Modify: `app/orders/[orderNumber]/page.tsx:184-192` (branch payment section)

**Interfaces:**
- Consumes: `ManualPaymentStatus`, `BankAccount` (Task 1); `BankAccountList` (Task 4); `ProofUploadForm` (Task 7); `usePaymentMethods` (Task 2); existing `Badge`.
- Produces: `function ManualPaymentSection({ orderDocumentId, status, rejectionReason }: { orderDocumentId: string; status: ManualPaymentStatus | null; rejectionReason: string | null }): JSX.Element`

- [ ] **Step 1: Deepen the order populate**

In `lib/orders.ts`, replace the `populate: "*"` in `getOrderByNumber` (line ~27) with an explicit populate that keeps existing relations and adds the manual payment:

```ts
export async function getOrderByNumber(orderNumber: string, token: string) {
  return strapiFetch<OrderListResponse>(
    "/orders",
    {
      filters: { orderNumber: { $eq: orderNumber } },
      populate: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
        manualPayment: { populate: { proofs: { populate: "image" } } },
      },
    },
    {},
    token,
  );
}
```

- [ ] **Step 2: Write the manual payment section**

```tsx
// components/orders/manual-payment-section.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle, Upload } from "lucide-react";
import { BankAccountList } from "@/components/checkout/bank-account-list";
import { ProofUploadForm } from "@/components/orders/proof-upload-form";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import type { ManualPaymentStatus } from "@/lib/payment";

interface Props {
  orderDocumentId: string;
  status: ManualPaymentStatus | null;
  rejectionReason: string | null;
}

export function ManualPaymentSection({ orderDocumentId, status, rejectionReason }: Props) {
  const { methods } = usePaymentMethods();
  const effective: ManualPaymentStatus = status ?? "awaiting_proof";
  const showForm = effective === "awaiting_proof" || effective === "rejected";

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Pembayaran</span>
        {effective === "approved" ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Terkonfirmasi
          </Badge>
        ) : effective === "under_review" ? (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Menunggu Verifikasi
          </Badge>
        ) : effective === "rejected" ? (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Ditolak
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Upload className="mr-1 h-3 w-3" />
            Menunggu Bukti
          </Badge>
        )}
      </div>

      {effective === "approved" && (
        <p className="text-xs text-green-700">
          Pembayaran Anda telah dikonfirmasi. Pesanan sedang diproses.
        </p>
      )}

      {effective === "under_review" && (
        <p className="text-xs text-muted-foreground">
          Bukti transfer diterima. Menunggu verifikasi admin.
        </p>
      )}

      {effective === "rejected" && rejectionReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <p className="font-medium">Bukti ditolak:</p>
          <p>{rejectionReason}</p>
        </div>
      )}

      {showForm && (
        <>
          <div className="space-y-2">
            <p className="text-xs font-medium">
              {effective === "rejected"
                ? "Silakan unggah ulang bukti transfer:"
                : "Transfer ke salah satu rekening berikut, lalu unggah bukti:"}
            </p>
            {methods?.bankAccounts?.length ? (
              <BankAccountList accounts={methods.bankAccounts} />
            ) : null}
          </div>
          <ProofUploadForm orderDocumentId={orderDocumentId} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Branch the order detail page**

In `app/orders/[orderNumber]/page.tsx`, add the import near the other component imports:

```tsx
import { ManualPaymentSection } from "@/components/orders/manual-payment-section";
```

Replace the `<OrderPaymentSection ... />` block (currently lines ~184-192) with a branch on `paymentMethod`:

```tsx
              {order.paymentMethod === "manual_transfer" ? (
                <ManualPaymentSection
                  orderDocumentId={order.documentId ?? ""}
                  status={order.manualPayment?.status ?? null}
                  rejectionReason={order.manualPayment?.rejectionReason ?? null}
                />
              ) : (
                <OrderPaymentSection
                  orderNumber={orderNumber}
                  paymentStatus={order.paymentStatus ?? "pending"}
                  orderStatus={order.orderStatus ?? "pending"}
                  totalAmount={order.totalAmount ?? 0}
                  currency={order.currency}
                  snapToken={order.midtransSnapToken ?? null}
                  autoPay={autoPay === "true"}
                />
              )}
```

- [ ] **Step 4: Typecheck + lint**

Run: `rtk tsc pnpm tsc --noEmit`
Expected: no errors. `order.manualPayment` and `order.documentId` are present on the `Order` schema type.

Run: `rtk lint pnpm lint`
Expected: no new errors.

- [ ] **Step 5: Run the full test suite**

Run: `rtk test pnpm vitest run`
Expected: all tests pass (Tasks 1, 2, 3, 6 suites green; nothing else broken).

- [ ] **Step 6: Commit**

```bash
git add lib/orders.ts components/orders/manual-payment-section.tsx "app/orders/[orderNumber]/page.tsx"
git commit -m "feat(orders): show manual payment status and upload"
```

---

### Task 9: Graph + verification pass

Keep the knowledge graph current and confirm the whole flow typechecks and tests clean.

**Files:** none (tooling only)

- [ ] **Step 1: Update graphify**

Run: `graphify update .`
Expected: completes (AST-only, no API cost).

- [ ] **Step 2: Full verification**

Run: `rtk tsc pnpm tsc --noEmit && rtk test pnpm vitest run && rtk lint pnpm lint`
Expected: all clean.

- [ ] **Step 3: Manual end-to-end smoke (if app is running)**

Verify:
1. Checkout with both methods → radio shows; pick manual → bank accounts appear.
2. Place manual order → redirected to `/orders/<n>` → status "Menunggu Bukti" + bank details + upload form.
3. Upload invalid type/size → inline error, no request.
4. Upload valid image → progress bar → "Menunggu Verifikasi".
5. (Admin rejects in Strapi) refresh → rejection reason + re-upload form.
6. (Admin approves) refresh → "Terkonfirmasi", no form.

---

## Self-Review Notes

- **Spec coverage:** checkout selector (Task 5) · bank details display (Task 4) · order create paymentMethod (Task 3) · post-order upload on order detail (Tasks 7-8) · status UX mapping (Task 8) · re-upload on rejection (Task 8 `showForm`) · upload proxy + multipart field `image` + no manual Content-Type (Task 6) · file validation before upload (Tasks 1, 7) · error message mapping for the two 400 cases (Tasks 1, 7) · auth via cookie proxy (Tasks 6, Global Constraints) · `orderDocumentId` = documentId (Task 8 passes `order.documentId`).
- **Deviation from spec:** upload uses a cookie-proxy route handler, not a client-side `Authorization` header, because this repo has no client-accessible JWT (confirmed with user).
- **Not built (per spec):** admin approve/reject UI; no approval polling — customer refreshes / revisits (matches the minimal-polling gateway pattern).
