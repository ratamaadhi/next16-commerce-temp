# Integrasi Strapi v5 + Next.js 16 — E-Commerce Frontend

> **Status:** Planning Complete  
> **Target Audience:** Intern Developer (Next.js)  
> **Last Updated:** 2026-06-02

---

## 1. Ringkasan Arsitektur

```
┌──────────────────────────────────────────────────────┐
│                     Dokploy VPS                      │
│                                                      │
│  ┌──────────────────┐    ┌───────────────────────┐  │
│  │   Strapi v5       │    │   Next.js 16          │  │
│  │   Container       │    │   Container (standalone)│  │
│  │                   │    │                       │  │
│  │ Port: 1337        │◄───│ Client fetch (public) │  │
│  │ (or reverse-proxy)│    │ Server fetch (internal)│  │
│  │                   │    │ Port: 3000            │  │
│  └──────────────────┘    └───────────────────────┘  │
│           │                          │               │
│           ▼                          ▼               │
│  ┌──────────────┐          ┌──────────────┐         │
│  │ PostgreSQL    │          │  Nginx /     │         │
│  │               │          │  Caddy       │         │
│  │ Port: 5432    │          │ (reverse     │         │
│  └──────────────┘          │  proxy)      │         │
│           │                └──────────────┘         │
│           ▼                          │               │
│  ┌──────────────┐                    ▼               │
│  │  MinIO (S3)  │              🌐 Public:            │
│  │  Media Store │         domain-kamu.com            │
│  └──────────────┘                                    │
└──────────────────────────────────────────────────────┘
```

| Komponen | Stack | Keterangan |
|----------|-------|------------|
| **Backend CMS** | Strapi v5.47.0 | Content types + REST API + Auth |
| **Frontend** | Next.js 16 | App Router + Server Components |
| **Database** | PostgreSQL 17 | via `pg` npm package |
| **Media Storage** | MinIO (S3-compatible) | via `@strapi/provider-upload-aws-s3` |
| **Deployment** | Dokploy VPS | Docker containers |
| **API Doc** | Strapi Documentation Plugin | OpenAPI 3.0 di `/documentation` |

---

## 2. Teknologi & Keputusan Desain

### 2.1 Next.js 16 + App Router

**Kenapa:**
- Versi terbaru dengan Turbopack sebagai bundler default (lebih cepat)
- App Router support: Server Components, Server Actions, streaming, partial prerendering
- React 19-ready peer dependencies
- `middleware.ts` → `proxy.ts` (breaking change v16, perlu diperhatikan)

### 2.2 Tailwind CSS 4 + shadcn/ui

**Kenapa:**
- **Tailwind CSS 4**: Utility-first CSS, zero-runtime, performance terbaik
- **shadcn/ui**: Komponen reusable yang accessible, copy-paste ke codebase (bukan dependency npm), kustomisasi penuh. Komponen yang berguna untuk e-commerce: `Table`, `Card`, `Dialog`, `Form`, `Sheet` (cart drawer), `Skeleton` (loading state)

### 2.3 Strategy Data Fetching: Hybrid

```
┌─────────────────────────────────────────────────┐
│               Data Fetching Strategy              │
├──────────────────┬──────────────────────────────┤
│  Server Components│    Client Components          │
│  (SSR / RSC)     │    (React Query / TanStack)   │
├──────────────────┼──────────────────────────────┤
│ Product Listing   │ Cart State (client-only)     │
│ Product Detail    │ Auth State (session)         │
│ Categories        │ Add to Cart (mutations)      │
│ Reviews (read)    │ Checkout Flow                │
│ Static Pages      │ Form Submissions             │
└──────────────────┴──────────────────────────────┘
```

**Kenapa:**
- **Server Components** untuk SEO-critical pages (produk, kategori) — dirender di server, tidak expose API URL
- **React Query** untuk state client (cart, session user) — caching, optimistic updates, real-time feel

### 2.4 Auth: HTTP-Only Cookies via Route Handlers

**Kenapa:**
- JWT dari Strapi disimpan di HTTP-only cookie (tidak bisa dibaca JavaScript)
- Next.js Route Handlers sebagai proxy ke Strapi auth endpoints
- Server Components membaca cookie untuk mendapatkan session user
- Anti-XSS (token tidak terekspos ke client JS)

### 2.5 API Types: openapi-typescript

**Kenapa:**
- Strapi sudah punya Documentation plugin (Swagger di `/documentation`)
- `openapi-typescript` generate TypeScript types dari OpenAPI spec
- Type-safe ketika fetch dari Strapi API
- Repo terpisah, jadi perlu generate sendiri (tidak bisa import dari `types/generated/` Strapi)

### 2.6 Docker: Standalone Container

