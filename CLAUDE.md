# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js Version Warning

This project runs **Next.js 16.2.4** with **React 19**. APIs and conventions differ significantly from training data. Before writing frontend code, check `frontend/node_modules/next/dist/docs/`. The `frontend/AGENTS.md` file repeats this warning.

---

## Commands

### Root (runs both apps concurrently)
```bash
npm run dev           # start frontend + backend together
npm run build:frontend
npm run build:backend
```

### Frontend (`cd frontend` or `--workspace=frontend`)
```bash
npm run dev           # next dev  (default port 3003)
npm run build         # next build (NODE_OPTIONS= clears memory limits)
npm run lint          # eslint
```

### Backend (`cd backend` or `--workspace=backend`)
```bash
npm run dev           # nest start --watch  (port 4000)
npm run build         # nest build
npm run lint          # eslint with --fix
npm test              # jest (unit tests in src/**/*.spec.ts)
npm run test:watch
npm run test:e2e

# Prisma
npm run prisma:migrate    # prisma migrate dev
npm run prisma:generate   # regenerate client after schema changes
npm run prisma:seed       # ts-node prisma/seed.ts
npm run prisma:studio     # visual DB browser
```

---

## Architecture

### Monorepo layout
```
smartline/
  frontend/   Next.js 16 (App Router) — store UI + admin panel
  backend/    NestJS 11 (Fastify) — REST API at :4000/api
```

**Strict rule**: the frontend NEVER touches Prisma or the database directly. All data flows through the NestJS REST API. Webhooks (Monobank, Nova Poshta) are handled only in NestJS.

---

### Frontend (`frontend/`)

**Route groups:**
- `app/(store)/` — public storefront (Header + Footer + store layout)
- `app/admin/` — admin panel (separate layout, hardcoded light-theme Tailwind classes — do not apply dark tokens here)
- `app/layout.tsx` — root layout; loads Google Fonts via `<link>` tags in `<head>`

**Key patterns:**
- Server Components by default. Pages without `'use client'` are Server Components — they **cannot** use `onMouseEnter`/`onMouseLeave` on `<Link>` or `<a>` tags (Next.js 16 build error). Use CSS utility classes from `globals.css` instead (`.sl-hover-accent`, `.sl-hover-btn-primary`, `.sl-hover-card`, `.sl-hover-border`, `.sl-hover-text-primary`, `.sl-hover-ghost`, `.sl-hover-btn-secondary`).
- All data fetching uses `frontend/lib/api.ts` → `apiFetch` wrapper with `credentials: 'include'` for cookie-based auth.
- `NEXT_PUBLIC_API_URL` defaults to `http://localhost:4000/api`.

**State management:**
- Cart: `frontend/store/cart.ts` — Zustand store persisted to `localStorage` under key `smartline-cart`. Guest cart lives here; on login, call `POST /cart/merge` to sync to DB.
- No global auth state in Zustand — auth is driven by httpOnly cookies read server-side.

**Timer refs in Client Components:** always type as `useRef<number | null>(null)` — `@types/node` is installed, so `ReturnType<typeof setTimeout>` resolves to `NodeJS.Timeout`, which breaks browser code.

**Tailwind:** v4 with `@theme inline` in `globals.css`. No `tailwind.config.ts`. All color/font tokens are CSS variables; utility classes use `bg-[var(--sl-bg-surface)]` syntax.

**Design tokens** (store only, prefixed `--sl-`):
| Token | Value |
|---|---|
| `--sl-bg-primary` | `#0E0E0F` |
| `--sl-bg-surface` | `#161618` |
| `--sl-bg-elevated` | `#1E1E21` |
| `--sl-accent` | `#E8621A` |
| `--sl-accent-hover` | `#FF7A35` |
| `--sl-text-primary` | `#F0EDE8` |
| `--sl-text-secondary` | `#A09A92` |
| `--sl-text-muted` | `#5C5650` |
| `--sl-border` | `rgba(255,255,255,0.07)` |
| `--sl-border-hover` | `rgba(232,98,26,0.3)` |

Fonts loaded via `<link>`: `Bebas Neue` (display/headings), `DM Serif Display` (editorial), `DM Sans` (body), `JetBrains Mono` (mono). Referenced in CSS as `--sl-font-display`, `--sl-font-heading`, `--sl-font-sans`, `--sl-font-mono`.

**`lib/utils.ts`** exports price formatting (`formatPrice`), product price resolution (`getProductDisplayPrices`), slug generation (`toSlug`), order status labels/colors, and `cn()` for Tailwind class merging.

---

### Backend (`backend/`)

**NestJS modules:**

| Module | Responsibility |
|---|---|
| `AuthModule` | JWT (access 15min + refresh 30d) in httpOnly cookies; `POST /auth/login`, `/register`, `/refresh`, `/logout`, `/me`, `/forgot-password` |
| `ProductsModule` | CRUD, filtering/search, variants, attributes, images, cross-sells; `GET /products/admin` for admin list |
| `CategoriesModule` | Tree structure with `children`; `GET /categories/by-slug/:slug` |
| `OrdersModule` | Order lifecycle; `PATCH /orders/:id/status`; `GET /orders/stats` |
| `CartModule` | DB cart for authenticated users; `POST /cart/merge` for guest→auth sync |
| `UploadModule` | `POST /upload/image` — multer → sharp (WebP, quality 85) → Cloudflare R2 |
| `NovaPoshtaModule` | Proxy for Nova Poshta API (hides API key from frontend) |
| `PaymentModule` | Monobank invoiceCreate; `POST /payment/webhook` verifies HMAC |
| `TelegramModule` | Manager notifications on new orders / status changes |
| `MailModule` | Resend-based emails (order confirmation, password reset) |
| `ReviewsModule` | Public: approved only; Admin: `PATCH /reviews/:id/approve` |
| `PromotionsModule` | Date-range active check; discount percent applied client-side via `lib/utils.ts` |

**Auth flow:** `JwtStrategy` validates access token from `Authorization` header or cookie. `JwtRefreshStrategy` handles refresh. `RolesGuard` + `@Roles('ADMIN')` decorator protect admin endpoints.

**Global:** `ValidationPipe` with `whitelist: true`, `transform: true`. Rate limiting via `ThrottlerModule` (60 req/min). Global prefix `/api`.

**Prisma:** schema at `backend/prisma/schema.prisma`. After changing the schema run `npm run prisma:generate` (and `prisma:migrate` for DB changes). Key models: `User`, `Product`, `Variant`, `ProductOptionGroup`/`ProductOptionValue` (for variant selectors), `Order`, `CartItem`, `Review`, `Promotion`, `Banner`, `Category`.

---

### Environment variables

**Frontend** (`.env.local`):
- `NEXT_PUBLIC_API_URL` — backend base URL
- `NEXT_PUBLIC_GA_ID` — Google Analytics 4
- `NEXT_PUBLIC_META_PIXEL` — Meta Pixel ID

**Backend** (`.env`):
- `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`
- `NOVA_POSHTA_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `MONOBANK_TOKEN`, `MONOBANK_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `RESEND_FROM`
- `FRONTEND_URL` (comma-separated origins for CORS), `PORT` (default 4000)
