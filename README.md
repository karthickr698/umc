# UMC – Construction Management

Monorepo for the UMC construction management application.

| Workspace         | Package       | Stack                                    |
| ----------------- | ------------- | ---------------------------------------- |
| `apps/web`        | `@umc/web`    | React 19, TypeScript, Vite               |
| `apps/api`        | `@umc/api`    | Node.js, Express 5, TypeScript, Mongoose |
| `packages/shared` | `@umc/shared` | Shared TypeScript types and constants    |

## Prerequisites

- Node.js >= 20.19 (see `.nvmrc`) and npm >= 10
- MongoDB 7+ running locally, or Docker (`npm run db:up` starts one via `docker-compose.yml`)

## Getting started

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env   # optional, defaults work for local dev
npm run db:up                             # optional, if you don't have MongoDB running
npm run dev
```

- Web: http://localhost:5173 (proxies `/api` to the API)
- API: http://localhost:4000/api/health

## Environment variables

Frontend and backend have separate env files; never share one between them.

| File            | Variable                               | Purpose                                                     |
| --------------- | -------------------------------------- | ----------------------------------------------------------- |
| `apps/api/.env` | `NODE_ENV`                             | `development` \| `test` \| `production`                     |
|                 | `PORT`                                 | API port (default `4000`)                                   |
|                 | `DATABASE_URL`                         | MongoDB connection string (required)                        |
|                 | `DATABASE_SERVER_SELECTION_TIMEOUT_MS` | Startup wait for MongoDB before failing (default `10000`)   |
|                 | `CORS_ORIGIN`                          | Comma-separated allowed browser origins (exact, no `*`)     |
|                 | `TRUST_PROXY`                          | Reverse proxies in front of the API (default `1`)           |
|                 | `RATE_LIMIT_API_PER_MINUTE`            | Requests per minute per IP (default `300`)                  |
|                 | `RATE_LIMIT_LOGIN_FAILURES_PER_15_MIN` | Failed sign-ins per IP per 15 minutes (default `10`)        |
|                 | `LOG_LEVEL`                            | pino log level                                              |
|                 | `PDF_BROWSER_EXECUTABLE_PATH`          | Chrome binary for invoice PDFs (default: Puppeteer's own)   |
|                 | `PDF_BROWSER_NO_SANDBOX`               | Run Chrome without its sandbox (default `false`)            |
|                 | `PDF_RENDER_TIMEOUT_MS`                | Timeout of one PDF render step (default `30000`)            |
|                 | `PDF_MAX_CONCURRENT_RENDERS`           | PDFs rendered at once; others queue (default `2`)           |
|                 | `WHATSAPP_*`                           | WhatsApp sending of invoices (see below)                    |
| `apps/web/.env` | `VITE_API_BASE_URL`                    | API base URL used by the browser (default `/api`)           |
|                 | `API_PROXY_TARGET`                     | Vite dev server proxy target for `/api` (not in the bundle) |

API variables are validated with Zod at startup (`apps/api/src/config/env.ts`). Only `VITE_`-prefixed web variables reach the browser, so they must never contain secrets.

## Scripts

All scripts are run from the repository root.

| Script                            | Description                                    |
| --------------------------------- | ---------------------------------------------- |
| `npm run dev`                     | Run shared (watch), API and web together       |
| `npm run dev:api`                 | Run only the API (tsx watch)                   |
| `npm run dev:web`                 | Run only the web app (Vite dev server)         |
| `npm run build`                   | Build shared, API and web for production       |
| `npm run build:api` / `build:web` | Build a single app (and its shared dependency) |
| `npm run start:api`               | Start the compiled API (`apps/api/dist`)       |
| `npm run preview:web`             | Serve the built web app locally                |
| `npm run typecheck`               | Type-check every workspace                     |
| `npm run lint` / `lint:fix`       | ESLint across the repo                         |
| `npm run format` / `format:check` | Prettier across the repo                       |
| `npm run test`                    | Run workspace test suites                      |
| `npm run check`                   | Typecheck, lint, format check and test (CI)    |
| `npm run db:up` / `db:down`       | Start/stop the local MongoDB container         |
| `npm run db:sync-indexes`         | Create/drop MongoDB indexes to match schemas   |

In development the API builds missing indexes on startup. In production `autoIndex` is off, so run `npm run db:sync-indexes` (or `node dist/scripts/sync-indexes.js` in `apps/api` from a compiled build) after deploying a change to a schema's indexes. It also drops indexes no schema declares.

Add dependencies to a specific workspace with `npm i <pkg> -w @umc/api` (or `-w @umc/web`, `-w @umc/shared`).

## Roles and accounts

- **Company users** (`OWNER`, `ADMIN`, `MANAGER`, `STAFF`) see only their own company's data. Anyone can sign up at `/register`, which creates a new company with them as its `OWNER`; owners and admins add the rest through user management.
- **`SUPER_ADMIN`** is a platform operator with no company. It has read-only access to every company, its owners and its sites (`/api/admin/*`, and the **Companies** / **All sites** pages in the web app), and is refused by every company-scoped endpoint. It cannot be assigned through sign-up or user management; create one with:

```bash
npm run create-super-admin -w @umc/api -- --email ops@example.com --name "Ops Team"
```

The script connects using `apps/api/.env` and prompts for the password.

## API endpoints

| Method | Path                | Description                                            |
| ------ | ------------------- | ------------------------------------------------------ |
| GET    | `/api/health`       | Liveness: process status, uptime, DB state             |
| GET    | `/api/health/ready` | Readiness: `200` when MongoDB is connected, else `503` |

Every business endpoint is documented in the Postman collection (`apps/api/postman`).

### Invoice PDFs

Payment receipts are rendered from HTML with [Puppeteer](https://pptr.dev), which downloads a headless Chrome on `npm install`. Generated PDFs go through the storage service, like attachments.

| Method | Path                           | Description                                          |
| ------ | ------------------------------ | ---------------------------------------------------- |
| GET    | `/api/invoices`                | List invoices (filters: payment, site, status, date) |
| POST   | `/api/invoices`                | Issue a payment's invoice and render its PDF         |
| GET    | `/api/invoices/:id`            | Invoice metadata                                     |
| GET    | `/api/invoices/:id/view`       | The PDF, inline (for viewing in the browser)         |
| GET    | `/api/invoices/:id/download`   | The PDF, as a file download                          |
| POST   | `/api/invoices/:id/regenerate` | Re-render from the payment's current data            |
| POST   | `/api/invoices/:id/whatsapp`   | Send the PDF to the recipient over WhatsApp          |

If Chrome fails to start with "No usable sandbox" (Ubuntu 23.10+ restricts the user namespaces Chrome's sandbox needs), either allow them in AppArmor or set `PDF_BROWSER_NO_SANDBOX=true` in `apps/api/.env`.

### Sending invoices over WhatsApp

After a payment is recorded, the web app generates its invoice and offers **Download PDF**, **Share** (the device share sheet, or a download plus a pre-filled WhatsApp chat where files can't be shared) and **WhatsApp** (sent by the server from the business number). Sending uploads the PDF to WhatsApp as media, sends it as a document and saves the result on the invoice (`whatsappStatus`, `whatsappError`, `sentAt`). Transient WhatsApp errors are retried; any failure is recorded as `FAILED` with a readable reason, and the UI falls back to manual sharing.

Setup (Meta WhatsApp Cloud API), all in `apps/api/.env` — see `.env.example` for details:

1. Set `WHATSAPP_PROVIDER=meta`, `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`. Without them, sending answers `WHATSAPP_NOT_CONFIGURED` and only manual sharing works.
2. WhatsApp only delivers free-form documents within 24 hours of the recipient's last message. To reach anyone at any time, approve a UTILITY template with a DOCUMENT header and body placeholders `{{1}}` name, `{{2}}` invoice number, `{{3}}` amount, then set `WHATSAPP_INVOICE_TEMPLATE_NAME` (and `WHATSAPP_INVOICE_TEMPLATE_LANGUAGE`).
3. For delivered/read/failed updates, set `WHATSAPP_APP_SECRET` and `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, then register `https://<api-host>/api/webhooks/whatsapp` as the webhook callback (subscribe to `messages`).

Every response uses the same envelope (types in `@umc/shared`):

```jsonc
// success
{ "success": true, "data": { ... }, "meta": { "timestamp": "...", "requestId": "..." } }
// failure
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] }, "meta": { ... } }
```

## Project structure

```
.
├── apps/
│   ├── api/                 Express API
│   │   ├── src/
│   │   │   ├── config/        Env validation (Zod), logger (pino), MongoDB connection
│   │   │   ├── controllers/   HTTP request/response handling
│   │   │   ├── middlewares/   Request logger, 404 and centralized error handler
│   │   │   ├── models/        Mongoose schemas and models
│   │   │   ├── repositories/  Data access (only layer that touches models)
│   │   │   ├── routes/        Express routers, composed in routes/index.ts
│   │   │   ├── services/      Business logic
│   │   │   ├── validators/    Zod request schemas
│   │   │   ├── utils/         ApiError, response helpers, error normalizers
│   │   │   ├── types/         API-only TypeScript types
│   │   │   ├── app.ts         Express app factory
│   │   │   └── server.ts      Server bootstrap + graceful shutdown
│   │   └── tests/           Vitest + Supertest
│   └── web/                 React SPA
│       └── src/
│           ├── hooks/
│           ├── lib/         API client
│           └── styles/
├── packages/
│   └── shared/              Shared types and constants
├── .cursor/rules/           AI coding conventions
├── docker-compose.yml       Local MongoDB
├── eslint.config.js
├── tsconfig.base.json
└── package.json             Workspaces + root scripts
```