**Kenapa:**
- Masing-masing service (Strapi, Next.js, PostgreSQL) di-deploy terpisah di Dokploy
- Lebih fleksibel untuk scaling dan update masing-masing service
- Network internal Dokploy memungkinkan Next.js akses Strapi via container name

### 2.7 Repo Terpisah

**Kenapa:**
- Frontend dan backend bisa punya CI/CD sendiri
- Tidak saling block saat development
- Clean separation of concerns

---

## 3. Strapi API Reference

### 3.1 Strapi Instance

| Item | Value |
|------|-------|
| **URL** | `http://strapi5-commere.ratama.space` |
| **Admin Panel** | `http://strapi5-commere.ratama.space/admin` |
| **API Docs (Swagger)** | `http://strapi5-commere.ratama.space/documentation` |
| **OpenAPI Spec** | `http://strapi5-commere.ratama.space/documentation/static/index.html` |

### 3.2 Content Types

#### Product (`api::product.product`)
| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Nama produk |
| `slug` | uid | Auto dari `name`, URL-friendly |
| `shortDescription` | text | Deskripsi singkat |
| `description` | richtext | Deskripsi lengkap (rich text) |
| `price` | decimal | Required, min: 0 |
| `compareAtPrice` | decimal | Harga coret (discount display) |
| `sku` | text | Unique, kode produk |
| `inventory` | bigint | Stok, default: 0 |
| `lowStockThreshold` | int | Default: 10 |
| `weight` | decimal | min: 0 |
| `images` | media | Multiple images |
| `featured` | boolean | Default: false |
| `categories` | relation | manyToMany → Category |
| `reviews` | relation | oneToMany → Review |
| `variants` | component | Repeatable, `product.product-variant` |
| `specifications` | component | Repeatable, `product.specification` |

#### Category (`api::category.category`)
| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Required |
| `slug` | uid | Auto dari `name` |
| `description` | text | - |
| `image` | media | Single |
| `order` | bigint | Urutan display |
| `children` | relation | oneToMany → Category (sub-kategori) |
| `parent` | relation | manyToOne → Category |
| `products` | relation | manyToMany → Product |

#### Cart (`api::cart.cart`)
| Field | Type | Notes |
|-------|------|-------|
| `sessionId` | string | Unique, untuk guest cart |
| `expiresAt` | datetime | - |
| `users_permissions_user` | relation | manyToOne → User |
| `items` | component | Repeatable, `product.cart-item` |

#### Order (`api::order.order`)
| Field | Type | Notes |
|-------|------|-------|
| `orderNumber` | string | Required, unique |
| `orderStatus` | enum | pending/processing/shipped/delivered/cancelled/refunded |
| `paymentStatus` | enum | pending/paid/failed/refunded |
| `subtotal` | decimal | - |
| `tax` | decimal | - |
| `shippingCost` | decimal | - |
| `discount` | decimal | - |
| `totalAmount` | decimal | - |
| `currency` | string | Default: "IDR" |
| `user` | relation | manyToOne → User |
| `items` | component | Repeatable, `product.order-item` |
| `shippingAddress` | component | Single, `common.address` |
| `billingAddress` | component | Single, `common.address` |

#### Review (`api::review.review`)
| Field | Type | Notes |
|-------|------|-------|
| `rating` | integer | 1-5, default: 5 |
| `title` | string | Required |
| `comment` | text | Required |
| `verified` | boolean | Default: false |
| `product` | relation | manyToOne → Product |
| `user` | relation | manyToOne → User |

#### User (`plugin::users-permissions.user`)
| Field (extended) | Type |
|------------------|------|
| `username`, `email`, `password` | Standard Strapi |
| `orders` | oneToMany → Order |
| `reviews` | oneToMany → Review |
| `carts` | oneToMany → Cart |

### 3.3 Components

#### `product.cart-item`
```typescript
{
  quantity: number;    // min: 1
  variantId?: string;  // optional
}
```

#### `product.order-item`
```typescript
{
  productName: string;
  productSku?: string;
  variantInfo?: string;
  quantity: number;     // min: 1
  unitPrice: number;
  totalPrice: number;
}
```

#### `product.product-variant`
```typescript
{
  name: string;
  sku?: string;
  price: number;       // min: 0
  inventory?: number;  // default: 0
  attributes?: object; // JSON
}
```

#### `product.specification`
```typescript
{
  label: string;
  value: string;
}
```

#### `common.address`
```typescript
{
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;     // default: "Indonesia"
}
```

### 3.4 Strapi REST API Patterns

**Populasi relasi & media (populate):**
```
GET /api/products?populate=*
GET /api/products?populate[0]=categories&populate[1]=images&populate[2]=variants
GET /api/products?populate[product][populate][0]=images
```

**Filter:**
```
GET /api/products?filters[category][slug][$eq]=elektronik
GET /api/products?filters[price][$gte]=100000&filters[price][$lte]=500000
GET /api/products?filters[name][$containsi]=iphone
```

