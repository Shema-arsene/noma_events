# Noma Events

A mobile-first event discovery, ticketing and organizer-management platform for Gabon — built per the Noma Events MVP Implementation Specification.

Attendees discover events, buy digital tickets with unique QR codes, and manage their orders. Organizers create and publish events, configure ticket types, manage attendees, and view analytics. Event staff validate tickets at the door. Admins moderate the platform.

## Repository layout

This is **two fully independent projects** in one folder, not a monorepo — no shared workspace packages, no shared lockfile, no shared `node_modules`. Each has its own `package.json`, its own `.env`, and can be installed, run, tested, and deployed entirely on its own.

```
backend/     Express + MongoDB API (REST API at /api/v1) — deploy to Render
frontend/    Next.js web app — deploy to Vercel
```

`backend/src/types.ts` and `backend/src/validation.ts` (enums/DTOs and Zod request schemas) are duplicated verbatim in `frontend/src/types.ts` and `frontend/src/validation.ts` rather than imported from a shared package. **If you change a request/response shape in the backend, update both copies by hand** — there's no build step that keeps them in sync.

Inside `backend/src`:

```
config/        env validation, logger
common/        errors, response envelope, slugs, crypto, JWT helpers
database/      Mongo connection + seed script
middleware/    auth, validation, rate limiting, error handling
modules/       one folder per domain: auth, users, organizers, events, venues,
               categories, orders, payments, tickets, checkins, notifications,
               analytics, admin, audit, favorites, uploads
test/          test harness + fixtures
types.ts       enums + DTOs (duplicated in frontend/src/types.ts)
validation.ts  Zod request schemas (duplicated in frontend/src/validation.ts)
```

Each module follows `*.model.ts` (Mongoose schema) → `*.service.ts` (business logic) → `*.controller.ts` (HTTP) → `*.routes.ts`.

## Stack

- **Frontend**: Next.js 16 (App Router, Turbopack) + React 19 + TypeScript + Tailwind CSS v4 + React Hook Form + Zod + TanStack Query
- **Backend**: Node.js + Express 5 + TypeScript + MongoDB + Mongoose 9
- **Auth**: stateless Bearer JWTs (short-lived access token + rotating refresh token) sent via the `Authorization` header — no cookies, so there's no cross-site cookie configuration to get right when the frontend and backend are deployed to different origins. The frontend stores tokens in `localStorage` and refreshes transparently on a 401 (see `frontend/src/lib/api.ts` and `tokenStorage.ts`). Argon2id password hashing.
- **Payments**: Pluggable `PaymentProvider` interface with a credential-free `MockPaymentProvider` (Airtel Money / Moov Money adapters can be added later without touching business logic)
- **Tickets**: Cryptographically random QR tokens, hash-verified at scan time, atomic `ACTIVE → USED` transition
- **Local dev database**: an in-memory MongoDB starts automatically — **no Docker or local MongoDB install required**

## Getting started

Requires Node.js 20+. Install and run each side from its own directory, in two terminals:

```bash
cd backend
npm install
npm run dev          # http://localhost:4000 — health check at /health
```

```bash
cd frontend
npm install
npm run dev           # http://localhost:3000
```

On first boot, the backend automatically starts an in-memory MongoDB and seeds it with categories, Gabonese cities/venues, a handful of realistic events, and development accounts (see below). **Data is ephemeral** — it resets every time the backend process restarts. This is intentional for a zero-setup local dev experience; set `USE_IN_MEMORY_DB=false` and point `MONGODB_URI` at a real database for anything persistent.

#### Seeding a real database

If you're pointing at a real MongoDB instance (`USE_IN_MEMORY_DB=false`) — e.g. MongoDB Atlas — nothing seeds it automatically, since that would be surprising for a persistent database. Run the seed script yourself from `backend/`:

```bash
cd backend
npm run seed
```

This populates the same categories, Gabonese cities/venues, sample organizers/events, and development accounts (see below) as the in-memory auto-seed. It's idempotent — it checks whether categories already exist and skips seeding if so, so it's safe to run again without creating duplicates. Unlike the in-memory case, this data persists across backend restarts.

### Environment variables

Each project owns its own env file — copy the example and fill it in:

```bash
cd backend  && cp .env.example .env
cd frontend && cp .env.local.example .env.local
```

