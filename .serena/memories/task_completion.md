# Task Completion
- Run `pnpm lint`.
- Run targeted tests when touching order/cart flows: `pnpm test` or a focused Vitest filter if needed.
- If Strapi contract changes, run `pnpm generate-types` and verify `types/strapi.d.ts` regenerates cleanly.
- For Next.js route/UI changes, inspect affected pages in `app/checkout` and `app/orders` for server/client data alignment.
- After memory setup, user can run `serena memories check` from repo root to validate references.