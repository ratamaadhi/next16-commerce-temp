# Graph Report - .  (2026-06-03)

## Corpus Check
- Corpus is ~36,595 words - fits in a single context window. You may not need a graph.

## Summary
- 210 nodes · 221 edges · 15 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_UI Component Library|UI Component Library]]
- [[_COMMUNITY_Project Architecture & Auth|Project Architecture & Auth]]
- [[_COMMUNITY_Product Display & Formatting|Product Display & Formatting]]
- [[_COMMUNITY_Data Fetching & Routing|Data Fetching & Routing]]
- [[_COMMUNITY_Auth Forms & Input|Auth Forms & Input]]
- [[_COMMUNITY_Select & Sort Controls|Select & Sort Controls]]
- [[_COMMUNITY_Cart Drawer & Header|Cart Drawer & Header]]
- [[_COMMUNITY_Strapi CMS Integration|Strapi CMS Integration]]
- [[_COMMUNITY_Specifications Table|Specifications Table]]
- [[_COMMUNITY_Loading Skeletons|Loading Skeletons]]
- [[_COMMUNITY_App Layout & Providers|App Layout & Providers]]
- [[_COMMUNITY_Carousel Component|Carousel Component]]
- [[_COMMUNITY_Not Found & Category Pages|Not Found & Category Pages]]
- [[_COMMUNITY_UI Icons|UI Icons]]
- [[_COMMUNITY_Brand Logos|Brand Logos]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 20 edges
2. `Next.js 16` - 12 edges
3. `formatPrice()` - 10 edges
4. `Strapi v5 CMS` - 10 edges
5. `next-commerce-temp Project` - 9 edges
6. `Input()` - 6 edges
7. `ProductImage()` - 6 edges
8. `Badge()` - 5 edges
9. `useAuth()` - 5 edges
10. `strapiFetch()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Next.js Breaking Changes Awareness` --semantically_similar_to--> `middleware.ts to proxy.ts Migration`  [INFERRED] [semantically similar]
  AGENTS.md → docs/strapi5-next16-integration.md
- `create-next-app` --conceptually_related_to--> `Next.js 16`  [INFERRED]
  README.md → docs/strapi5-next16-integration.md
- `ProductsPage()` --calls--> `getProducts()`  [INFERRED]
  app/products/page.tsx → lib/products.ts
- `generateMetadata()` --calls--> `getProductBySlug()`  [INFERRED]
  app/products/[slug]/page.tsx → lib/products.ts
- `ProductImage()` --calls--> `getStrapiMedia()`  [INFERRED]
  components/products/product-image.tsx → lib/strapi.ts

## Hyperedges (group relationships)
- **E-Commerce Architecture Stack** — nextjs_16, strapi_v5, postgresql_17, minio_s3, dokploy_vps, docker_standalone [EXTRACTED 1.00]
- **Hybrid Data Handling Layer** — server_components, tanstack_react_query, zustand_cart_store, http_only_cookie_auth, auth_route_handlers, strip_api_client [INFERRED 0.85]
- **Development Workflow Toolchain** — create_next_app, pnpm_workspace, shadcn_ui, tailwind_css_4, openapi_typescript_gen [EXTRACTED 1.00]
- **Next.js App Static Assets** — public_file_icon, public_vercel_logo, public_nextjs_logo, public_globe_icon, public_window_icon [INFERRED 0.85]

## Communities (37 total, 7 thin omitted)

### Community 1 - "Project Architecture & Auth"
Cohesion: 0.1
Nodes (22): Next.js App Router, Auth Route Handlers, LLM Coding Behavioral Guidelines, create-next-app, Docker Standalone Container, Dokploy VPS, Geist Font, Graphify Knowledge Graph Workflow (+14 more)

### Community 2 - "Product Display & Formatting"
Cohesion: 0.15
Nodes (6): formatDate(), formatPrice(), getStrapiMedia(), StrapiError, ProductImage(), Badge()

### Community 3 - "Data Fetching & Routing"
Cohesion: 0.14
Nodes (11): AddToCartButton(), getFeaturedProducts(), getProductBySlug(), getProducts(), strapiFetch(), CategoryFilter(), ProductsPage(), ProductGrid() (+3 more)

### Community 5 - "Select & Sort Controls"
Cohesion: 0.24
Nodes (4): SelectContent(), SelectItem(), SelectTrigger(), SelectValue()

### Community 6 - "Cart Drawer & Header"
Cohesion: 0.24
Nodes (3): Sheet(), SheetTitle(), SheetTrigger()

### Community 7 - "Strapi CMS Integration"
Cohesion: 0.2
Nodes (10): Cart Content Type, Category Content Type, MinIO S3 Storage, openapi-typescript Code Generation, Order Content Type, PostgreSQL 17, Product Content Type, Review Content Type (+2 more)

### Community 8 - "Specifications Table"
Cohesion: 0.33
Nodes (3): SpecificationsTable(), Table(), TableBody()

### Community 16 - "UI Icons"
Cohesion: 0.67
Nodes (3): File Icon, Globe Icon, Window Icon

## Knowledge Gaps
- **27 isolated node(s):** `PostgreSQL 17`, `MinIO S3 Storage`, `Dokploy VPS`, `Tailwind CSS 4`, `shadcn/ui` (+22 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Component Library` to `Product Display & Formatting`, `Auth Forms & Input`, `Select & Sort Controls`, `Cart Drawer & Header`, `Specifications Table`, `Loading Skeletons`, `Dialog Component`, `Dropdown Menu Component`, `Accordion Component`, `Carousel Component`?**
  _High betweenness centrality (0.304) - this node is a cross-community bridge._
- **Why does `formatPrice()` connect `Product Display & Formatting` to `Data Fetching & Routing`, `Auth Forms & Input`, `Cart Drawer & Header`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `Input()` connect `Auth Forms & Input` to `Cart Drawer & Header`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **What connects `PostgreSQL 17`, `MinIO S3 Storage`, `Dokploy VPS` to the rest of the system?**
  _27 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Component Library` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Project Architecture & Auth` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Data Fetching & Routing` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._