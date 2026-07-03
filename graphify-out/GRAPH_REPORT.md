# Graph Report - next-commerce-temp  (2026-07-02)

## Corpus Check
- 172 files · ~127,704 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 486 nodes · 627 edges · 24 communities detected
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `56a23206`
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
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 71|Community 71]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 40 edges
2. `strapiFetch()` - 18 edges
3. `useAuth()` - 17 edges
4. `formatPrice()` - 16 edges
5. `Badge()` - 13 edges
6. `Next.js 16` - 12 edges
7. `Strapi v5 CMS` - 10 edges
8. `Input()` - 9 edges
9. `getStrapiMedia()` - 9 edges
10. `WishlistButton()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `CheckoutPage()` --calls--> `useAuth()`  [INFERRED]
  app/checkout/page.tsx → hooks/use-auth.ts
- `Next.js Breaking Changes Awareness` --semantically_similar_to--> `middleware.ts to proxy.ts Migration`  [INFERRED] [semantically similar]
  AGENTS.md → docs/strapi5-next16-integration.md
- `Search district API route` --implements--> `BFF proxy pattern for API credentials`  [INFERRED]
  app/api/shipping/search-district/route.ts → docs/superpowers/specs/2026-06-06-shipping-cost-check-design.md
- `Shipping cost API route` --implements--> `BFF proxy pattern for API credentials`  [INFERRED]
  app/api/shipping/cost/route.ts → docs/superpowers/specs/2026-06-06-shipping-cost-check-design.md
- `Shipping Cost Check design spec` --references--> `TAX_RATE 11% constant`  [EXTRACTED]
  docs/superpowers/specs/2026-06-06-shipping-cost-check-design.md → app/checkout/page.tsx

## Hyperedges (group relationships)
- **Checkout shipping cost flow** — checkout_CheckoutPage, checkout_SubdistrictSearch, checkout_ShippingOptions, checkout_OrderSummary, checkout_searchDistrictRoute, checkout_shippingCostRoute, shipping_KiriminAjaAPI, shipping_getDimensionsByWeight, shipping_ShippingOption, shipping_SubdistrictResult [INFERRED 0.85]
- **Weight data flow from product to shipping** — products_ProductData, products_ProductActions, cart_AddToCartButton, cart_CartItem, cart_useCartStore, checkout_CheckoutPage, shipping_getDimensionsByWeight [INFERRED 0.80]
- **BFF proxy layer for KiriminAja** — checkout_searchDistrictRoute, checkout_shippingCostRoute, shipping_KiriminAjaAPI, shipping_BFFPattern [INFERRED 0.85]
- **Cart sync architecture (Zustand + Strapi)** — cart_CartSyncComponent, cart_useCartSync, cart_useCartStore, cart_cartSyncLib, shipping_ZustandPersist [INFERRED 0.80]

## Communities (72 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (13): AddToCartButton(), formatDate(), formatPrice(), getStrapiMedia(), getStatusBadgeClass(), getTimelineSteps(), OrderCard(), ProductConditionBadge() (+5 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (22): CategoriesPage(), getCategories(), getCategoryBySlug(), checkInventory(), createOrder(), getOrderByNumber(), getOrders(), getFeaturedProducts() (+14 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (10): AddressForm(), SearchBar(), DropdownMenu(), DropdownMenuTrigger(), Input(), Sheet(), SheetDescription(), SheetTitle() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (32): Next.js App Router, Auth Route Handlers, Cart Content Type, Category Content Type, LLM Coding Behavioral Guidelines, create-next-app, Docker Standalone Container, Dokploy VPS (+24 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (13): LogoutButton(), CartSync(), useAuth(), useCartSync(), useAddToWishlist(), useIsInWishlist(), useRemoveFromWishlist(), useWishlist() (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (10): AccountTabs(), OrderListSkeleton(), ProductDetailSkeleton(), RadioGroup(), RadioGroupItem(), Skeleton(), Tabs(), TabsContent() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.1
Nodes (26): AddToCartButton component, CartItem type, CartSync component, Cart sync API client library, useCartStore zustand store, useCartSync hook, CheckoutPage component, OrderSummary component (+18 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (10): AddressCard(), handleSubmit(), CheckoutPage(), handleSubmit(), createAddress(), updateAddress(), useAddresses(), getCartDimensions() (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.1
Nodes (7): motionAllowed(), FadeInSection(), WhyCyraSection(), ProductGrid(), Carousel(), CarouselNext(), useCarousel()

### Community 9 - "Community 9"
Cohesion: 0.24
Nodes (11): generateSessionId(), getOrCreateSessionId(), getSessionId(), resetSessionId(), setSessionId(), createCart(), deleteCart(), fetchCart() (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (4): CommandGroup(), CommandItem(), Popover(), PopoverTrigger()

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (5): SelectContent(), SelectGroup(), SelectItem(), SelectTrigger(), SelectValue()

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (3): SpecificationsTable(), Table(), TableBody()

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (3): ReviewForm(), StarRatingInput(), Dialog()

### Community 29 - "Community 29"
Cohesion: 0.67
Nodes (3): File Icon, Globe Icon, Window Icon

## Knowledge Gaps
- **35 isolated node(s):** `PostgreSQL 17`, `MinIO S3 Storage`, `Dokploy VPS`, `Tailwind CSS 4`, `shadcn/ui` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 11` to `Community 0`, `Community 2`, `Community 4`, `Community 5`, `Community 8`, `Community 10`, `Community 12`, `Community 13`, `Community 14`, `Community 15`, `Community 17`, `Community 18`, `Community 19`, `Community 20`, `Community 27`, `Community 28`?**
  _High betweenness centrality (0.253) - this node is a cross-community bridge._
- **Why does `formatPrice()` connect `Community 0` to `Community 1`, `Community 4`, `Community 5`, `Community 7`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `strapiFetch()` connect `Community 1` to `Community 0`, `Community 9`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `strapiFetch()` (e.g. with `getProducts()` and `getProductBySlug()`) actually correct?**
  _`strapiFetch()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `useAuth()` (e.g. with `LoginPage()` and `LogoutButton()`) actually correct?**
  _`useAuth()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PostgreSQL 17`, `MinIO S3 Storage`, `Dokploy VPS` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._