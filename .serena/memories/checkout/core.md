# Checkout Core
- Checkout page lives in `app/checkout/page.tsx` and is a client component.
- Flow: address selection/input -> subdistrict lookup -> shipping option selection -> order submit.
- Submit path posts to `/api/orders` with cart items, shipping/billing addresses, notes, subtotal, tax, shippingCost, totalAmount, currency.
- UI currently computes totals locally (`subtotal + tax + shipping`) for preview; order detail pages later show server-returned totals.
- Error surface is a toast from the API response `error.message`.
- Order summary UI lives in `components/checkout/order-summary.tsx`; shipping options in `components/checkout/shipping-options.tsx`; subdistrict search in `components/checkout/subdistrict-search.tsx`.