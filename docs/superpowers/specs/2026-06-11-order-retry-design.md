# Order Retry Flow Design

## Overview

Implement retry payment flow for failed orders. User clicks "Coba Bayar Lagi" → new order created with same data → redirect to new order detail page → Snap popup auto-opens.

## Background

- Midtrans tidak mengizinkan reuse `order_id` yang sudah pernah diproses
- Solusi: cancel old order, create new order with new orderNumber, redirect user
- Strapi sudah punya custom endpoint `POST /api/orders/:documentId/retry`
- Strapi handle: validasi retry limit, cancel old order, re-validate & decrement inventory, create new order
- Retry limit: max 3 percobaan, track via `retryCount` + `originalOrder` relation

## Data Flow

```
User klik "Coba Bayar Lagi" (paymentStatus === "failed")
  │
  ▼
OrderPaymentSection.handleRetry()
  │
  ├── POST /api/orders/{orderNumber}/retry
  │     └── Next.js proxy → fetch order → get documentId
  │           └── POST {STRAPI_URL}/api/orders/{documentId}/retry
  │                 ├── Validasi paymentStatus === "failed"
  │                 ├── Validasi retryCount < 3
  │                 ├── Cancel old order
  │                 ├── Re-validate inventory
  │                 ├── Decrement stock
  │                 ├── Create new order (retryCount+1, originalOrder)
  │                 └── Return full new order object
  │
  ├── Extract newOrder.orderNumber
  ├── Redirect to /orders/{newOrderNumber}?autoPay=true
  │
  ▼
New Order Detail Page loads
  ├── OrderPaymentSection detects ?autoPay=true
  ├── Auto-trigger handlePay() → load Snap script
  ├── snap.pay(token, callbacks) → popup muncul
  └── User completes payment
```

## API Route: POST /api/orders/[orderNumber]/retry

**File:** `app/api/orders/[orderNumber]/retry/route.ts` (create)

Pola identik dengan `regenerate-snap-token/route.ts` yang sudah ada:

1. Baca `orderNumber` dari params
2. Ambil token JWT dari cookie
3. Fetch order dari Strapi untuk dapatkan `documentId`
4. Proxy ke `POST {STRAPI_URL}/api/orders/{documentId}/retry`
5. Return response dari Strapi (full new order object)

**Error responses dari Strapi (pass-through):**
- `400` — retry limit exceeded / paymentStatus bukan failed
- `409` — stock tidak mencukupi
- `500` — internal error

## Frontend: OrderPaymentSection Updates

**File:** `components/orders/order-payment-section.tsx` (edit)

### State tambahan
- `retrying: boolean` — loading state untuk retry flow
- `autoPay: boolean` — di-read dari query param `?autoPay=true`

### handleRetry()
Dipanggil saat tombol "Coba Bayar Lagi" di-klik:

```typescript
const handleRetry = async () => {
  setLoading(true);
  try {
    const res = await fetch(`/api/orders/${orderNumber}/retry`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Retry failed");
    }
    const data = await res.json();
    const newOrderNumber = data.data?.orderNumber;
    if (!newOrderNumber) throw new Error("No order number in response");
    window.location.href = `/orders/${newOrderNumber}?autoPay=true`;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Gagal memproses retry");
  } finally {
    setLoading(false);
  }
};
```

### Auto-pay via query param
- `autoPay` di-read dari `window.location.search` di `useEffect` on mount
- Jika `autoPay === "true"` dan ada `snapToken`, panggil `handlePay()` otomatis
- Jika `autoPay` true tapi `snapToken` null, jangan auto-pay (tunggu regenerate)

### Button state "Coba Bayar Lagi"
- `disabled` + spinner saat `retrying === true`

## File Changes Summary

| File | Action | Description |
|---|---|---|
| `app/api/orders/[orderNumber]/retry/route.ts` | **Create** | Proxy route ke Strapi retry endpoint |
| `components/orders/order-payment-section.tsx` | **Edit** | Tambah handleRetry, autoPay, read query param |

## Error Handling Matrix

| Kondisi | Status Code | User-facing message |
|---|---|---|
| Retry limit exceeded | 400 | "Percobaan pembayaran habis. Silakan hubungi customer service." |
| Stock habis | 409 | "Stok produk tidak mencukupi. Silakan cek kembali pesanan." |
| Order bukan failed | 400 | "Order tidak bisa di-retry." |
| Network error | 500 | "Gagal terhubung. Silakan coba lagi." |

## Not In Scope

- `decrementInventory` di Next.js side — sudah dihandle Strapi
- Order cancellation UI — sudah dihandle Strapi
- Riwayat retry di order list page — mvp cukup track via `retryCount` field