**Sort & Pagination:**
```
GET /api/products?sort=createdAt:desc&pagination[page]=1&pagination[pageSize]=12
GET /api/products?sort[0]=price:asc&sort[1]=name:asc
```

**Auth:**
```
POST /api/auth/local           → Login (email, password)
POST /api/auth/local/register  → Register (username, email, password)
GET  /api/users/me             → Current user (needs Bearer token)
```

---

## 4. Implementasi Langkah Demi Langkah

### Fase 0: Setup Project

#### 4.0.1 Scaffold Next.js

```bash
npx create-next-app@latest nextjs-frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --turbopack \
  --src-dir \
  --import-alias "@/*"

cd nextjs-frontend
```

> **Catatan:** `--turbopack` flag menggunakan Turbopack sebagai dev server (default di Next.js 16).

#### 4.0.2 Install Dependencies

```bash
npm install next@latest react@latest react-dom@latest

# shadcn/ui init (pilih Tailwind CSS 4, default config)
npx shadcn@latest init

# React Query untuk client-side data
npm install @tanstack/react-query

# openapi-typescript (dev dependency)
npm install -D openapi-typescript

# Strapi fetch helper
npm install qs   # query string untuk Strapi filter/sort/pagination
```

#### 4.0.3 Install shadcn/ui Components

```bash
# E-commerce essentials
npx shadcn@latest add button card input label
npx shadcn@latest add dialog sheet table badge
npx shadcn@latest add form select skeleton separator
npx shadcn@latest add dropdown-menu avatar tabs
npx shadcn@latest add carousel accordion textarea
npx shadcn@latest add sonner   # toast notifications
npx shadcn@latest add navigation-menu
```

#### 4.0.4 Generate Types dari Strapi OpenAPI

```bash
# Download OpenAPI spec
curl -o strapi-openapi.json \
  http://strapi5-commere.ratama.space/documentation/spec.json

# Generate types
npx openapi-typescript strapi-openapi.json \
  -o src/types/strapi.d.ts
```

> **Catatan:** Ulangi command ini setiap kali ada perubahan content type di Strapi.

#### 4.0.5 Environment Variables

Buat file `.env.local`:

```env
# Strapi API
NEXT_PUBLIC_STRAPI_URL=http://strapi5-commere.ratama.space
STRAPI_URL=http://strapi5-commere.ratama.space

# Next.js
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

File `.env.production`:

```env
# Strapi API (pakai internal Docker network)
NEXT_PUBLIC_STRAPI_URL=http://strapi5-commere.ratama.space
STRAPI_URL=http://strapi5-commere.ratama.space

# Next.js
NEXT_PUBLIC_SITE_URL=https://domain-kamu.com
```

#### 4.0.6 Direktori Struktur

> **Catatan:** Project ini **tidak menggunakan `src/` directory**. App Router, komponen, dan utilities berada langsung di root:

```
nextjs-frontend/
├── app/                             # App Router pages (no src/)
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Home / Landing
│   ├── loading.tsx                  # Global loading skeleton
│   ├── error.tsx                    # Global error boundary
│   ├── not-found.tsx                # 404 page
│   ├── products/
│   │   ├── page.tsx                 # Product listing
│   │   ├── loading.tsx
│   │   └── [slug]/
│   │       ├── page.tsx             # Product detail
│   │       └── loading.tsx
│   ├── categories/
│   │   ├── page.tsx                 # All categories
│   │   └── [slug]/
│   │       └── page.tsx             # Category products
│   ├── cart/
│   │   └── page.tsx                 # Cart page
│   ├── checkout/
│   │   └── page.tsx                 # Checkout page
│   ├── orders/
│   │   ├── page.tsx                 # Order history (protected)
│   │   └── [orderNumber]/
│   │       └── page.tsx             # Order detail
│   ├── account/
│   │   ├── page.tsx                 # Account profile
│   │   └── layout.tsx               # Account layout (sidebar)
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   └── api/
│       └── auth/
│           ├── login/route.ts       # POST → Strapi login
│           ├── register/route.ts    # POST → Strapi register
│           ├── logout/route.ts      # POST → Clear cookie
│           └── me/route.ts          # GET → Current user
│
├── components/
│   ├── ui/                          # shadcn/ui components (auto-generated)
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── navbar.tsx
│   │   └── mobile-nav.tsx
│   ├── products/
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── product-detail.tsx
│   │   ├── product-images.tsx
│   │   └── variant-selector.tsx
│   ├── cart/
│   │   ├── cart-drawer.tsx
│   │   ├── cart-item.tsx
│   │   └── add-to-cart-button.tsx
│   ├── checkout/
│   │   ├── address-form.tsx
│   │   ├── order-summary.tsx
│   │   └── shipping-method.tsx
│   ├── orders/
│   │   └── order-card.tsx
│   └── common/
│       ├── price.tsx
│       ├── search-bar.tsx
│       └── pagination.tsx
│
├── lib/
│   ├── strapi.ts                    # Strapi API client
│   ├── auth.ts                      # Auth helpers
│   └── utils.ts                     # General utilities
│
├── hooks/
│   ├── use-cart.ts                  # Cart React Query hooks
│   ├── use-auth.ts                  # Auth hooks
│   └── use-products.ts             # Product hooks (client-side)
│
├── providers/
│   └── providers.tsx                # React Query + Auth providers
│
├── types/
│   └── strapi.d.ts                  # Generated from OpenAPI
│
├── public/
│   └── images/
├── .env.local
├── .env.production
├── Dockerfile
├── next.config.ts
├── components.json
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