Defaults work out of the box for local development. Key backend variables:
- `USE_IN_MEMORY_DB` (default `true`) — set to `false` and provide a real `MONGODB_URI` for staging/production.
- `WEB_URL` — the frontend's origin; used for the CORS allow-list. **Must exactly match your deployed Vercel URL in production.**
- `PAYMENT_PROVIDER=mock` — only provider implemented for the MVP; see [Payments](#payments) below.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — set strong random values before deploying anywhere real.

Frontend variables (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL` — the backend's API base URL (e.g. `https://your-api.onrender.com/api/v1` in production).
- `NEXT_PUBLIC_SITE_URL` — the frontend's own deployed URL, used for metadata/sitemap.

### Development accounts

Seeded automatically (password for all: `Password123!`):

| Role | Email |
|---|---|
| Super Admin | `admin@noma.events` |
| Organizer (owns "Libreville Live") | `organizer@noma.events` |
| Organizer (owns "Gabon Culture Collective") | `organizer2@noma.events` |
| Attendee (has a sample paid order + tickets) | `attendee@noma.events` |
| Event staff (assigned to one seeded event) | `staff@noma.events` |

## Payments

The MVP ships a `MockPaymentProvider` that requires no external credentials, matching the implementation spec's "payment abstraction" requirement. The checkout flow:

1. `POST /api/v1/orders` creates a `PENDING` order with **server-calculated** totals (client-sent prices are never trusted) and atomically reserves inventory.
2. `POST /api/v1/payments/mock/initialize` creates a `Payment` record and a provider reference.
3. Instead of a real redirect, the web checkout page shows a "mock checkout" screen where the user simulates a `SUCCESS` or `FAILED` outcome.
4. That action calls `POST /api/v1/payments/mock/simulate`, which drives the **exact same webhook-handling code path** (`POST /api/v1/payments/:provider/webhook`) a real provider callback would — including shared-secret verification and idempotent order finalization. Tickets are issued exactly once even if the webhook fires more than once.

To add a real provider (Airtel Money, Moov Money, cards), implement `PaymentProvider` (see `backend/src/modules/payments/provider.types.ts`) in a new file under `modules/payments/providers/`, register it in `payments.service.ts`, and set `PAYMENT_PROVIDER` accordingly. No other module needs to change.

## Testing

From within each directory:

```bash
# backend/
npm run test         # integration tests (Vitest + Supertest + in-memory MongoDB)
npm run typecheck
npm run lint
npm run build

# frontend/
npm run typecheck
npm run lint
npm run build
```

Backend tests cover the business-critical paths called out in the spec: auth, event ownership/publish rules, server-calculated checkout totals, inventory never oversold under concurrent orders, order expiry, webhook idempotency (tickets issued exactly once), and the check-in state machine (`VALID` → `ALREADY_USED`, `WRONG_EVENT`, unauthorized staff rejected).

## Deployment: Vercel (frontend) + Render (backend)

These are separate origins in production. Auth is a Bearer JWT in the `Authorization` header rather than a cookie, so there's no cross-site cookie configuration to worry about — just get CORS's origin allow-list right (below).

### Backend → Render

1. Create a new **Web Service**, root directory `backend/`. Build command `npm install && npm run build`, start command `npm start`.
2. Set env vars from `backend/.env.example`: `NODE_ENV=production`, `USE_IN_MEMORY_DB=false`, a real `MONGODB_URI` (e.g. MongoDB Atlas — include a database name in the path, e.g. `.../noma_events?...`, or Mongo defaults to a db named `test`), strong random `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`, and `WEB_URL` set to your **exact** Vercel URL (e.g. `https://noma-events.vercel.app`, no trailing slash) — this drives the CORS allow-list.
3. **File uploads**: `STORAGE_PROVIDER=local` writes to `backend/public/uploads` on local disk. Render's filesystem is ephemeral by default — uploaded images will be **lost on every redeploy or restart** unless you attach a Render persistent disk, or (better, before going live for real) implement an S3/Cloudinary-backed adapter under `modules/uploads` and set `STORAGE_PROVIDER` accordingly.
4. Render's health checks can point at `/health`.

### Frontend → Vercel

1. Import the repo, set the project **root directory** to `frontend/`.
2. Set env vars: `NEXT_PUBLIC_API_URL` = your Render API's base URL + `/api/v1` (e.g. `https://noma-events-api.onrender.com/api/v1`), and `NEXT_PUBLIC_SITE_URL` = your Vercel URL.
3. Vercel auto-detects Next.js — no custom build command needed.

### After both are deployed

Update `WEB_URL` on Render (step 2 above) to match the real Vercel URL if it wasn't known yet, and redeploy the backend — CORS will reject requests from any origin that doesn't match exactly.

### General notes

- Set strong, unique values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `PAYMENT_WEBHOOK_SECRET`.
- Configure a real email/SMS provider to replace the `EMAIL_PROVIDER=dev` in-app notification log (`modules/notifications/notifications.service.ts`).

## Troubleshooting

**Backend fails to connect to MongoDB Atlas with `querySrv ECONNREFUSED _mongodb._tcp....`**

This means DNS SRV record lookups are failing — some Windows/ISP/VPN DNS resolvers can't resolve the `SRV` record type that `mongodb+srv://` connection strings require, even when normal DNS resolution works fine for everything else. Fix: in the Atlas dashboard's "Connect" dialog, use the non-SRV connection string instead (it lists the `...-shard-00-00/01/02...` hosts directly rather than relying on SRV). See the fuller comment in `backend/.env.example` next to `MONGODB_URI`.

Also make sure the connection string includes a database name in the path (e.g. `/noma_events` before the `?`) — without one, Mongo defaults to a database named `test`.

## Before public launch

Per the spec: confirm real Gabon payment provider APIs and commercial terms, legal/tax/privacy/refund requirements, organizer payout policy, and set up monitoring, backups, and fraud/chargeback workflows. None of this is implemented — it's explicitly out of scope for the MVP.

## Deferred (per spec)

AI recommendations, social feed/messaging, seating maps, subscriptions/enterprise billing, NFT ticketing, full offline scanning, advanced CRM/BI, automated organizer settlements.
