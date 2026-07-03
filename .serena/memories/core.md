# Core
- Next.js 16 e-commerce frontend (`app/` router) with Strapi-backed APIs.
- Main user flows: product browsing, cart, checkout, orders, auth, wishlist.
- Server-side integration mostly via `app/api/*` route handlers that proxy to Strapi or other backend services.
- Key domain areas:
  - Checkout/order flow: `mem:checkout/core`
  - Strapi/contracts: `mem:tech_stack`
  - Code conventions and local patterns: `mem:conventions`
  - Commands and verification: `mem:suggested_commands`, `mem:task_completion`