### Fase 1: Strapi API Client

#### 4.1.1 API Client (`src/lib/strapi.ts`)

```typescript
import qs from "qs";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://strapi5-commere.ratama.space";

interface StrapiFetchOptions {
  path: string;
  urlParams?: Record<string, unknown>;
  options?: RequestInit;
  token?: string;
}

interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiSingleResponse<T> {
  data: T;
  meta: object;
}

export class StrapiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "StrapiError";
  }
}

/**
 * Base fetch function untuk Strapi API.
 * Digunakan oleh Server Components maupun Client Components.
 */
export async function strapiFetch<T>(
  path: string,
  urlParams: Record<string, unknown> = {},
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const queryString = qs.stringify(urlParams, {
    encodeValuesOnly: true,
    addQueryPrefix: true,
  });

  const url = `${STRAPI_URL}/api${path}${queryString}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string>),
      },
      cache: "no-store", // Default: no cache untuk data commerce yang dinamis
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new StrapiError(
        `Strapi API error: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof StrapiError) throw error;
    throw new StrapiError(
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
}

/**
 * Get image URL dengan base URL Strapi.
 */
export function getStrapiMedia(url: string): string {
  if (url.startsWith("http")) return url;
  return `${STRAPI_URL}${url}`;
}

/**
 * Format harga ke IDR.
 */
export function formatPrice(price: number, currency = "IDR"): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
```

#### 4.1.2 Data Fetching — Server Component Pattern

```typescript
// src/lib/products.ts

import { strapiFetch } from "./strapi";
import type { paths } from "@/types/strapi";

type Product = paths["/api/products"]["get"]["responses"]["200"]["content"]["application/json"];

export async function getProducts(page = 1, pageSize = 12, categorySlug?: string) {
  const filters: Record<string, unknown> = {
    publishedAt: { $notNull: true }, // Hanya published
  };

  if (categorySlug) {
    filters["categories"] = { slug: { $eq: categorySlug } };
  }

  return strapiFetch<Product>("/products", {
    populate: ["images", "categories", "variants"],
    filters,
    sort: ["createdAt:desc"],
    pagination: { page, pageSize },
  });
}

export async function getProductBySlug(slug: string) {
  return strapiFetch<Product>("/products", {
    filters: { slug: { $eq: slug } },
    populate: ["images", "categories", "variants", "specifications", "reviews.user"],
  });
}

export async function getFeaturedProducts() {
  return strapiFetch<Product>("/products", {
    filters: { featured: { $eq: true }, publishedAt: { $notNull: true } },
    populate: ["images", "categories"],
    pagination: { pageSize: 8 },
    sort: ["createdAt:desc"],
  });
}
```

---

### Fase 2: Product Listing

#### 4.2.1 Halaman Product Listing (`src/app/products/page.tsx`)

```typescript
import { Suspense } from "react";
import { getProducts } from "@/lib/products";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductGridSkeleton } from "@/components/products/product-grid-skeleton";
import { Pagination } from "@/components/common/pagination";
import { CategoryFilter } from "@/components/products/category-filter";
import { SortSelect } from "@/components/products/sort-select";

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    sort?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const category = params.category;
  const sort = params.sort;

  const response = await getProducts(page, 12, category);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {category ? `Kategori: ${category}` : "Semua Produk"}
      </h1>

      {/* Filter & Sort Bar */}
      <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
        <CategoryFilter currentSlug={category} />
        <SortSelect currentSort={sort} />
      </div>

      {/* Product Grid with Loading Skeleton */}
      <Suspense fallback={<ProductGridSkeleton count={12} />}>
        <ProductGrid products={response.data} />
      </Suspense>

      {/* Pagination */}
      <div className="mt-8">
        <Pagination
          currentPage={page}
          totalPages={response.meta.pagination.pageCount}
          basePath="/products"
          queryParams={{ category, sort }}
        />
      </div>
    </main>
  );
}
```

#### 4.2.2 Product Card Component

```typescript
// src/components/products/product-card.tsx

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStrapiMedia, formatPrice } from "@/lib/strapi";

interface ProductCardProps {
  product: {
    id: number;
    attributes: {
      name: string;
      slug: string;
      price: number;
      compareAtPrice?: number;
      shortDescription?: string;
      images?: { data: Array<{ attributes: { url: string; alternativeText?: string } }> };
      featured?: boolean;
    };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { name, slug, price, compareAtPrice, shortDescription, images, featured } = product.attributes;
  const imageUrl = images?.data?.[0]?.attributes?.url
    ? getStrapiMedia(images.data[0].attributes.url)
    : "/placeholder.png";

  return (
    <Link href={`/products/${slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {featured && (
            <Badge className="absolute top-2 left-2" variant="secondary">
              Featured
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-1">{name}</h3>
          {shortDescription && (
            <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
              {shortDescription}
            </p>
          )}
        </CardContent>

        <CardFooter className="px-4 pb-4 pt-0 flex items-center gap-2">
          <span className="text-lg font-bold">{formatPrice(price)}</span>
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(compareAtPrice)}
            </span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
```

#### 4.2.3 Product Grid Component

```typescript
// src/components/products/product-grid.tsx

import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: Array<{
    id: number;
    attributes: {
      name: string;
      slug: string;
      price: number;
      compareAtPrice?: number;
      shortDescription?: string;
      images?: unknown;
      featured?: boolean;
    };
  }>;
}

export function ProductGrid({ products }: ProductGridProps) {
  if (!products?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">Tidak ada produk ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

### Fase 3: Product Detail

#### 4.3.1 Product Detail Page (`src/app/products/[slug]/page.tsx`)

```typescript
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { ProductImages } from "@/components/products/product-images";
import { VariantSelector } from "@/components/products/variant-selector";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { SpecificationsTable } from "@/components/products/specifications-table";
import { ReviewSection } from "@/components/reviews/review-section";
import { ProductDetailSkeleton } from "@/components/products/product-detail-skeleton";
import { formatPrice } from "@/lib/strapi";
import { Suspense } from "react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const response = await getProductBySlug(slug);
  const product = response.data?.[0]?.attributes;

  if (!product) return { title: "Produk Tidak Ditemukan" };

  return {
    title: product.name,
    description: product.shortDescription,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const response = await getProductBySlug(slug);
  const product = response.data?.[0];

  if (!product) notFound();

  const { name, price, compareAtPrice, shortDescription, description, images, variants, specifications, inventory } =
    product.attributes;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Images */}
        <ProductImages images={images?.data ?? []} productName={name} />

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{name}</h1>
            {shortDescription && (
              <p className="text-muted-foreground mt-2">{shortDescription}</p>
            )}
          </div>

          {/* Harga */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{formatPrice(price)}</span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(compareAtPrice)}
              </span>
            )}
          </div>

          {/* Variant Selector */}
          {variants?.length > 0 && <VariantSelector variants={variants} />}

          {/* Add to Cart */}
          <Suspense fallback={<div className="h-12 w-full bg-muted animate-pulse rounded" />}>
            <AddToCartButton
              productId={product.id}
              productName={name}
              price={price}
              image={images?.data?.[0]?.attributes?.url}
              disabled={(inventory ?? 0) <= 0}
            />
          </Suspense>

          {/* Description */}
          {description && (
            <div className="prose max-w-none pt-4 border-t">
              <h2 className="text-lg font-semibold mb-2">Deskripsi</h2>
              <div dangerouslySetInnerHTML={{ __html: description }} />
            </div>
          )}

          {/* Specifications */}
          {specifications?.length > 0 && (
            <div className="pt-4 border-t">
              <h2 className="text-lg font-semibold mb-2">Spesifikasi</h2>
              <SpecificationsTable specifications={specifications} />
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Ulasan</h2>
        <ReviewSection productId={product.id} />
      </div>
    </main>
  );
}
```

#### 4.3.2 Product Images Carousel

```typescript
// src/components/products/product-images.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { getStrapiMedia } from "@/lib/strapi";

interface ProductImagesProps {
  images: Array<{ attributes: { url: string; alternativeText?: string } }>;
  productName: string;
}

export function ProductImages({ images, productName }: ProductImagesProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mediaUrls = images.map((img) => getStrapiMedia(img.attributes.url));

  if (!mediaUrls.length) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">No image</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <Image
          src={mediaUrls[selectedIndex]}
          alt={productName}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Thumbnails */}
      {mediaUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {mediaUrls.map((url, index) => (
            <button
              key={url}
              onClick={() => setSelectedIndex(index)}
              className={`relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors ${
                index === selectedIndex ? "border-primary" : "border-transparent hover:border-muted-foreground"
              }`}
            >
              <Image
                src={url}
                alt={`${productName} ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Fase 4: Cart

#### 4.4.1 Cart Store (React Query)

```typescript
// src/hooks/use-cart.ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantId?: string;
  variantName?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: number, variantId?: string) => void;
  updateQuantity: (productId: number, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get();
        const existingIndex = items.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += item.quantity || 1;
          set({ items: newItems });
        } else {
          set({ items: [...items, { ...item, quantity: item.quantity || 1 }] });
        }
      },

      removeItem: (productId, variantId) => {
        set({
          items: get().items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        });
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity }
              : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "cart-storage" } // Persist ke localStorage
  )
);
```

#### 4.4.2 Add to Cart Button

```typescript
// src/components/cart/add-to-cart-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/hooks/use-cart";
import { toast } from "sonner";

interface AddToCartButtonProps {
  productId: number;
  productName: string;
  price: number;
  image?: string;
  variantId?: string;
  variantName?: string;
  disabled?: boolean;
}

export function AddToCartButton({
  productId,
  productName,
  price,
  image,
  variantId,
  variantName,
  disabled,
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = () => {
    addItem({
      productId,
      name: productName,
      price,
      image,
      quantity,
      variantId,
      variantName,
    });
    toast.success(`${productName} ditambahkan ke keranjang!`);
    setQuantity(1);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={disabled}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center font-medium">{quantity}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setQuantity(quantity + 1)}
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button
        onClick={handleAddToCart}
        disabled={disabled}
        className="w-full"
        size="lg"
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {disabled ? "Stok Habis" : "Tambah ke Keranjang"}
      </Button>
    </div>
  );
}
```

#### 4.4.3 Cart Page

```typescript
// src/app/cart/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Minus, Plus, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/hooks/use-cart";
import { formatPrice, getStrapiMedia } from "@/lib/strapi";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();

  if (!items.length) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold mt-4">Keranjang Kosong</h1>
        <p className="text-muted-foreground mt-2">
          Kamu belum menambahkan produk apapun.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Lihat Produk</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Keranjang ({getItemCount()} item)
        </h1>
        <Button variant="ghost" asChild>
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Lanjut Belanja
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={`${item.productId}-${item.variantId ?? "default"}`}
            className="flex gap-4 p-4 bg-card rounded-lg border"
          >
            <div className="relative w-24 h-24 flex-shrink-0">
              <Image
                src={item.image ? getStrapiMedia(item.image) : "/placeholder.png"}
                alt={item.name}
                fill
                className="object-cover rounded-md"
                sizes="96px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium line-clamp-1">{item.name}</h3>
              {item.variantName && (
                <p className="text-sm text-muted-foreground">{item.variantName}</p>
              )}
              <p className="font-semibold mt-1">{formatPrice(item.price)}</p>

              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => removeItem(item.productId, item.variantId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      {/* Cart Summary */}
      <div className="flex flex-col items-end gap-4">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{formatPrice(getTotal())}</p>
        </div>
        <Button size="lg" asChild>
          <Link href="/checkout">Lanjut ke Checkout</Link>
        </Button>
      </div>
    </main>
  );
}
```

---

### Fase 5: Autentikasi

#### 4.5.1 Route Handler — Login (`src/app/api/auth/login/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    const response = await fetch(`${STRAPI_URL}/api/auth/local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || "Login gagal" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Simpan JWT di HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("token", data.jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    return NextResponse.json({
      user: data.user,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### 4.5.2 Route Handler — Register (`src/app/api/auth/register/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    const response = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || "Registrasi gagal" },
        { status: response.status }
      );
    }

    const data = await response.json();

    const cookieStore = await cookies();
    cookieStore.set("token", data.jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ user: data.user });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### 4.5.3 Route Handler — Logout

```typescript
// src/app/api/auth/logout/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  return NextResponse.json({ success: true });
}
```

#### 4.5.4 Route Handler — Get Current User

```typescript
// src/app/api/auth/me/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const response = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await response.json();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
```

#### 4.5.5 Auth Provider (React Context)

```typescript
// src/providers/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 menit
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
```

#### 4.5.6 useAuth Hook

```typescript
// src/hooks/use-auth.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface AuthUser {
  id: number;
  username: string;
  email: string;
}

interface LoginInput {
  identifier: string;
  password: string;
}

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["auth-user"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Login gagal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      router.refresh();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (input: RegisterInput) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Registrasi gagal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      router.refresh();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth-user"], null);
      router.refresh();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
```

#### 4.5.7 Login Page

```typescript
// src/app/auth/login/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoggingIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login({ identifier: email, password });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    }
  };

  return (
    <main className="container mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Masuk</CardTitle>
          <CardDescription>
            Masuk ke akun kamu untuk melanjutkan
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? "Memproses..." : "Masuk"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Belum punya akun?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Daftar
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
```

---

### Fase 6: Checkout

#### 4.6.1 Checkout Page

```typescript
// src/app/checkout/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/strapi";

export default function CheckoutPage() {
  const { items, getTotal, getItemCount, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Indonesia",
  });
  const [notes, setNotes] = useState("");

  const handleInputChange = (field: string, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            variantInfo: item.variantName,
          })),
          shippingAddress,
          billingAddress: shippingAddress, // Same as shipping
          notes,
          subtotal: getTotal(),
          totalAmount: getTotal(),
          currency: "IDR",
        }),
      });

      if (!response.ok) throw new Error("Gagal membuat pesanan");

      const order = await response.json();
      clearCart();
      router.push(`/orders/${order.data.attributes.orderNumber}`);
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!items.length) {
    router.push("/cart");
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Address Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alamat Pengiriman</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Depan</Label>
                    <Input
                      required
                      value={shippingAddress.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Belakang</Label>
                    <Input
                      required
                      value={shippingAddress.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Telepon</Label>
                  <Input
                    required
                    value={shippingAddress.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alamat</Label>
                  <Input
                    required
                    value={shippingAddress.addressLine1}
                    onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kota</Label>
                    <Input
                      required
                      value={shippingAddress.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provinsi</Label>
                    <Input
                      required
                      value={shippingAddress.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kode Pos</Label>
                    <Input
                      required
                      value={shippingAddress.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Negara</Label>
                    <Input
                      required
                      value={shippingAddress.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Catatan</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Catatan untuk pesanan (opsional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
                    <span className="line-clamp-1 flex-1">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="ml-2">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total ({getItemCount()} item)</span>
                  <span>{formatPrice(getTotal())}</span>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting || !isAuthenticated}
                >
                  {isSubmitting
                    ? "Memproses..."
                    : !isAuthenticated
                    ? "Login dulu untuk checkout"
                    : "Buat Pesanan"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </main>
  );
}
```

#### 4.6.2 Create Order Route Handler

```typescript
// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const STRAPI_URL = process.env.STRAPI_URL!;

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user
    const userRes = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userData = await userRes.json();

    const body = await req.json();

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const response = await fetch(`${STRAPI_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: {
          orderNumber,
          orderStatus: "pending",
          paymentStatus: "pending",
          subtotal: body.subtotal,
          tax: 0,
          shippingCost: 0,
          discount: 0,
          totalAmount: body.totalAmount,
          currency: body.currency || "IDR",
          notes: body.notes,
          user: userData.id,
          items: body.items,
          shippingAddress: body.shippingAddress,
          billingAddress: body.billingAddress,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error }, { status: response.status });
    }

    const order = await response.json();
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

