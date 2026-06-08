# Orders Pages UI Redesign

## Overview

Major redesign of `/orders` (list) and `/orders/[orderNumber]` (detail) pages with a timeline-centric, warm minimalist approach.

## Design Direction

- **Style**: Warm Minimalist — clean, spacious, elegant
- **Palette**: Existing project palette (primary: `#D4A373`, earthy browns)
- **Typography**: Existing — Playfair Display (headings) + Inter (body)
- **Dark Mode**: Not in scope (keep existing dark classes as-is, no new dark mode design)

## Selected Features

1. **Order Status Timeline** — Progress tracker (pending → processing → shipped → delivered) as hero element on detail page
2. **Filter & Search** — Status filter chips + search by order number via URL searchParams
3. **Loading & Empty States** — Skeleton loading, empty state with illustration, error state with retry
4. **Product Images** — Thumbnails in order item lists
5. **Mobile-First Polish** — Responsive card stack, horizontal scroll filter, touch-friendly

## Component Architecture

### `/orders` (List Page)

```
OrdersPage (server component, async)
├── OrdersHeader — title + order count
├── OrderFilterBar — status chips + search input (client component)
├── OrderCard[] (repeating)
│   ├── OrderCardHeader — order number + status badge + total
│   ├── OrderCardMeta — date, item count, courier info
│   ├── OrderItemThumbnails — product image strip
│   └── Link → /orders/[orderNumber]
├── EmptyState — illustration + "Mulai Belanja" CTA
├── ErrorState — message + retry + "Kembali ke Beranda"
├── FilterEmptyState — "Tidak Ditemukan" + reset filter
└── OrderListSkeleton — shimmer loading
```

### `/orders/[orderNumber]` (Detail Page)

```
OrderDetailPage (server component, async)
├── BackButton
├── OrderHeader — order number + status badge
├── OrderTimeline — progress tracker with timestamps (hero element)
├── OrderItems — list with product image thumbnails
├── ShippingAddress — icon + formatted address
├── OrderNotes — conditional
└── OrderSummary — sidebar/inline: subtotal, tax, shipping, discount, total, payment status
```

### Desktop Layout (≥1024px)

Two-column: left (items + shipping + notes) at 60%, right (summary sidebar, sticky) at 40%.

### Mobile Layout (<1024px)

Single column stack. All sections vertical. Timeline stays horizontal (compact). Filter chips horizontal scroll. Summary inline at bottom.

## Data Flow

- **Orders List**: Server component → `cookies()` → token → `getOrders(token)` → render
- **Order Detail**: Server component → `cookies()` → token → `getOrderByNumber(orderNumber, token)` → render or `notFound()`
- **Filter & Search**: Client component using `useSearchParams` / `useRouter`. URL-based: `/orders?status=processing&q=ORD-`. Debounced search input (300ms). No client-side re-fetch needed — URL update triggers server re-render.
- **No client-side data fetching** needed. All data server-rendered.

## States

| State | Behavior |
|-------|----------|
| Loading (list) | Skeleton cards matching exact layout, staggered opacity |
| Loading (detail) | Skeleton matching header → timeline → 2-column structure |
| Empty | Centered illustration, "Belum Ada Pesanan" heading, CTA button |
| Error | Warning icon, "Gagal Memuat Pesanan", retry + home buttons |
| Filter empty | Search icon, "Tidak Ditemukan", reset filter button |
| Not found | Next.js `notFound()` — renders `not-found.tsx` |

## Status Badge Colors (Updated)

```
pending    → amber-50/700 + amber-200 border (pill style)
processing → blue-50/700 + blue-200 border
shipped    → purple-50/700 + purple-200 border
delivered  → green-50/700 + green-200 border
cancelled  → red-50/700 + red-200 border
```

New style: pill badges with soft borders, 11px text. Softer than current saturated approach.

## Animations

- **Card entrance**: Staggered `opacity 0→1` + `translateY 12px→0`, 80ms delay per card, 300ms duration, ease-out
- **Timeline fill**: `scaleX 0→1` for progress line, 500ms, spring easing
- **Timeline icons**: `scale 0→1.1→1` pop effect
- **Card hover**: `translateY -2px`, warm-tinted shadow, border glow, price color shift → 150-200ms
- **Status badge**: Subtle pulse on mount (600ms, once)
- **Filter chips**: Instant color swap with 200ms bg transition
- All animations respect `prefers-reduced-motion`

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 640px (mobile) | Single column, full-width cards, horizontal scroll filters |
| 640-1023px (tablet) | Single column, wider cards, more padding |
| ≥ 1024px (desktop) | Two-column detail, filter bar horizontal, summary sticky |

Touch targets ≥ 44px for mobile. No sticky button bars. No accordions — show all info directly.

## Implementation Constraints

- **No new dependencies** — use existing shadcn/ui components, lucide-react icons, tw-animate-css
- **No dark mode design** — keep existing `dark:` classes as-is, no new dark variants
- **No order actions** — cancel, re-order, download invoice NOT in scope
- **Server components by default** — only OrderFilterBar needs `"use client"`
- **Match existing patterns** — container `max-w-4xl`, same font classes, same currency formatting
- **Keep `lib/orders.ts` unchanged** — data layer stays as-is

## Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `app/orders/page.tsx` | Rewrite | New layout with filter bar, redesigned cards, states |
| `app/orders/[orderNumber]/page.tsx` | Rewrite | Timeline hero, redesigned items, summary |
| `components/orders/order-card.tsx` | Create | Reusable card component |
| `components/orders/order-timeline.tsx` | Create | Status progress tracker |
| `components/orders/order-filter-bar.tsx` | Create | Client component for filter + search |
| `components/orders/order-skeleton.tsx` | Create | Skeleton loading components |
| `components/orders/order-empty-state.tsx` | Create | Empty state component |

## Out of Scope

- Dark mode polish
- Order actions (cancel, re-order, download invoice)
- Pagination (current 50 item limit is sufficient)
- Real-time order tracking
- Push notifications
