# Conventions
- Generated Strapi types in `types/strapi.d.ts` are auto-generated; do not edit by hand.
- Checkout total shown in UI may be computed locally, but order detail pages render server-returned `subtotal`, `tax`, `shippingCost`, `discount`, and `totalAmount`.
- Checkout submits through `/api/orders`; order detail actions use `/api/orders/[orderNumber]/*` helper routes.
- Error handling in checkout surfaces `error.message` from API responses via `sonner` toasts.
- Cart/order UI components are mostly client components and rely on store hooks plus route handlers for persistence.