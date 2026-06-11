# Graph Report - next-commerce-temp  (2026-06-11)

## Corpus Check
- 127 files · ~74,988 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 378 nodes · 469 edges · 18 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3cf60206`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 54|Community 54]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 33 edges
2. `strapiFetch()` - 15 edges
3. `formatPrice()` - 15 edges
4. `Badge()` - 13 edges
5. `Next.js 16` - 12 edges
6. `useAuth()` - 11 edges
7. `Strapi v5 CMS` - 10 edges
8. `next-commerce-temp Project` - 9 edges
9. `Input()` - 7 edges
10. `ProductImage()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Breaking Changes Awareness` --semantically_similar_to--> `middleware.ts to proxy.ts Migration`  [INFERRED] [semantically similar]
  AGENTS.md → docs/strapi5-next16-integration.md
- `Search district API route` --implements--> `BFF proxy pattern for API credentials`  [INFERRED]
  app/api/shipping/search-district/route.ts → docs/superpowers/specs/2026-06-06-shipping-cost-check-design.md
- `Shipping cost API route` --implements--> `BFF proxy pattern for API credentials`  [INFERRED]
  app/api/shipping/cost/route.ts → docs/superpowers/specs/2026-06-06-shipping-cost-check-design.md
- `Shipping Cost Check design spec` --references--> `TAX_RATE 11% constant`  [EXTRACTED]
  docs/superpowers/specs/2026-06-06-shipping-cost-check-design.md → app/checkout/page.tsx
- `LoginPage()` --calls--> `useAuth()`  [INFERRED]
  app/auth/login/page.tsx → hooks/use-auth.ts

## Hyperedges (group relationships)
- **Checkout shipping cost flow** — checkout_CheckoutPage, checkout_SubdistrictSearch, checkout_ShippingOptions, checkout_OrderSummary, checkout_searchDistrictRoute, checkout_shippingCostRoute, shipping_KiriminAjaAPI, shipping_getDimensionsByWeight, shipping_ShippingOption, shipping_SubdistrictResult [INFERRED 0.85]
- **Weight data flow from product to shipping** — products_ProductData, products_ProductActions, cart_AddToCartButton, cart_CartItem, cart_useCartStore, checkout_CheckoutPage, shipping_getDimensionsByWeight [INFERRED 0.80]
- **BFF proxy layer for KiriminAja** — checkout_searchDistrictRoute, checkout_shippingCostRoute, shipping_KiriminAjaAPI, shipping_BFFPattern [INFERRED 0.85]
- **Cart sync architecture (Zustand + Strapi)** — cart_CartSyncComponent, cart_useCartSync, cart_useCartStore, cart_cartSyncLib, shipping_ZustandPersist [INFERRED 0.80]

## Communities (55 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (9): getStrapiMedia(), cn(), ProductConditionBadge(), calcDiscount(), ProductDiscountBadge(), ProductImage(), Badge(), RadioGroup() (+1 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (32): Next.js App Router, Auth Route Handlers, Cart Content Type, Category Content Type, LLM Coding Behavioral Guidelines, create-next-app, Docker Standalone Container, Dokploy VPS (+24 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (10): AddToCartButton(), getProductBySlug(), formatDate(), formatPrice(), getStatusBadgeClass(), getTimelineSteps(), OrderCard(), VariantSelector() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (11): LogoutButton(), CartSync(), CheckoutPage(), SearchBar(), useAuth(), useCartSync(), getCartDimensions(), getDimensionsByWeight() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (15): FadeInSection(), WhyCyraSection(), getCategories(), getCategoryBySlug(), createOrder(), getOrderByNumber(), getOrders(), getFeaturedProducts() (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (26): AddToCartButton component, CartItem type, CartSync component, Cart sync API client library, useCartStore zustand store, useCartSync hook, CheckoutPage component, OrderSummary component (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (5): DropdownMenu(), DropdownMenuTrigger(), Sheet(), SheetTitle(), SheetTrigger()

### Community 7 - "Community 7"
Cohesion: 0.21
Nodes (12): generateSessionId(), getOrCreateSessionId(), getSessionId(), resetSessionId(), setSessionId(), createCart(), deleteCart(), fetchCart() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (5): CommandGroup(), CommandItem(), Dialog(), Popover(), PopoverTrigger()

### Community 9 - "Community 9"
Cohesion: 0.23
Nodes (6): SortSelect(), SelectContent(), SelectGroup(), SelectItem(), SelectTrigger(), SelectValue()

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (3): OrderListSkeleton(), ProductDetailSkeleton(), Skeleton()

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (3): SpecificationsTable(), Table(), TableBody()

### Community 13 - "Community 13"
Cohesion: 0.4
Nodes (3): Carousel(), CarouselNext(), useCarousel()

### Community 19 - "Community 19"
Cohesion: 0.67
Nodes (3): File Icon, Globe Icon, Window Icon

## Knowledge Gaps
- **35 isolated node(s):** `PostgreSQL 17`, `MinIO S3 Storage`, `Dokploy VPS`, `Tailwind CSS 4`, `shadcn/ui` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 0` to `Community 2`, `Community 3`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 15`?**
  _High betweenness centrality (0.251) - this node is a cross-community bridge._
- **Why does `formatPrice()` connect `Community 2` to `Community 0`, `Community 3`, `Community 6`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Why does `strapiFetch()` connect `Community 4` to `Community 2`, `Community 7`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `strapiFetch()` (e.g. with `getProducts()` and `getProductBySlug()`) actually correct?**
  _`strapiFetch()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PostgreSQL 17`, `MinIO S3 Storage`, `Dokploy VPS` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._