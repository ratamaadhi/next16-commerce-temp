# Graph Report - next-commerce-temp  (2026-06-04)

## Corpus Check
- 86 files · ~46,791 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 249 nodes · 288 edges · 16 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7431a39a`
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
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 27|Community 27]]

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
- `create-next-app` --conceptually_related_to--> `Next.js 16`  [INFERRED]
  README.md → docs/strapi5-next16-integration.md
- `ProductsPage()` --calls--> `getProducts()`  [INFERRED]
  app/products/page.tsx → lib/products.ts
- `generateMetadata()` --calls--> `getProductBySlug()`  [INFERRED]
  app/products/[slug]/page.tsx → lib/products.ts

## Hyperedges (group relationships)
- **E-Commerce Architecture Stack** — nextjs_16, strapi_v5, postgresql_17, minio_s3, dokploy_vps, docker_standalone [EXTRACTED 1.00]
- **Hybrid Data Handling Layer** — server_components, tanstack_react_query, zustand_cart_store, http_only_cookie_auth, auth_route_handlers, strip_api_client [INFERRED 0.85]
- **Development Workflow Toolchain** — create_next_app, pnpm_workspace, shadcn_ui, tailwind_css_4, openapi_typescript_gen [EXTRACTED 1.00]
- **Next.js App Static Assets** — public_file_icon, public_vercel_logo, public_nextjs_logo, public_globe_icon, public_window_icon [INFERRED 0.85]

## Communities (39 total, 5 thin omitted)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (8): LogoutButton(), CartSync(), CheckoutPage(), useAuth(), useCartSync(), Footer(), Providers(), Input()

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (22): Next.js App Router, Auth Route Handlers, LLM Coding Behavioral Guidelines, create-next-app, Docker Standalone Container, Dokploy VPS, Geist Font, Graphify Knowledge Graph Workflow (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (5): DropdownMenu(), DropdownMenuTrigger(), Sheet(), SheetTitle(), SheetTrigger()

### Community 4 - "Community 4"
Cohesion: 0.18
Nodes (6): formatDate(), formatPrice(), getStrapiMedia(), ProductImage(), VariantSelector(), Badge()

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (10): AddToCartButton(), getFeaturedProducts(), getProductBySlug(), getProducts(), strapiFetch(), CategoryFilter(), ProductsPage(), ProductGrid() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.21
Nodes (5): SortSelect(), SelectContent(), SelectItem(), SelectTrigger(), SelectValue()

### Community 7 - "Community 7"
Cohesion: 0.32
Nodes (7): createCart(), deleteCart(), fetchCart(), mapItems(), resolveCartItems(), updateCart(), StrapiError

### Community 8 - "Community 8"
Cohesion: 0.2
Nodes (10): Cart Content Type, Category Content Type, MinIO S3 Storage, openapi-typescript Code Generation, Order Content Type, PostgreSQL 17, Product Content Type, Review Content Type (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (3): SpecificationsTable(), Table(), TableBody()

### Community 11 - "Community 11"
Cohesion: 0.57
Nodes (4): generateSessionId(), getOrCreateSessionId(), getSessionId(), setSessionId()

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (3): File Icon, Globe Icon, Window Icon

## Knowledge Gaps
- **27 isolated node(s):** `PostgreSQL 17`, `MinIO S3 Storage`, `Dokploy VPS`, `Tailwind CSS 4`, `shadcn/ui` (+22 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 0` to `Community 1`, `Community 3`, `Community 4`, `Community 6`, `Community 9`, `Community 10`, `Community 12`, `Community 13`?**
  _High betweenness centrality (0.286) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 1` to `Community 3`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `formatPrice()` connect `Community 4` to `Community 1`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuth()` (e.g. with `CheckoutPage()` and `LogoutButton()`) actually correct?**
  _`useAuth()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PostgreSQL 17`, `MinIO S3 Storage`, `Dokploy VPS` to the rest of the system?**
  _27 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._