# ISR Caching + Parallel Fetch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded `cache: "no-store"` with configurable ISR revalidation for read-heavy product/category fetches, and parallelize homepage data fetching with `Promise.allSettled`.

**Architecture:** Add optional `revalidate` parameter to `strapiFetch()` — when present, use Next.js `next: { revalidate: N }`; when absent, keep `cache: "no-store"` (backward compat for cart/inventory/orders/auth). Pass explicit revalidation times from `lib/products.ts` and `lib/categories.ts`. Use `Promise.allSettled` in `app/page.tsx` to fetch featured products and categories concurrently.

**Tech Stack:** Next.js 16 fetch API, no new dependencies

---

### Task 1: Add `revalidate` parameter to `strapiFetch`

**Files:**
- Modify: `lib/strapi.ts:33-70`

- [ ] **Step 1: Add `revalidate` parameter and conditional cache logic**

Replace the `strapiFetch` function signature and fetch call with:

```ts
export async function strapiFetch<T>(
  path: string,
  urlParams: Record<string, unknown> = {},
  options: RequestInit = {},
  token?: string,
  revalidate?: number,
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
      ...(revalidate !== undefined
        ? { next: { revalidate } }
        : { cache: "no-store" }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new StrapiError(`Strapi API error: ${response.statusText}`, response.status, errorData);
    }

    return response.json();
  } catch (error) {
    if (error instanceof StrapiError) throw error;
    throw new StrapiError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
```

- [ ] **Step 2: Run existing tests to confirm no regressions**

```bash
pnpm test
```
Expected: All existing tests PASS. (No callers pass `revalidate` yet, so `cache: "no-store"` applies — identical behavior.)

- [ ] **Step 3: Commit**

```bash
git add lib/strapi.ts
git commit -m "feat: add optional revalidate param to strapiFetch for ISR support"
```

---

### Task 2: Pass `revalidate` to product fetch functions

**Files:**
- Modify: `lib/products.ts:85-117`

- [ ] **Step 1: Add revalidation to getProducts**

In `lib/products.ts`, change the `getProducts` function's `strapiFetch` call at line 85:

```ts
export async function getProducts(page = 1, pageSize = 12, categorySlug?: string, sort?: string, search?: string) {
  const filters: Record<string, unknown> = {
    publishedAt: { $notNull: true },
  };

  if (categorySlug) {
    filters["categories"] = { slug: { $eq: categorySlug } };
  }

  if (search) {
    filters["name"] = { $containsi: search };
  }

  return strapiFetch<ProductsResponse>("/products", {
    populate: ["images", "categories", "variants"],
    filters,
    sort: SORT_MAP[sort ?? "terbaru"],
    pagination: { page, pageSize },
  }, {}, undefined, 60);
}
```

(The only change: `}, {}, undefined, 60);` appended to the existing call.)

- [ ] **Step 2: Add revalidation to getProductBySlug**

Change the `getProductBySlug` function's `strapiFetch` call at line 94:

```ts
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
        populate: { user: true },
      },
    },
  }, {}, undefined, 120);
}
```

- [ ] **Step 3: Add revalidation to getFeaturedProducts**

Change the `getFeaturedProducts` function's `strapiFetch` call at line 112:

```ts
export async function getFeaturedProducts() {
  return strapiFetch<ProductsResponse>("/products", {
    filters: { featured: { $eq: true }, publishedAt: { $notNull: true } },
    populate: ["images", "categories"],
    pagination: { pageSize: 8 },
    sort: ["createdAt:desc"],
  }, {}, undefined, 60);
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/products.ts
git commit -m "feat: add ISR revalidation to product fetches (60s list, 120s detail)"
```

---

### Task 3: Pass `revalidate` to category fetch functions

**Files:**
- Modify: `lib/categories.ts:24-35`

- [ ] **Step 1: Add revalidation to getCategories**

Change the `getCategories` function's `strapiFetch` call at line 24:

```ts
export async function getCategories() {
  return strapiFetch<CategoriesResponse>("/categories", {
    populate: ["image"],
    sort: ["order:asc", "name:asc"],
    pagination: { pageSize: 100 },
  }, {}, undefined, 3600);
}
```

- [ ] **Step 2: Add revalidation to getCategoryBySlug**

Change the `getCategoryBySlug` function's `strapiFetch` call at line 32:

```ts
export async function getCategoryBySlug(slug: string) {
  return strapiFetch<CategoriesResponse>("/categories", {
    filters: { slug: { $eq: slug } },
    populate: ["image"],
  }, {}, undefined, 3600);
}
```

- [ ] **Step 3: Run tests**

```bash
pnpm test
```
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/categories.ts
git commit -m "feat: add ISR revalidation to category fetches (1h)"
```

---

### Task 4: Parallelize homepage data fetching with `Promise.allSettled`

**Files:**
- Modify: `app/page.tsx:14-29`

- [ ] **Step 1: Replace sequential awaits with Promise.allSettled**

Replace lines 14-29 in `app/page.tsx`:

```tsx
export default async function HomePage() {
  const [featuredResult, categoriesResult] = await Promise.allSettled([
    getFeaturedProducts(),
    getCategories(),
  ]);

  const featuredProducts: ProductData[] =
    featuredResult.status === "fulfilled" ? featuredResult.value.data : [];
  const categories: CategoryData[] =
    categoriesResult.status === "fulfilled" ? categoriesResult.value.data : [];

  return (
```

(This replaces the two sequential `try/catch` blocks with a single `Promise.allSettled` + destructure.)

- [ ] **Step 2: Run tests**

```bash
pnpm test
```
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "perf: parallelize homepage featured + categories fetch with Promise.allSettled"
```

---

### Task 5: Verify build

**Files:**
- None (verification only)

- [ ] **Step 1: Run production build**

```bash
pnpm build
```
Expected: Build succeeds with no errors. Output confirms ISR routes are recognized.

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```
Expected: No new lint errors.

---
