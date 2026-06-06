# Shipping Cost Check (Cek Ongkos Kirim) — Design Spec

**Date:** 2026-06-06
**Status:** Approved

## Overview

Integrate KiriminAja shipping cost API into the checkout flow, replacing hardcoded shipping costs with real-time courier options. Users can search their destination subdistrict, and the system calculates shipping costs from the store's origin to their selected destination.

## API Endpoints (KiriminAja)

### 1. Subdistrict Search

```
GET https://prd-kaj-srvc-dshbd-api-ext.kiriminaja.com/api/dm/v1/coverage/allleveldistrict/search?keyword={keyword}
```

Response returns matching subdistricts with ID, name, city, province.

### 2. Shipping Cost

```
GET https://prd-kaj-srvc-dshbd-api-ext.kiriminaja.com/api/dm/v1/shipping/express?subdistrict_origin={id}&subdistrict_destination={id}&weight={grams}&length={cm}&width={cm}&height={cm}
```

Response returns list of courier services with name, price, estimated delivery time.

## Environment Variables

```env
KIRIMINAJA_ORIGIN_SUBDISTRICT_ID=5470
KIRIMINAJA_ORIGIN_TITLE=Jatimukti, Jatinangor, Sumedang, Jawa Barat
```

API headers (api-key, authorization, device-id) are hardcoded in server-side route handlers following the existing BFF pattern.

## Architecture

### BFF Pattern (Server-Side API Routes)

```
Client (checkout page)
  │
  ├── GET /api/shipping/search-district?keyword={q}
  │     └─→ Server-side proxy to KiriminAja coverage API
  │
  └── GET /api/shipping/cost?subdistrict_destination={id}&weight={g}&length={l}&width={w}&height={h}
        └─→ Server-side proxy to KiriminAja shipping/express API
```

Server-side route handlers in `app/api/shipping/` proxy requests to KiriminAja, keeping API credentials secure (not exposed to client).

### New API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/shipping/search-district` | GET | Proxy to coverage/allleveldistrict/search |
| `/api/shipping/cost` | GET | Proxy to shipping/express |

## Components

### New Components

#### `components/checkout/subdistrict-search.tsx`
- Autocomplete search input with 300ms debounce
- Fetches from `/api/shipping/search-district?keyword={query}`
- Renders dropdown with subdistrict name, city, province
- On select: sets `selectedSubdistrict` (id + title) in parent
- Handles empty results, loading, and error states

#### `components/checkout/shipping-options.tsx`
- Displays after user selects a subdistrict
- Fetches from `/api/shipping/cost` with destination id + weight + dimensions
- Renders courier options as radio buttons: name + price + ETD
- Loading skeleton during fetch
- Handles empty results ("Tidak tersedia ke lokasi ini") and error with retry
- On select: sets `selectedCourier` (name + price) in parent

### Modified Components

#### `hooks/use-cart.ts`
- Add `weight?: number` to `CartItem` interface
- Add `getTotalWeight()` helper: sum of `item.weight * item.quantity` with fallback `500` per item

#### `components/cart/add-to-cart-button.tsx`
- New optional prop: `weight?: number`
- Pass to `addItem()` call

#### `lib/products.ts`
- Add `weight` to `ProductData` interface
- Include `weight` in Strapi populate queries

#### `app/products/[slug]/page.tsx`
- Pass `product.weight` through component chain to AddToCartButton

#### `components/products/product-actions.tsx`
- Pass `weight` prop to AddToCartButton

#### `app/checkout/page.tsx`
Main changes:
- **Remove** `SHIPPING_COST` constant (was 15000)
- **Replace** city/state/postalCode fields with subdistrict search component
- **Add** `selectedSubdistrict`, `selectedCourier`, `shippingCost` state
- **Add** auto-fetch shipping cost when subdistrict changes
- **Add** validation: courier must be selected before submit
- Shipping cost sourced from selected courier (no longer hardcoded)
- Submit includes courier name appended to `notes` field (Strapi Order tidak punya field `shippingMethod`)

#### `components/checkout/order-summary.tsx`
- Added `shippingMethod` prop (courier name) for display
- Free shipping threshold still applies at Rp 200.000

## Data Flow

```
1. User types keyword → debounce → GET /api/shipping/search-district → dropdown results
2. User selects subdistrict → auto-fetch shipping costs:
   GET /api/shipping/cost?subdistrict_destination={id}&weight={totalWeight}&length={l}&width={w}&height={h}
3. Show ShippingOptions radio list
4. User selects courier → shippingCost set → total recomputes
5. User submits order → POST /api/orders
```

## Product Weight & Dimensions (Option C)

### Weight
- Fetch `weight` field from Strapi Product (already exists in schema)
- Added to populate queries in `lib/products.ts`
- Passed through cart to checkout
- Total weight = sum of (product weight × quantity)
- Fallback: 500 grams per item if product has no weight

### Dimensions (length, width, height)
- Strapi does NOT currently have dimension fields on Product
- **Default package dimensions based on total weight:**

| Total Weight | length × width × height (cm) |
|-------------|-----------------------------|
| ≤ 1 kg       | 20 × 15 × 10                |
| ≤ 2 kg       | 27 × 13 × 7                 |
| ≤ 5 kg       | 30 × 20 × 15                |
| > 5 kg       | 40 × 30 × 20                |

- **Future:** When Strapi gets `length`, `width`, `height` fields per product, the code will use those with the default table as fallback

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Search API fails | toast "Gagal mencari lokasi" + manual input visible |
| No search results | Dropdown shows "Tidak ada hasil" message |
| Shipping cost API fails | Error message with "Coba Lagi" button |
| No couriers available | "Maaf, belum tersedia pengiriman ke lokasi Anda" |
| Product has no weight | Fallback to 500g per item |
| Courier not selected on submit | Validation error: "Silakan pilih kurir pengiriman" |

## State & Types

### New CartItem field
```typescript
interface CartItem {
  // ... existing fields
  weight?: number;
}
```

### New Checkout state
```typescript
const [selectedSubdistrict, setSelectedSubdistrict] = useState<{
  id: number;
  title: string;
} | null>(null);

const [selectedCourier, setSelectedCourier] = useState<{
  name: string;
  price: number;
} | null>(null);

const [shippingCost, setShippingCost] = useState(0);
const [isLoadingShipping, setIsLoadingShipping] = useState(false);
```

## Files Changed

| File | Action |
|------|--------|
| `.env.local` | Edit — add KiriminAja env vars |
| `hooks/use-cart.ts` | Edit — add weight + getTotalWeight |
| `components/cart/add-to-cart-button.tsx` | Edit — accept weight prop |
| `lib/products.ts` | Edit — add weight to ProductData + populate |
| `app/products/[slug]/page.tsx` | Edit — pass weight |
| `components/products/product-actions.tsx` | Edit — pass weight to button |
| `components/checkout/subdistrict-search.tsx` | **Create** |
| `components/checkout/shipping-options.tsx` | **Create** |
| `app/checkout/page.tsx` | Edit — integrate subdistrict + shipping |
| `components/checkout/order-summary.tsx` | Minor edit — shippingMethod prop |
| `lib/cart-sync.ts` | Edit — add weight to ResolvedProduct + fetch in resolveCartItems |
| `app/api/shipping/search-district/route.ts` | **Create** |
| `app/api/shipping/cost/route.ts` | **Create** |
