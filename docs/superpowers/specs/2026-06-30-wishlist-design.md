# Wishlist — Design Spec

> **Status:** Design Approved  
> **Date:** 2026-06-30  
> **Project:** Cyra — Preloved Beauty Terkurasi

---

## 1. Ringkasan

Fitur wishlist untuk Cyra. User yang login bisa menyimpan produk favorit, melihatnya di halaman khusus, dan dengan cepat menambahkannya ke keranjang.

---

## 2. Strapi Content Type

### WishlistItem (`api::wishlist-item.wishlist-item`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `user` | relation: manyToOne → User | ✅ | Otomatis dari JWT |
| `product` | relation: manyToOne → Product | ✅ | Produk yang difavoritkan |
| `createdAt` | datetime | — | Otomatis dari Strapi |

**Unique constraint:** Kombinasi `(user, product)` — mencegah duplikasi.

**Permissions (Strapi):**
- `create`: Authenticated (hanya milik sendiri)
- `find`: Authenticated (hanya milik sendiri)
- `findOne`: Authenticated (hanya milik sendiri)
- `delete`: Authenticated (hanya milik sendiri)

**API endpoints (via Strapi REST):**
```
GET    /api/wishlist-items?filters[user][id][$eq]=<userId>&populate[0]=product.images
POST   /api/wishlist-items
DELETE /api/wishlist-items/<documentId>
```

Strapi akan menghasilkan response dengan format:
```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123",
      "product": {
        "id": 5,
        "documentId": "prod456",
        "name": "Tas Vintage Chanel",
        "slug": "tas-vintage-chanel",
        "price": 2500000,
        "images": [...],
        ...
      },
      "createdAt": "2026-06-30T10:00:00.000Z"
    }
  ]
}
```

---

## 3. API Route Handlers (Next.js BFF Proxy)

### `app/api/wishlist/route.ts` — GET & POST

**GET `/api/wishlist`**
- Baca JWT dari `cookies().get("token")`
- 401 → return `{ data: [] }` (tidak error, agar guest tidak broken)
- Proxy ke Strapi `GET /api/wishlist-items` dengan filter `user.id` + populate product + images
- Return `{ data: WishlistItem[] }`

**POST `/api/wishlist`**
- Body: `{ productDocumentId: string }`
- 401 → return 401 error
- Proxy ke Strapi `POST /api/wishlist-items` dengan body:
  ```json
  {
    "data": {
      "product": "<productDocumentId>",
      "user": "<userId>"
    }
  }
  ```
- Handle duplicate → jika produk sudah ada di wishlist, return 200 dengan data existing (idempotent)

### `app/api/wishlist/[documentId]/route.ts` — DELETE

**DELETE `/api/wishlist/[documentId]`**
- 401 → return 401
- Proxy ke Strapi `DELETE /api/wishlist-items/<documentId>`
- Return `{ success: true }`

### Auth Pattern

