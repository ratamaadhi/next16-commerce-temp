# Graph Report - .  (2026-06-06)

## Corpus Check
- 96 files · ~45,730 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 250 nodes · 293 edges · 17 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_UI Components Library|UI Components Library]]
- [[_COMMUNITY_Auth & Cart State|Auth & Cart State]]
- [[_COMMUNITY_Project Architecture|Project Architecture]]
- [[_COMMUNITY_Cart Drawer UI|Cart Drawer UI]]
- [[_COMMUNITY_Product Display|Product Display]]
- [[_COMMUNITY_Product Fetching|Product Fetching]]
- [[_COMMUNITY_Sort Select|Sort Select]]
- [[_COMMUNITY_Cart Sync Logic|Cart Sync Logic]]
- [[_COMMUNITY_Strapi CMS Integration|Strapi CMS Integration]]
- [[_COMMUNITY_Cart Session Management|Cart Session Management]]
- [[_COMMUNITY_Loading Skeletons|Loading Skeletons]]
- [[_COMMUNITY_Specs Table|Specs Table]]
- [[_COMMUNITY_Layout & Providers|Layout & Providers]]
- [[_COMMUNITY_Carousel Component|Carousel Component]]
- [[_COMMUNITY_Fallback Pages|Fallback Pages]]
- [[_COMMUNITY_App Icons|App Icons]]
- [[_COMMUNITY_Brand Assets|Brand Assets]]

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
- `CheckoutPage()` --calls--> `useAuth()`  [INFERRED]
  app/checkout/page.tsx → hooks/use-auth.ts
- `Next.js 16` --conceptually_related_to--> `create-next-app`  [INFERRED]
  docs/strapi5-next16-integration.md → README.md
- `ProductsPage()` --calls--> `getProducts()`  [INFERRED]
  app/products/page.tsx → lib/products.ts
- `generateMetadata()` --calls--> `getProductBySlug()`  [INFERRED]
  app/products/[slug]/page.tsx → lib/products.ts

## Communities (41 total, 6 thin omitted)

### Community 1 - "Auth & Cart State"
Cohesion: 0.11
Nodes (6): LogoutButton(), CartSync(), CheckoutPage(), useAuth(), useCartSync(), Input()

### Community 2 - "Project Architecture"
Cohesion: 0.1
Nodes (22): Next.js App Router, Auth Route Handlers, LLM Coding Behavioral Guidelines, create-next-app, Docker Standalone Container, Dokploy VPS, Geist Font, Graphify Knowledge Graph Workflow (+14 more)

### Community 3 - "Cart Drawer UI"
Cohesion: 0.11
Nodes (5): DropdownMenu(), DropdownMenuTrigger(), Sheet(), SheetTitle(), SheetTrigger()

### Community 4 - "Product Display"
Cohesion: 0.18
Nodes (6): formatDate(), formatPrice(), getStrapiMedia(), ProductImage(), VariantSelector(), Badge()

### Community 5 - "Product Fetching"
Cohesion: 0.15
Nodes (10): AddToCartButton(), getFeaturedProducts(), getProductBySlug(), getProducts(), strapiFetch(), CategoryFilter(), ProductsPage(), ProductGrid() (+2 more)

### Community 6 - "Sort Select"
Cohesion: 0.21
Nodes (5): SortSelect(), SelectContent(), SelectItem(), SelectTrigger(), SelectValue()

### Community 7 - "Cart Sync Logic"
Cohesion: 0.32
Nodes (7): createCart(), deleteCart(), fetchCart(), mapItems(), resolveCartItems(), updateCart(), StrapiError

### Community 8 - "Strapi CMS Integration"
Cohesion: 0.2
Nodes (10): Cart Content Type, Category Content Type, MinIO S3 Storage, openapi-typescript Code Generation, Order Content Type, PostgreSQL 17, Product Content Type, Review Content Type (+2 more)

### Community 9 - "Cart Session Management"
Cohesion: 0.57
Nodes (5): generateSessionId(), getOrCreateSessionId(), getSessionId(), resetSessionId(), setSessionId()

### Community 12 - "Specs Table"
Cohesion: 0.33
Nodes (3): SpecificationsTable(), Table(), TableBody()

### Community 18 - "App Icons"
Cohesion: 0.67
Nodes (3): File Icon, Globe Icon, Window Icon

## Knowledge Gaps
- **27 isolated node(s):** `PostgreSQL 17`, `MinIO S3 Storage`, `Dokploy VPS`, `Tailwind CSS 4`, `shadcn/ui` (+22 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Components Library` to `Auth & Cart State`, `Cart Drawer UI`, `Product Display`, `Sort Select`, `Loading Skeletons`, `Navigation Menu`, `Specs Table`, `Dialog Overlay`, `Carousel Component`?**
  _High betweenness centrality (0.286) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Auth & Cart State` to `Cart Drawer UI`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `formatPrice()` connect `Product Display` to `Auth & Cart State`, `Cart Drawer UI`, `Product Fetching`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `CheckoutPage()` and `LogoutButton()`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PostgreSQL 17`, `MinIO S3 Storage`, `Dokploy VPS` to the rest of the system?**
  _27 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components Library` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Auth & Cart State` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._