### Fase 7: Order History

#### 4.7.1 Orders Page (Protected)

```typescript
// src/app/orders/page.tsx

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/strapi";

const STRAPI_URL = process.env.STRAPI_URL!;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) redirect("/auth/login");

  const res = await fetch(
    `${STRAPI_URL}/api/orders?populate=*&sort=createdAt:desc&pagination[pageSize]=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const response = await res.json();

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Pesanan Saya</h1>

      {!response.data?.length ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">Belum ada pesanan</p>
            <Button asChild>
              <Link href="/products">Mulai Belanja</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {response.data.map((order: any) => {
            const { orderNumber, orderStatus, totalAmount, currency, createdAt, items } =
              order.attributes;
            return (
              <Card key={order.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">
                    <Link
                      href={`/orders/${orderNumber}`}
                      className="hover:text-primary transition-colors"
                    >
                      #{orderNumber}
                    </Link>
                  </CardTitle>
                  <Badge className={STATUS_COLORS[orderStatus] || ""}>
                    {orderStatus}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-muted-foreground">
                        {formatDate(createdAt)}
                      </p>
                      <p>{items?.length || 0} item</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(totalAmount, currency)}</p>
                      <Link
                        href={`/orders/${orderNumber}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Lihat Detail
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
```

---

## 5. Root Layout

```typescript
// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/providers/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "E-Commerce Store",
    template: "%s | E-Commerce Store",
  },
  description: "E-Commerce store built with Next.js and Strapi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```

#### Header Component

```typescript
// src/components/layout/header.tsx
"use client";

import Link from "next/link";
import { ShoppingCart, User, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function Header() {
  const getItemCount = useCartStore((s) => s.getItemCount);
  const { isAuthenticated, user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="font-bold text-xl flex-shrink-0">
          Store
        </Link>

        {/* Search (hidden on mobile) */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari produk..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </Link>
          </Button>

          {isAuthenticated ? (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/account">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Masuk</Link>
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/products" className="text-lg font-medium">
                  Semua Produk
                </Link>
                <Link href="/categories" className="text-lg font-medium">
                  Kategori
                </Link>
                {isAuthenticated ? (
                  <>
                    <Link href="/orders" className="text-lg font-medium">
                      Pesanan Saya
                    </Link>
                    <Link href="/account" className="text-lg font-medium">
                      Akun
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="text-lg font-medium text-left text-destructive"
                    >
                      Keluar
                    </button>
                  </>
                ) : (
                  <Link href="/auth/login" className="text-lg font-medium">
                    Masuk / Daftar
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </header>
  );
}
```

---

## 6. Docker Setup

### 6.1 Dockerfile

```dockerfile
# nextjs-frontend/Dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Strapi types dari OpenAPI
RUN curl -o src/types/strapi.d.ts http://strapi5-commere.ratama.space/documentation/static/openapi.json || true

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Production
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
```

### 6.2 next.config.ts

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Untuk Docker deployment

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "strapi5-commere.ratama.space",
      },
      {
        protocol: "https",
        hostname: "minio-api.ratama.space",
      },
    ],
  },
};

export default nextConfig;
```

---

## 7. Checklist Implementasi

### Fase 0: Setup
- [ ] `create-next-app` scaffolding
- [ ] Install dependencies (Tailwind, shadcn/ui, React Query, openapi-typescript, qs, zustand)
- [ ] Konfigurasi `.env.local` dan `.env.production`
- [ ] Generate types dari Strapi (`openapi-typescript`)
- [ ] Setup `shadcn/ui` components
- [ ] Setup providers (React Query, Toast)
- [ ] Root layout + Header + Footer

### Fase 1: Product Listing
- [ ] Strapi API client (`src/lib/strapi.ts`)
- [ ] `getProducts()` server-side function
- [ ] Product card component
- [ ] Product grid component
- [ ] Products page (`/products`)
- [ ] Category filter
- [ ] Sort select
- [ ] Pagination

### Fase 2: Product Detail
- [ ] `getProductBySlug()` function
- [ ] Product detail page (`/products/[slug]`)
- [ ] Product images carousel
- [ ] Variant selector component
- [ ] Specifications table
- [ ] SEO metadata (generateMetadata)

### Fase 3: Cart
- [ ] Zustand cart store (`use-cart.ts`)
- [ ] Add to cart button
- [ ] Cart page (`/cart`)
- [ ] Cart badge di header

### Fase 4: Auth
- [ ] Route handlers: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`
- [ ] `useAuth` hook
- [ ] Login page
- [ ] Register page
- [ ] Auth provider integration

### Fase 5: Checkout
- [ ] Checkout page (`/checkout`)
- [ ] Address form
- [ ] Order summary
- [ ] Route handler: `POST /api/orders`

### Fase 6: Order History
- [ ] Orders page at `/orders` (protected)
- [ ] Order detail page at `/orders/[orderNumber]`

### Deployment
- [ ] Dockerfile
- [ ] `next.config.ts` dengan `output: "standalone"` dan `images.remotePatterns`
- [ ] Deploy ke Dokploy
- [ ] Test end-to-end

---

## 8. Catatan Penting

### Environment Variables di Dokploy

| Variable | Development | Production |
|----------|-------------|------------|
| `NEXT_PUBLIC_STRAPI_URL` | `http://strapi5-commere.ratama.space` | `http://strapi5-commere.ratama.space` (atau internal Docker network) |
| `STRAPI_URL` | `http://strapi5-commere.ratama.space` | `http://strapi5-commere.ratama.space` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://domain-kamu.com` |

### Hal yang Perlu Diperhatikan

1. **Strapi `http://` (bukan https)**: Untuk production, sebaiknya pasang SSL/TLS di Strapi. Untuk development, Next.js bisa fetch dari `http://` tanpa masalah.

2. **CORS Strapi**: Pastikan Strapi middleware CORS sudah mengizinkan domain Next.js-mu. Cek di `config/middlewares.ts`.

3. **Media URLs**: Gambar dari Strapi mungkin menggunakan URL internal MinIO. Gunakan `getStrapiMedia()` helper untuk resolve URL yang benar.

4. **Cart Guest vs Logged-in**: Saat ini cart hanya disimpan di localStorage (Zustand persist). Untuk production, pertimbangkan sync cart ke Strapi saat user login.

5. **Checkout Flow**: Belum ada payment gateway integration. Flow saat ini: create order → redirect ke order detail. Pertimbangkan Midtrans/Xendit untuk payment gateway Indonesia.

6. **Type Safety**: Types dari `openapi-typescript` mungkin tidak 100% match dengan response Strapi yang sebenarnya (karena populate fields). Bisa gunakan `as` type assertion atau buat wrapper types sendiri.

7. **middleware.ts → proxy.ts**: Di Next.js 16, `middleware.ts` sudah deprecated. Kalau butuh middleware (auth guard, redirect), rename ke `proxy.ts`.

---

## 9. Referensi

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Strapi v5 Documentation](https://docs.strapi.io/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [openapi-typescript](https://openapi-ts.dev/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Tailwind CSS 4 Documentation](https://tailwindcss.com/docs)
