# Graph Report - .  (2026-07-28)

## Corpus Check
- 6 files · ~99,999 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 557 nodes · 733 edges · 31 communities detected
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Checkout API Routes|Checkout API Routes]]
- [[_COMMUNITY_Account & Cart Components|Account & Cart Components]]
- [[_COMMUNITY_Docs & Next.js Setup|Docs & Next.js Setup]]
- [[_COMMUNITY_Cart State Management|Cart State Management]]
- [[_COMMUNITY_Reviews UI Components|Reviews UI Components]]
- [[_COMMUNITY_Address Formatting|Address Formatting]]
- [[_COMMUNITY_Address Forms & Manual Payment|Address Forms & Manual Payment]]
- [[_COMMUNITY_Voucher & Pricing UI|Voucher & Pricing UI]]
- [[_COMMUNITY_Cart Session Logic|Cart Session Logic]]
- [[_COMMUNITY_Animation & Skeletons|Animation & Skeletons]]
- [[_COMMUNITY_Account Tabs & Payment Selector|Account Tabs & Payment Selector]]
- [[_COMMUNITY_Product Actions & Buttons|Product Actions & Buttons]]
- [[_COMMUNITY_Reviews & UI Primitives|Reviews & UI Primitives]]
- [[_COMMUNITY_Loading Skeletons|Loading Skeletons]]
- [[_COMMUNITY_Analytics Dashboard|Analytics Dashboard]]
- [[_COMMUNITY_UI Select Components|UI Select Components]]
- [[_COMMUNITY_Form UI Primitives|Form UI Primitives]]
- [[_COMMUNITY_Payment Snap Integration|Payment Snap Integration]]
- [[_COMMUNITY_Navigation Menu|Navigation Menu]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 82|Community 82]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 41 edges
2. `strapiFetch()` - 18 edges
3. `formatPrice()` - 18 edges
4. `useAuth()` - 17 edges
5. `Badge()` - 15 edges
6. `Next.js 16` - 12 edges
7. `Input()` - 11 edges
8. `Strapi v5 CMS` - 10 edges
9. `getStrapiMedia()` - 9 edges
10. `WishlistButton()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `useAuth()` --calls--> `CheckoutPage()`  [INFERRED]
  hooks/use-auth.ts → app/checkout/page.tsx
- `Next.js Breaking Changes Awareness` --semantically_similar_to--> `middleware.ts to proxy.ts Migration`  [INFERRED] [semantically similar]
  AGENTS.md → docs/strapi5-next16-integration.md
- `Search district API route` --implements--> `BFF proxy pattern for API credentials`  [INFERRED]
  app/api/shipping/search-district/route.ts → docs/superpowers/specs/2026-06-06-shipping-cost-check-design.md
- `Shipping cost API route` --implements--> `BFF proxy pattern for API credentials`  [INFERRED]
  app/api/shipping/cost/route.ts → docs/superpowers/specs/2026-06-06-shipping-cost-check-design.md
- `TAX_RATE 11% constant` --references--> `Shipping Cost Check design spec`  [EXTRACTED]
  app/checkout/page.tsx → docs/superpowers/specs/2026-06-06-shipping-cost-check-design.md

## Hyperedges (group relationships)
- **Checkout shipping cost flow** — checkout_CheckoutPage, checkout_SubdistrictSearch, checkout_ShippingOptions, checkout_OrderSummary, checkout_searchDistrictRoute, checkout_shippingCostRoute, shipping_KiriminAjaAPI, shipping_getDimensionsByWeight, shipping_ShippingOption, shipping_SubdistrictResult [INFERRED 0.85]
- **Weight data flow from product to shipping** — products_ProductData, products_ProductActions, cart_AddToCartButton, cart_CartItem, cart_useCartStore, checkout_CheckoutPage, shipping_getDimensionsByWeight [INFERRED 0.80]
- **BFF proxy layer for KiriminAja** — checkout_searchDistrictRoute, checkout_shippingCostRoute, shipping_KiriminAjaAPI, shipping_BFFPattern [INFERRED 0.85]
- **Cart sync architecture (Zustand + Strapi)** — cart_CartSyncComponent, cart_useCartSync, cart_useCartStore, cart_cartSyncLib, shipping_ZustandPersist [INFERRED 0.80]

## Communities (83 total, 13 thin omitted)

### Community 0 - "Checkout API Routes"
Cohesion: 0.08
Nodes (22): POST(), CategoriesPage(), getCategories(), getCategoryBySlug(), checkInventory(), createOrder(), getOrderByNumber(), getOrders() (+14 more)

### Community 1 - "Account & Cart Components"
Cohesion: 0.06
Nodes (13): AddressCard(), handleSubmit(), handleSubmit(), createAddress(), updateAddress(), useAddresses(), DropdownMenu(), DropdownMenuTrigger() (+5 more)

### Community 2 - "Docs & Next.js Setup"
Cohesion: 0.1
Nodes (14): LogoutButton(), CartSync(), useAuth(), useCartSync(), useAddToWishlist(), useIsInWishlist(), useRemoveFromWishlist(), useWishlist() (+6 more)

### Community 3 - "Cart State Management"
Cohesion: 0.07
Nodes (32): Next.js App Router, Auth Route Handlers, Cart Content Type, Category Content Type, LLM Coding Behavioral Guidelines, create-next-app, Docker Standalone Container, Dokploy VPS (+24 more)

### Community 4 - "Reviews UI Components"
Cohesion: 0.1
Nodes (26): AddToCartButton component, CartItem type, CartSync component, Cart sync API client library, useCartStore zustand store, useCartSync hook, CheckoutPage component, OrderSummary component (+18 more)

### Community 5 - "Address Formatting"
Cohesion: 0.09
Nodes (7): ReviewForm(), StarRatingInput(), CommandGroup(), CommandItem(), Dialog(), Popover(), PopoverTrigger()

### Community 6 - "Address Forms & Manual Payment"
Cohesion: 0.09
Nodes (7): AddressForm(), SearchBar(), buildSearch(), fetchConversion(), isConversionResponse(), DashboardFilters(), Input()

### Community 7 - "Voucher & Pricing UI"
Cohesion: 0.12
Nodes (9): CheckoutPage(), usePaymentMethods(), mapProofUploadError(), resolveInitialMethod(), validateProofFile(), getCartDimensions(), getDimensionsByWeight(), getItemDimensions() (+1 more)

### Community 8 - "Cart Session Logic"
Cohesion: 0.15
Nodes (7): VoucherInput(), formatDate(), formatPrice(), getStatusBadgeClass(), getTimelineSteps(), OrderCard(), Badge()

### Community 9 - "Animation & Skeletons"
Cohesion: 0.21
Nodes (12): generateSessionId(), getOrCreateSessionId(), getSessionId(), resetSessionId(), setSessionId(), createCart(), deleteCart(), fetchCart() (+4 more)

### Community 10 - "Account Tabs & Payment Selector"
Cohesion: 0.12
Nodes (7): motionAllowed(), FadeInSection(), WhyCyraSection(), ProductGrid(), Carousel(), CarouselNext(), useCarousel()

### Community 11 - "Product Actions & Buttons"
Cohesion: 0.19
Nodes (7): AccountTabs(), RadioGroup(), RadioGroupItem(), Tabs(), TabsContent(), TabsList(), TabsTrigger()

### Community 12 - "Reviews & UI Primitives"
Cohesion: 0.15
Nodes (3): AddToCartButton(), ProductConditionBadge(), VariantSelector()

### Community 13 - "Loading Skeletons"
Cohesion: 0.17
Nodes (8): getProductBySlug(), ProductImages(), SpecificationsTable(), ReviewSection(), generateMetadata(), Table(), TableBody(), TableHeader()

### Community 14 - "Analytics Dashboard"
Cohesion: 0.14
Nodes (3): OrderListSkeleton(), ProductDetailSkeleton(), Skeleton()

### Community 15 - "UI Select Components"
Cohesion: 0.36
Nodes (9): GET(), DashboardLayout(), defaultRange(), getConversion(), getStaffUser(), isStaff(), mapConversion(), parseConversionQuery() (+1 more)

### Community 16 - "Form UI Primitives"
Cohesion: 0.25
Nodes (5): SelectContent(), SelectGroup(), SelectItem(), SelectTrigger(), SelectValue()

### Community 36 - "Community 36"
Cohesion: 0.67
Nodes (3): File Icon, Globe Icon, Window Icon

## Knowledge Gaps
- **35 isolated node(s):** `PostgreSQL 17`, `MinIO S3 Storage`, `Dokploy VPS`, `Tailwind CSS 4`, `shadcn/ui` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Payment Snap Integration` to `Account & Cart Components`, `Docs & Next.js Setup`, `Address Formatting`, `Address Forms & Manual Payment`, `Cart Session Logic`, `Account Tabs & Payment Selector`, `Product Actions & Buttons`, `Reviews & UI Primitives`, `Loading Skeletons`, `Analytics Dashboard`, `Form UI Primitives`, `Navigation Menu`, `Strapi Types`, `Community 20`, `Community 22`, `Community 23`, `Community 32`, `Community 33`, `Community 34`, `Community 35`?**
  _High betweenness centrality (0.237) - this node is a cross-community bridge._
- **Why does `formatPrice()` connect `Cart Session Logic` to `Account & Cart Components`, `Docs & Next.js Setup`, `Voucher & Pricing UI`, `Product Actions & Buttons`, `Reviews & UI Primitives`, `Loading Skeletons`, `Community 20`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `strapiFetch()` connect `Checkout API Routes` to `Cart Session Logic`, `Animation & Skeletons`, `Loading Skeletons`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `strapiFetch()` (e.g. with `getProducts()` and `getProductBySlug()`) actually correct?**
  _`strapiFetch()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `useAuth()` (e.g. with `LoginPage()` and `LogoutButton()`) actually correct?**
  _`useAuth()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PostgreSQL 17`, `MinIO S3 Storage`, `Dokploy VPS` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Checkout API Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._