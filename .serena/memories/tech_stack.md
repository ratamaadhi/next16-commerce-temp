# Tech Stack
- Next.js 16.2.6, React 19.2.4, TypeScript 5.
- App Router project; `next/navigation` is used for client navigation.
- Tailwind CSS 4, shadcn/ui, lucide-react, sonner, Zustand.
- Strapi API contract is generated into `types/strapi.d.ts` via `openapi-typescript`.
- Checkout/order flow uses Strapi route handlers under `app/api/orders/*` and client order pages under `app/checkout` and `app/orders`.
- `package.json` scripts: `dev`, `build`, `start`, `lint`, `test`, `test:watch`, `generate-types`.