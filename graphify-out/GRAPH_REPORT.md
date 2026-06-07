# Graph Report - next-commerce-temp  (2026-06-07)

## Corpus Check
- 96 files · ~56,133 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 310 nodes · 377 edges · 18 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1040f899`
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
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 41|Community 41]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 26 edges
2. `formatPrice()` - 13 edges
3. `Next.js 16` - 12 edges
4. `useAuth()` - 10 edges
5. `Strapi v5 CMS` - 10 edges
6. `Badge()` - 9 edges
7. `strapiFetch()` - 9 edges
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
- `CheckoutPage()` --calls--> `useAuth()`  [INFERRED]
  app/checkout/page.tsx → hooks/use-auth.ts

## Hyperedges (group relationships)
- **Checkout shipping cost flow** — checkout_CheckoutPage, checkout_SubdistrictSearch, checkout_ShippingOptions, checkout_OrderSummary, checkout_searchDistrictRoute, checkout_shippingCostRoute, shipping_KiriminAjaAPI, shipping_getDimensionsByWeight, shipping_ShippingOption, shipping_SubdistrictResult [INFERRED 0.85]
- **Weight data flow from product to shipping** — products_ProductData, products_ProductActions, cart_AddToCartButton, cart_CartItem, cart_useCartStore, checkout_CheckoutPage, shipping_getDimensionsByWeight [INFERRED 0.80]
- **BFF proxy layer for KiriminAja** — checkout_searchDistrictRoute, checkout_shippingCostRoute, shipping_KiriminAjaAPI, shipping_BFFPattern [INFERRED 0.85]
- **Cart sync architecture (Zustand + Strapi)** — cart_CartSyncComponent, cart_useCartSync, cart_useCartStore, cart_cartSyncLib, shipping_ZustandPersist [INFERRED 0.80]

## Communities (42 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (5): cn(), ProductDetailSkeleton(), RadioGroup(), RadioGroupItem(), Skeleton()

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (9): LogoutButton(), CartSync(), CheckoutPage(), useAuth(), useCartSync(), getCartDimensions(), getDimensionsByWeight(), getItemDimensions() (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (26): AddToCartButton component, CartItem type, CartSync component, Cart sync API client library, useCartStore zustand store, useCartSync hook, CheckoutPage component, OrderSummary component (+18 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (13): AddToCartButton(), getCategories(), getCategoryBySlug(), getFeaturedProducts(), getProductBySlug(), getProducts(), strapiFetch(), CategoryFilter() (+5 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (7): formatDate(), formatPrice(), getStrapiMedia(), StrapiError, ProductImage(), VariantSelector(), Badge()

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (22): Next.js App Router, Auth Route Handlers, LLM Coding Behavioral Guidelines, create-next-app, Docker Standalone Container, Dokploy VPS, Geist Font, Graphify Knowledge Graph Workflow (+14 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (5): DropdownMenu(), DropdownMenuTrigger(), Sheet(), SheetTitle(), SheetTrigger()

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (5): CommandGroup(), CommandItem(), Dialog(), Popover(), PopoverTrigger()

### Community 8 - "Community 8"
Cohesion: 0.24
Nodes (11): generateSessionId(), getOrCreateSessionId(), getSessionId(), resetSessionId(), setSessionId(), createCart(), deleteCart(), fetchCart() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.24
Nodes (4): SelectContent(), SelectItem(), SelectTrigger(), SelectValue()

### Community 10 - "Community 10"
Cohesion: 0.2
Nodes (10): Cart Content Type, Category Content Type, MinIO S3 Storage, openapi-typescript Code Generation, Order Content Type, PostgreSQL 17, Product Content Type, Review Content Type (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (3): SpecificationsTable(), Table(), TableBody()

### Community 17 - "Community 17"
Cohesion: 0.67
Nodes (3): File Icon, Globe Icon, Window Icon

## Knowledge Gaps
- **35 isolated node(s):** `PostgreSQL 17`, `MinIO S3 Storage`, `Dokploy VPS`, `Tailwind CSS 4`, `shadcn/ui` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 0` to `Community 1`, `Community 4`, `Community 6`, `Community 7`, `Community 9`, `Community 11`, `Community 12`, `Community 14`?**
  _High betweenness centrality (0.258) - this node is a cross-community bridge._
- **Why does `formatPrice()` connect `Community 4` to `Community 0`, `Community 1`, `Community 3`, `Community 6`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 1` to `Community 6`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `LogoutButton()` and `CartSync()`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PostgreSQL 17`, `MinIO S3 Storage`, `Dokploy VPS` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._