Semua route handler mengikuti pola yang sudah ada di `app/api/auth/login/route.ts`:
```typescript
import { cookies } from "next/headers";
const cookieStore = await cookies();
const token = cookieStore.get("token")?.value;
if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

---

## 4. React Query Hooks

File: `hooks/use-wishlist.ts`

### `useWishlist()`
```typescript
export function useWishlist() {
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await fetch("/api/wishlist");
      if (res.status === 401) return [];
      if (!res.ok) throw new Error("Gagal memuat wishlist");
      const json = await res.json();
      return json.data as WishlistItem[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

### `useAddToWishlist()`
```typescript
export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productDocumentId: string) => {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productDocumentId }),
      });
      if (!res.ok) throw new Error("Gagal menambahkan");
      return res.json();
    },
    onMutate: async (productDocumentId) => {
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });
      const previous = queryClient.getQueryData(["wishlist"]);
      queryClient.setQueryData(["wishlist"], (old: WishlistItem[]) => [
        ...(old || []),
        { id: Date.now(), documentId: "optimistic", product: { documentId: productDocumentId } },
      ]);
      return { previous };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(["wishlist"], context?.previous);
      toast.error("Gagal menambahkan ke wishlist");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });
}
```

### `useRemoveWishlist()`
```typescript
// Sama seperti useAddToWishlist, dengan DELETE
```

### `useIsInWishlist(productDocumentId: string)`
```typescript
export function useIsInWishlist(productDocumentId: string) {
  const { data: wishlist = [] } = useWishlist();
  return wishlist.some((item) => item.product.documentId === productDocumentId);
}
```

---

## 5. Components

### 5.1 `WishlistButton`

File: `components/wishlist/wishlist-button.tsx`

**Props:**
```typescript
interface WishlistButtonProps {
  productDocumentId: string;
  variant: "card" | "detail";
  className?: string;
}
```

**Behavior:**
- `variant="card"`: Absolute positioned top-right, size-5 heart icon
- `variant="detail"`: Inline button with border, same height as AddToCart
- Jika tidak login: klik → toast "Silakan login" → redirect `/auth/login`
- Jika login: toggle wishlist via useAddToWishlist/useRemoveWishlist
- Loading state: disabled + opacity
- Filled heart: `fill="#E8B4B8" stroke="#E8B4B8"` (accent color)
- Empty heart: `stroke="#6B5D57"` (muted foreground)

**States:**
| State | Tampilan |
|-------|----------|
| Loading | Skeleton / pulse |
| Empty (not in wishlist) | ♡ outline, muted |
| Filled (in wishlist) | ❤️ accent fill |
| Error | Fallback ke state previous + toast |

### 5.2 `HeaderWishlistIcon`

File: `components/wishlist/header-wishlist-icon.tsx`

**Behavior:**
- Menggunakan `useWishlist().data?.length` untuk badge count
- Hidden jika tidak login
- Link ke `/wishlist`
- Layout dan style identik dengan cart trigger di header:
  - Ghost icon button
  - `Heart` lucide icon h-5 w-5
  - Badge: bg-primary text-primary-foreground, absolute -top-2 -right-2
  - Ring-2 ring-background

**Penempatan di header:** Di kiri cart icon (`CartDrawer`), di kanan search bar.

### 5.3 `WishlistPage`

File: `app/wishlist/page.tsx`

**Behavior:**
- Client component (`"use client"`)
- Jika tidak login: redirect ke `/auth/login`
- Menggunakan `useWishlist()` untuk data
- Grid layout 1-4 kolom (responsive) — reuse `ProductGrid` style
- Setiap item: product image, nama, harga, tombol ❤️ (remove), tombol "Tambah ke Keranjang"
- Empty state: icon heart + "Belum ada favorit" + link ke `/products`

**States:**
| State | Tampilan |
|-------|----------|
| Loading | Skeleton grid (4 cards) |
| Empty | Ilustrasi + "Belum ada favorit, yuk belanja!" + CTA |
| Error | Toast error + retry button |
| Data | Grid produk wishlist |

---

## 6. Routing

| Route | File | Keterangan |
|-------|------|------------|
| `/wishlist` | `app/wishlist/page.tsx` | Halaman wishlist, protected |

---

## 7. Error & Edge Cases

| Skenario | Handling |
|----------|----------|
| User tidak login & klik heart | Toast "Silakan login" → redirect `/auth/login` |
| Produk sudah di wishlist | POST idempotent — return existing data |
| Produk dihapus dari Strapi | WishlistItem orphan → tampilkan "Produk tidak tersedia" |
| Network error | Optimistic rollback + toast error |
| Duplicate click cepat | `useMutation` dengan `onMutate` cancel queries |
| Badge count > 99 | Tampilkan "99+" (sama seperti cart pattern) |

---

## 8. File Checklist

```
app/
  api/wishlist/
    route.ts                          # GET + POST
    [documentId]/route.ts             # DELETE
  wishlist/
    page.tsx                          # Wishlist page

components/wishlist/
  wishlist-button.tsx                 # Heart toggle button
  header-wishlist-icon.tsx            # Header icon with badge

hooks/
  use-wishlist.ts                     # React Query hooks

lib/
  wishlist.ts                         # Wishlist types & helpers
```
