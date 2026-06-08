# Product Card Redesign — Design Spec

Date: 2026-06-08
Status: Approved
Stack: Next.js 16, Tailwind CSS 4, Shadcn/ui, TypeScript

## Overview

Redesign the `ProductCard` component for the Cyra brand (preloved fashion curated). Shift from generic minimalist to **elegant & premium** — reflecting a curated thrift experience, not just second-hand cheap.

## Brand & Visual Direction

### Palette (Warm Earth Tones)

| Token | Role |
|-------|------|
| `cream` | Card/page background base |
| `terracotta` | Primary accent (badges, hover borders, quick-view button) |
| `sage green` | Secondary accent (condition tier indicators) |
| `dark charcoal` | Text primary |
| `warm gray` | Text secondary, muted elements |

### Typography

| Usage | Font |
|-------|------|
| Product name | **Playfair Display** (serif, heading) |
| Price, badges, all else | **Inter** (sans-serif, body) |

Font loading via `next/font/google`.

### Animation Philosophy

- Easing: `ease-out` cubic-bezier
- Duration: 300-400ms
- Deliberate, luxurious — leisure browsing, not task-driven

---

## Component: `ProductCard`

### Structure (top → bottom)

```
┌─────────────────────────┐
│ [Discount Badge]        │  ← Badge area (absolute positioned)
│ [Condition Badge]       │
│                         │
│     Main Image          │  ← aspect-square
│  ┌───────────────────┐  │
│  │ Price (overlay)   │  │  ← gradient dark→transparent, bottom
│  └───────────────────┘  │
│                         │
│ ● ● ● ●  (thumbnail    │  ← Horizontal scroll if >4
│   strip)               │
│                         │
│ Product Name            │  ← Playfair Display, line-clamp-1
│ Condition tier text     │  ← Inter, small, muted
└─────────────────────────┘
```

### Image Experience

1. **Main image**: First image displayed by default
2. **Thumbnail strip**: Renders all `product.images[]` as small thumbnails below main image
3. **Thumbnails > 4**: Container becomes horizontally scrollable (mini carousel)
4. **Thumbnail click**: Swaps the main image
5. **Active thumbnail**: Accent border/ring (terracotta)

### Price Overlay

- Positioned at **bottom of main image area**
- Background: `linear-gradient(to top, rgba(0,0,0,0.6), transparent)`
- Displays: current price (white, bold) + original price (white, strike-through, muted)
- No overlay when `compareAtPrice` is absent or ≤ `price`

### Badges

**Discount Badge** (prominent):
- Shows when `compareAtPrice > price`
- Format: `-XX%` (calculated percentage)
- Styling: terracotta background, white text, bold
- Position: top-right corner of card

**Condition Tier Badge** (subtle):
- Data source: `product.condition` field (new — needs adding to `ProductData`)
- Values: `like_new`, `gently_used`, `well_loved`
- Styling: outlined/ghost style, subtle background
- Position: adjacent to discount badge or below

**Featured Badge** (existing, refined):
- Position: top-left corner
- Styling: outlined/subtle, warm tone

### Hover Effects

| Trigger | Effect |
|---------|--------|
| Card hover | Lift (`translateY(-4px)`), shadow deepen (`shadow-lg` → `shadow-xl`) |
| Main image hover | Scale to 105%, smooth zoom |
| Thumbnail hover | Terracotta outline border |
| Card hover (duration) | Quick-view button fades in at image center |

### Quick-View Button

- Visible **only on card hover** (desktop)
- Position: centered on main image area
- Styling: semi-transparent background, white icon/text, rounded
- Opens: `QuickViewModal` component

### Click Behavior

| Click target | Action |
|-------------|--------|
| Quick-View button | Open modal |
| Any other area of card | Navigate to `/products/{slug}` |

### Responsive

| Breakpoint | Behavior |
|------------|----------|
| `md+` (desktop) | Full features: thumbnails, quick-view, price overlay, badges |
| `<md` (mobile) | Simplified: thumbnails + price overlay, **no quick-view button**, badges remain. Tap card → product detail |

---

## Component: `QuickViewModal`

### Contents

1. **Image gallery**: Swipeable / dot-navigated product images
2. **Product name**: Playfair Display heading
3. **Price**: Current + original (if discounted)
4. **Condition tier**: Badge + text
5. **Short description** (if available)
6. **Variant/size selector**: If product has variants
7. **Stock indicator**: "Tersisa X" if stock ≤ threshold
8. **Add to Cart button**: Primary CTA, full-width
9. **View Full Details link**: Secondary, opens product detail page

### Interaction

- Opened via Quick-View button on card
- Closed via: X button, ESC key, click outside (overlay)
- Transition: fade + scale entrance

---

## Component: `ThumbnailStrip`

Reusable sub-component for the mini image carousel.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `images` | `StrapiImage[]` | All product images |
| `activeIndex` | `number` | Currently selected index |
| `onSelect` | `(index: number) => void` | Selection callback |

### Behavior

- Renders all thumbnails as small squares (e.g., 56x56px)
- Active thumbnail: terracotta border ring
- Horizontal scroll (native CSS `overflow-x: auto` + `scroll-snap`) when > 4 items
- Arrow buttons optional (could be v2)

---

## Component: `ProductGridSkeleton` (update)

Update existing skeleton to match new card layout:

- Main image rect (aspect-square)
- 4 small circle/rects for thumbnail strip
- 1 wide line (product name)
- 1 narrow line (condition)
- Shimmer animation (existing pattern)

---

## Data Changes

### `ProductData` (lib/products.ts)

Add field:
```ts
condition?: "like_new" | "gently_used" | "well_loved";
```

### Strapi Integration

- Populate `condition` field from Strapi product content type
- Add to `getProducts()` and `getProductBySlug()` populate arrays if field exists

---

## Files to Modify

| File | Change |
|------|--------|
| `components/products/product-card.tsx` | Full redesign |
| `components/products/product-image.tsx` | May need minor update for new behavior |
| `components/products/product-grid-skeleton.tsx` | Match new card layout |
| `lib/products.ts` | Add `condition` field to `ProductData` |
| `lib/strapi.ts` | Verify `formatPrice` supports new overlay use |

## New Files

| File | Purpose |
|------|---------|
| `components/products/thumbnail-strip.tsx` | Thumbnail carousel sub-component |
| `components/products/quick-view-modal.tsx` | Quick-view modal |
| `components/products/product-condition-badge.tsx` | Condition tier badge |
| `components/products/product-discount-badge.tsx` | Discount percentage badge |

---

## Out of Scope

- Wishlist/favorite functionality
- Product comparison
- "Recently viewed" integration
- Analytics/tracking on card interactions
- A/B testing infrastructure

---

## Success Criteria

1. Cards render with thumbnail strip, price overlay, and badges matching the spec
2. Hover effects trigger correctly: lift, shadow, zoom, quick-view button appear
3. Thumbnail click swaps main image, active state visible
4. Quick-view modal opens/closes with correct content
5. Skeleton loading matches new card layout
6. Mobile: quick-view button hidden, all else functional
7. Zero layout shift during image loading
8. Typography uses Playfair Display + Inter via next/font
