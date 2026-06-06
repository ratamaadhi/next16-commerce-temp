# Graph Report - .  (2026-06-06)

## Corpus Check
- 108 files · ~53,306 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 305 nodes · 351 edges · 21 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_UI Component Library|UI Component Library]]
- [[_COMMUNITY_App Pages|App Pages]]
- [[_COMMUNITY_Cart & Add To Cart|Cart & Add To Cart]]
- [[_COMMUNITY_Project Setup & Config|Project Setup & Config]]
- [[_COMMUNITY_Cart Drawer State|Cart Drawer State]]
- [[_COMMUNITY_Product Pages|Product Pages]]
- [[_COMMUNITY_Checkout & Pricing|Checkout & Pricing]]
- [[_COMMUNITY_Subdistrict Search|Subdistrict Search]]
- [[_COMMUNITY_Cart Sync Service|Cart Sync Service]]
- [[_COMMUNITY_Sort & Select|Sort & Select]]
- [[_COMMUNITY_Strapi CMS Models|Strapi CMS Models]]
- [[_COMMUNITY_Session Management|Session Management]]
- [[_COMMUNITY_Loading Skeletons|Loading Skeletons]]
- [[_COMMUNITY_Specifications Table|Specifications Table]]
- [[_COMMUNITY_App Layout Shell|App Layout Shell]]
- [[_COMMUNITY_Shipping Options|Shipping Options]]
- [[_COMMUNITY_Carousel|Carousel]]
- [[_COMMUNITY_Error & Category Pages|Error & Category Pages]]
- [[_COMMUNITY_SVG Icons|SVG Icons]]
- [[_COMMUNITY_Logo Assets|Logo Assets]]
- [[_COMMUNITY_Free Shipping Policy|Free Shipping Policy]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 20 edges
2. `formatPrice()` - 12 edges
3. `Next.js 16` - 12 edges
4. `useAuth()` - 10 edges
5. `Strapi v5 CMS` - 10 edges
6. `next-commerce-temp Project` - 9 edges
7. `Badge()` - 8 edges
8. `ProductImage()` - 7 edges
9. `Input()` - 6 edges
10. `getOrCreateSessionId()` - 6 edges

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

## Communities (47 total, 8 thin omitted)

### Community 1 - "App Pages"
Cohesion: 0.1
Nodes (7): LogoutButton(), CartSync(), CheckoutPage(), useAuth(), useCartSync(), getDimensionsByWeight(), Input()

### Community 2 - "Cart & Add To Cart"
Cohesion: 0.1
Nodes (26): AddToCartButton component, CartItem type, CartSync component, Cart sync API client library, useCartStore zustand store, useCartSync hook, CheckoutPage component, OrderSummary component (+18 more)

### Community 3 - "Project Setup & Config"
Cohesion: 0.1
Nodes (22): Next.js App Router, Auth Route Handlers, LLM Coding Behavioral Guidelines, create-next-app, Docker Standalone Container, Dokploy VPS, Geist Font, Graphify Knowledge Graph Workflow (+14 more)

### Community 4 - "Cart Drawer State"
Cohesion: 0.11
Nodes (5): DropdownMenu(), DropdownMenuTrigger(), Sheet(), SheetTitle(), SheetTrigger()

### Community 5 - "Product Pages"
Cohesion: 0.14
Nodes (11): AddToCartButton(), getFeaturedProducts(), getProductBySlug(), getProducts(), strapiFetch(), CategoryFilter(), ProductsPage(), ProductGrid() (+3 more)

### Community 6 - "Checkout & Pricing"
Cohesion: 0.18
Nodes (6): formatDate(), formatPrice(), getStrapiMedia(), ProductImage(), VariantSelector(), Badge()

### Community 7 - "Subdistrict Search"
Cohesion: 0.18
Nodes (4): CommandGroup(), CommandItem(), Popover(), PopoverTrigger()

### Community 8 - "Cart Sync Service"
Cohesion: 0.32
Nodes (7): createCart(), deleteCart(), fetchCart(), mapItems(), resolveCartItems(), updateCart(), StrapiError

### Community 9 - "Sort & Select"
Cohesion: 0.24
Nodes (4): SelectContent(), SelectItem(), SelectTrigger(), SelectValue()

### Community 10 - "Strapi CMS Models"
Cohesion: 0.2
Nodes (10): Cart Content Type, Category Content Type, MinIO S3 Storage, openapi-typescript Code Generation, Order Content Type, PostgreSQL 17, Product Content Type, Review Content Type (+2 more)

### Community 11 - "Session Management"
Cohesion: 0.57
Nodes (5): generateSessionId(), getOrCreateSessionId(), getSessionId(), resetSessionId(), setSessionId()

### Community 14 - "Specifications Table"
Cohesion: 0.33
Nodes (3): SpecificationsTable(), Table(), TableBody()

### Community 20 - "SVG Icons"
Cohesion: 0.67
Nodes (3): File Icon, Globe Icon, Window Icon

## Knowledge Gaps
- **35 isolated node(s):** `PostgreSQL 17`, `MinIO S3 Storage`, `Dokploy VPS`, `Tailwind CSS 4`, `shadcn/ui` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Component Library` to `App Pages`, `Cart Drawer State`, `Checkout & Pricing`, `Sort & Select`, `Loading Skeletons`, `Navigation Menu`, `Specifications Table`, `Carousel`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `App Pages` to `Cart Drawer State`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `formatPrice()` connect `Checkout & Pricing` to `App Pages`, `Cart Drawer State`, `Product Pages`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `CheckoutPage()` and `LogoutButton()`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PostgreSQL 17`, `MinIO S3 Storage`, `Dokploy VPS` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Component Library` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `App Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._