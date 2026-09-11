# BeautyBid Production Deployment & Operations Runbook

> **Executive Summary**  
> BeautyBid is an India-first beauty promotional ranking platform built on a deterministic pay-to-rank engine, real-time Razorpay integration, strict legal transparency disclosures, and PostgreSQL ACID transactions with row-level concurrency locking. This document provides the end-to-end production deployment runbook, infrastructure blueprint, security architecture, and operational procedures.

---

## Table of Contents
1. [Architecture & Topology Overview](#1-architecture--topology-overview)
2. [Target Cloud Infrastructure & Platform Mapping](#2-target-cloud-infrastructure--platform-mapping)
3. [Environment Variable Inventory & Secret Management](#3-environment-variable-inventory--secret-management)
4. [Production Build & Artifacts](#4-production-build--artifacts)
5. [Database Architecture, Connection Pooling & Migrations](#5-database-architecture-connection-pooling--migrations)
6. [Zero-Downtime Migration Playbook](#6-zero-downtime-migration-playbook)
7. [Razorpay Test-Mode & Production Gateway Architecture](#7-razorpay-test-mode--production-gateway-architecture)
8. [Webhook Signature Verification & Idempotency Engine](#8-webhook-signature-verification--idempotency-engine)
9. [CORS, Security Hardening & Rate Limiting Audit](#9-cors-security-hardening--rate-limiting-audit)
10. [Health Probes & Liveness/Readiness Checks](#10-health-probes--livenessreadiness-checks)
11. [Containerization & Dockerfile Specification](#11-containerization--dockerfile-specification)
12. [DNS, SSL/TLS & Reverse Proxy Configuration](#12-dns-ssltls--reverse-proxy-configuration)
13. [Step-by-Step Deployment Execution Guide](#13-step-by-step-deployment-execution-guide)
14. [Observability, Logging & Alerting Strategy](#14-observability-logging--alerting-strategy)
15. [Rollback & Disaster Recovery Procedures](#15-rollback--disaster-recovery-procedures)
16. [Production Launch Verification Checklist](#16-production-launch-verification-checklist)

---

## 1. Architecture & Topology Overview

```mermaid
flowchart TD
    User["End User / Beauty Brand"]
    Cloudflare["Cloudflare Edge (WAF, SSL/TLS, DDoS, DNS)"]
    Vercel["Vercel Edge Network (Frontend SPA - React 18 / Vite)"]
    Render["Render / Railway Service (Backend API - Node 22 / Express)"]
    PgBouncer["Supabase / Neon Connection Pooler (PgBouncer Port 6543)"]
    Postgres["Managed PostgreSQL 17 Instance (Port 5432)"]
    Razorpay["Razorpay Payment Gateway (Test Mode / Production)"]

    User -->|"HTTPS (beautybid.in)"| Cloudflare
    Cloudflare -->|"Cache / Assets"| Vercel
    Vercel -->|"API calls (api.beautybid.in)"| Cloudflare
    Cloudflare -->|"Proxy to Port 5000"| Render
    Render -->|"Pooled Queries"| PgBouncer
    PgBouncer --> Postgres
    Render -->|"Direct Migrations (CI/CD)"| Postgres
    User -->|"Checkout SDK"| Razorpay
    Razorpay -->|"Signed Webhooks (HMAC-SHA256)"| Render
```

- **Frontend Tier**: Single Page Application compiled with Vite, React 18, Tailwind CSS, served via Global CDN edge with immutable asset hashing.
- **Backend Tier**: Express.js REST API with TypeScript, running in Docker on Node.js 22 LTS Alpine with `trust proxy: 1`.
- **Database Tier**: Managed PostgreSQL 17 with ACID-compliant transactions, explicit row-level locks (`FOR UPDATE`), and transaction pooling via PgBouncer.
- **Payment & Promotional Ranking Engine**: Server-calculated required spend amounts, Razorpay SDK order generation, timing-safe cryptographic signature validation, and idempotent webhook processing.

---

## 2. Target Cloud Infrastructure & Platform Mapping

| Component | Recommended Production Provider | Alternative Options | Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | Cloudflare Pages, AWS Amplify | Zero-config SPA rewrites, instant global CDN invalidation, preview branches. |
| **Backend API** | **Render (Singapore / Mumbai)** | Railway, AWS App Runner, Fly.io | Native Dockerfile support, automated zero-downtime rolling deploys, close proximity to India users. |
| **Database** | **Supabase (AWS Mumbai / `ap-south-1`)** | Neon Serverless, AWS RDS Aurora | Native PgBouncer connection pooling, automated daily WAL backups, point-in-time recovery. |
| **Edge & DNS** | **Cloudflare** | Route 53, Vercel DNS | Free Universal SSL, DDoS protection, edge caching, HTTP/3, and Rate Limiting WAF rules. |
| **Payment Gateway** | **Razorpay (India)** | Cashfree, Stripe India | Native support for UPI (GPay, PhonePe, Paytm), Netbanking (50+ Indian banks), Cards, and RuPay. |

---

## 3. Environment Variable Inventory & Secret Management

### Backend Environment Variables (`backend/.env.production`)

| Variable | Sensitivity | Required | Example / Format | Purpose |
| :--- | :---: | :---: | :--- | :--- |
| `NODE_ENV` | Low | Yes | `production` | Enables production optimizations, combined morgan logging, and strict error masking. |
| `PORT` | Low | Yes | `5000` | Port on which the Express server binds. |
| `DATABASE_URL` | **Critical** | Yes | `postgresql://user:pass@host:6543/db?pgbouncer=true&connection_limit=20` | Pooled connection string used for runtime API transactions. |
| `DIRECT_URL` | **Critical** | Yes | `postgresql://user:pass@host:5432/db` | Non-pooled connection string used exclusively for running Prisma migrations. |
| `JWT_SECRET` | **Critical** | Yes | `openssl rand -base64 64` (64+ chars) | Cryptographic key used to sign and verify JSON Web Tokens. |
| `JWT_EXPIRES_IN` | Low | Yes | `7d` | Session token validity duration. |
| `FRONTEND_URL` | Medium | Yes | `https://beautybid.in` | Permitted origin for CORS headers. (No trailing slash). |
| `RAZORPAY_KEY_ID` | Medium | Yes | `rzp_test_51Abcdefghijk` | Public Razorpay API key (Test mode prefix: `rzp_test_`). |
| `RAZORPAY_KEY_SECRET` | **Critical** | Yes | `RandomSecretKey123456789` | Private Razorpay key for server-side order generation and HMAC signature checks. |
| `RAZORPAY_WEBHOOK_SECRET` | **Critical** | Yes | `SecretWebhookPassphrase2026` | Secret used to verify incoming Razorpay webhook HMAC-SHA256 signatures. |
| `DEFAULT_MIN_RANK_INCREMENT` | Low | Yes | `500` | Minimum currency increment required to leapfrog an existing rank holder (in ₹). |
| `CURRENCY` | Low | Yes | `INR` | ISO currency code (Indian Rupee). |

### Frontend Environment Variables (`frontend/.env.production`)

| Variable | Sensitivity | Required | Example / Format | Purpose |
| :--- | :---: | :---: | :--- | :--- |
| `VITE_API_URL` | Low | Yes | `https://api.beautybid.in/api` | Absolute base URL for all REST API endpoints. |
| `VITE_RAZORPAY_KEY_ID` | Medium | Yes | `rzp_test_51Abcdefghijk` | Public key used to instantiate the client-side Razorpay Checkout modal. |
| `VITE_APP_NAME` | Low | Yes | `BeautyBid` | Brand title displayed across the UI and disclosure banners. |
| `VITE_APP_DESCRIPTION` | Low | Yes | `India's First Promotional Beauty Ranking Platform` | Platform meta description and SEO copy. |

---

## 4. Production Build & Artifacts

### Backend Build
- **Tool**: TypeScript Compiler (`tsc`)
- **Output**: `backend/dist/`
- **Verification Command**:
  ```bash
  cd backend
  npm ci
  npm run build
  npm start
  ```
- **Node Flags**: Recommended for production:
  `NODE_OPTIONS="--max-old-space-size=1024"`

### Frontend Build
- **Tool**: Vite 6 + TypeScript (`tsc && vite build`)
- **Output**: `frontend/dist/`
- **Output Assets**:
  - `dist/index.html` (~1.92 kB)
  - `dist/assets/index-[hash].css` (~33.90 kB)
  - `dist/assets/index-[hash].js` (~348.23 kB, ~102 kB gzipped)
- **Asset Caching**: Configured via `frontend/vercel.json` with `Cache-Control: public, max-age=31536000, immutable` on `/assets/*`.

---

## 5. Database Architecture, Connection Pooling & Migrations

### Prisma Schema & Migration Baseline
The database schema is defined in `backend/prisma/schema.prisma` and baselined under:
`backend/prisma/migrations/20260910000000_init/migration.sql`
`backend/prisma/migrations/migration_lock.toml` (`provider = "postgresql"`)

### Connection Pooling Strategy
PostgreSQL connections consume server memory (~10MB per process). When deploying serverless or containerized backends that scale horizontally, unpooled connections can rapidly exhaust PostgreSQL's `max_connections`.
- **Runtime API Traffic**: Must connect via **PgBouncer** in **Transaction Pooling** mode (`port 6543`), which recycles connections as soon as a transaction commits.
- **Migration & Schema Traffic**: Prisma migrations require prepared statements and session-level locks that are incompatible with transaction pooling. Therefore, migrations must use the `DIRECT_URL` on standard port `5432`.

### Migration Execution in CI/CD & Deploy Commands
```bash
# Generate Prisma Client
npm run prisma:generate

# Apply pending migrations safely to production DB
npm run prisma:deploy
```
*(Note: Never use `prisma db push` in production. `prisma migrate deploy` ensures only committed and tested migration SQL files are applied).*

---

## 6. Zero-Downtime Migration Playbook

To ensure continuous uptime while evolving the database schema:

1. **Rule 1: Always Backwards-Compatible Changes**
   - **Adding a column**: Always make new columns `NULLABLE` or assign a `DEFAULT` value.
   - **Renaming a column**: Do not rename directly. First add the new column, dual-write in backend code, migrate historical data with a background worker, and drop the old column in a subsequent release.
   - **Removing a column**: First remove all application code reading or writing that column, deploy the code, then run a migration to drop the column.
2. **Rule 2: Deploy Migrations Before Application Code (Expand Phase)**
   Run `npm run prisma:deploy` during the pre-deploy phase of the deployment pipeline. Since changes are strictly additive/backwards-compatible, existing running backend instances continue functioning seamlessly.
3. **Rule 3: Rolling Application Deployment**
   Container orchestrator (Render/Railway/Kubernetes) spawns new backend containers, validates `/api/health`, and gracefully terminates old containers once health checks pass.
4. **Rule 4: Cleanup Migration (Contract Phase)**
   After the new application version is stable across 100% of traffic, run a cleanup migration to drop obsolete columns or temporary tables.

---

## 7. Razorpay Test-Mode & Production Gateway Architecture

### Setting Up Razorpay in Test Mode
1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Toggle the dashboard switch from **Live Mode** to **Test Mode** (orange indicator in top bar).
3. Navigate to **Account & Settings** -> **API Keys** -> **Generate Key**.
4. Save the generated `Key Id` (starts with `rzp_test_...`) and `Key Secret`.
5. Set these in the backend environment as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`, and on the frontend as `VITE_RAZORPAY_KEY_ID`.

### Simulated Test Card Credentials
In Razorpay Test Mode, live bank accounts and credit cards are never charged. Use the following test credentials:

| Payment Method | Test Identifier / Number | Expiry / CVV | OTP | Expected Outcome |
| :--- | :--- | :---: | :---: | :--- |
| **Test Card (Success)** | `4111 1111 1111 1111` | Any future date / `123` | `123456` | Immediate Capture (200 OK) |
| **Test Card (Failure)** | `4000 0000 0000 0002` | Any future date / `123` | `123456` | Gateway Decline (Payment Failed) |
| **UPI Simulation** | `success@razorpay` | N/A | N/A | Instant UPI notification & approval |
| **Netbanking** | Select any mock bank (e.g. HDFC, SBI) | N/A | Any | Redirect to mock bank success page |

---

## 8. Webhook Signature Verification & Idempotency Engine

### Webhook Configuration in Razorpay Dashboard
1. In Razorpay Dashboard (Test Mode), navigate to **Account & Settings** -> **Webhooks** -> **Add New Webhook**.
2. **Webhook URL**: `https://api.beautybid.in/api/payments/webhook`
3. **Secret**: Enter a strong random secret and copy it to `RAZORPAY_WEBHOOK_SECRET`.
4. **Active Events**: Check the following required events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`

### Cryptographic Verification Implementation
To prevent forgery and timing analysis attacks:
1. Express preserves the unparsed body buffer via `express.json({ verify: (req, res, buf) => { req.rawBody = buf.toString(); } })`.
2. Backend computes the HMAC-SHA256 hash using `config.razorpay.webhookSecret`.
3. Signatures are verified using `crypto.timingSafeEqual` over fixed-length buffers:
   ```typescript
   private static timingSafeCompare(a: string, b: string): boolean {
     if (!a || !b) return false;
     const bufA = Buffer.from(a, 'utf8');
     const bufB = Buffer.from(b, 'utf8');
     if (bufA.length !== bufB.length) return false;
     return crypto.timingSafeEqual(bufA, bufB);
   }
   ```

### Webhook Idempotency Guarantee
Network retries and gateway duplicate deliveries are handled through the `payment_events` table:
1. When an event arrives, the system queries `prisma.paymentEvent.findUnique({ where: { eventId } })`.
2. If the `eventId` is already present, the backend immediately responds with `{ status: 'already_processed' }` (HTTP 200 OK) and exits.
3. The promotion logic is executed inside a PostgreSQL transaction (`prisma.$transaction`) with row-level locks on `payments` and `products` (`SELECT ... FOR UPDATE`).
4. If the payment record is already in `captured` status, verified spend is never incremented a second time.
5. The incoming event is persisted in `payment_events` alongside its raw payload for permanent audit compliance.

---

## 9. CORS, Security Hardening & Rate Limiting Audit

### CORS Configuration
Configured dynamically in `backend/src/index.ts`:
- Allows exact origin matches (`https://beautybid.in`, `https://www.beautybid.in`).
- Dynamically validates preview deployments matching `/\.vercel\.app$/`.
- Allows local development origins (`http://localhost:5173`, `http://127.0.0.1:5173`) when `NODE_ENV=development`.
- Requires `credentials: true` for authorization headers.
- Rejects unauthorized cross-origin preflight requests with standard CORS policy errors.

### Security Headers (Helmet & Vercel)
- `X-Content-Type-Options: nosniff` (prevents MIME-type sniffing).
- `X-Frame-Options: DENY` (prevents clickjacking attacks).
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- Cross-origin resource policy enabled for static asset embedding.

### Rate Limiting Strategy
- **General API**: 100 requests per 15 minutes per client IP (`generalLimiter`).
- **Auth Endpoints (`/api/auth/*`)**: 10 requests per 15 minutes per IP (`authLimiter`) to prevent brute-force attacks.
- **Proxy Trust**: `app.set('trust proxy', 1)` is active, ensuring that when requests pass through Vercel or Cloudflare, rate limits evaluate the real client IP (`CF-Connecting-IP` / `X-Forwarded-For`) rather than throttling the proxy IP.

---

## 10. Health Probes & Liveness/Readiness Checks

### Health Endpoint: `GET /api/health`
The health probe performs an active, low-overhead SQL probe (`SELECT 1`) against PostgreSQL:
```json
{
  "status": "healthy",
  "platform": "BeautyBid",
  "environment": "production",
  "timestamp": "2026-09-12T00:10:18.950Z",
  "uptimeSeconds": 105639,
  "database": {
    "status": "connected",
    "latencyMs": 4
  },
  "currency": "INR",
  "disclaimer": "Rankings are based on verified promotional spend and do not represent product quality."
}
```
- **Response Codes**:
  - `200 OK`: Database connected, latency measured, API healthy.
  - `503 Service Unavailable`: Database unreachable or connection pool exhausted (signals load balancers to route traffic away or reboot the unhealthy container).

---

## 11. Containerization & Dockerfile Specification

The production Dockerfile (`backend/Dockerfile`) implements a multi-stage Alpine build:
- **Build Stage**: Uses `node:22-alpine`, installs build tools and OpenSSL, compiles TypeScript, runs `prisma generate`, and trims `devDependencies`.
- **Runtime Stage**: Copies only pruned production artifacts, runs under an unprivileged user (`nodejs`, UID 1001), exposes port 5000, and defines a native container `HEALTHCHECK`:
  ```dockerfile
  HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1
  ```
- **Image Size**: Under ~180MB total, drastically reducing startup latency and attack surface.

---

## 12. DNS, SSL/TLS & Reverse Proxy Configuration

### DNS Record Mapping (Cloudflare DNS)

| Type | Name | Content / Target | Proxy Status | Purpose |
| :--- | :--- | :--- | :---: | :--- |
| **CNAME** | `beautybid.in` | `cname.vercel-dns.com` | **Proxied** (Orange Cloud) | Apex domain pointing to Vercel CDN |
| **CNAME** | `www` | `cname.vercel-dns.com` | **Proxied** (Orange Cloud) | Subdomain pointing to Vercel CDN |
| **CNAME** | `api` | `beautybid-api.onrender.com` | **Proxied** (Orange Cloud) | Backend API endpoint pointing to Render |

### SSL/TLS Encryption
1. **Cloudflare SSL/TLS Mode**: Select **Full (Strict)**. This ensures traffic between Cloudflare and Vercel/Render is fully encrypted with valid certificates.
2. **Always Use HTTPS**: Enabled (automatically redirects all `http://` requests to `https://`).
3. **HSTS (HTTP Strict Transport Security)**: Enable with `max-age=31536000`, include subdomains, and preload.
4. **Minimum TLS Version**: TLS 1.2 or TLS 1.3.

---

## 13. Step-by-Step Deployment Execution Guide

### Phase 1: Database Setup (Supabase / Neon)
1. Create a PostgreSQL project in region `ap-south-1` (Mumbai).
2. Note both the **Connection Pooling URL** (port 6543, PgBouncer) and the **Direct URL** (port 5432).
3. Whitelist outgoing IP ranges or allow all (`0.0.0.0/0`) since PaaS platforms (Render/Vercel) utilize dynamic IPs.

### Phase 2: Backend API Deployment (Render)
1. Push repository to GitHub/GitLab.
2. Log into Render, click **New +** -> **Web Service** -> Connect repository.
3. Set **Root Directory** to `backend`.
4. Choose **Environment**: `Node` (or Docker).
5. Configure Build & Start commands:
   - **Build Command**: `npm ci && npm run prisma:deploy && npm run build`
   - **Start Command**: `npm start`
6. Add Environment Variables from the backend inventory table above.
7. Under **Health Check Path**, enter `/api/health`.
8. Click **Deploy Web Service**.
9. In Custom Domains, add `api.beautybid.in` and complete the DNS CNAME verification.

### Phase 3: Frontend Deployment (Vercel)
1. Log into Vercel, click **Add New...** -> **Project** -> Import repository.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: `Vite`.
4. Configure Environment Variables:
   - `VITE_API_URL`: `https://api.beautybid.in/api`
   - `VITE_RAZORPAY_KEY_ID`: `rzp_test_...`
   - `VITE_APP_NAME`: `BeautyBid`
5. Click **Deploy**.
6. In Project Settings -> **Domains**, add `beautybid.in` and `www.beautybid.in`.

### Phase 4: Razorpay Test-Mode Webhook Registration
1. Open Razorpay Dashboard in Test Mode.
2. Add Webhook URL: `https://api.beautybid.in/api/payments/webhook`.
3. Set Webhook Secret to match `RAZORPAY_WEBHOOK_SECRET` in Render.
4. Subscribe to `payment.captured`, `order.paid`, `payment.failed`.

---

## 14. Observability, Logging & Alerting Strategy

- **HTTP Access Logs**: Managed by `morgan('combined')` in production, outputting standard Apache/Nginx combined log format (IP, timestamp, method, URL, status code, response time, user agent) to stdout.
- **Container Log Ingestion**: Render and Docker automatically collect stdout/stderr. Optionally forward logs to **Datadog** or **Logtail / Better Stack**.
- **Error Tracking**: Integrate `@sentry/node` (backend) and `@sentry/react` (frontend) to capture unhandled exceptions with full stack traces and contextual breadcrumbs.
- **Uptime Monitoring**: Configure a 1-minute check on **BetterUptime** or **UptimeRobot** targeting:
  - `https://api.beautybid.in/api/health` (Alert if status !== 200 or latency > 1500ms)
  - `https://beautybid.in/` (Alert if status !== 200)

---

## 15. Rollback & Disaster Recovery Procedures

### Application Rollback
- **Frontend**: In the Vercel Dashboard, select the previous stable deployment from the **Deployments** tab and click **Promote to Production** (instantaneous edge switch in < 5 seconds).
- **Backend**: In the Render Dashboard, navigate to **Deploys** and click **Rollback** on the last known healthy release.

### Database Backup & Point-In-Time Recovery
- Managed PostgreSQL instances (Supabase/Neon/AWS RDS) take automated daily snapshots with continuous Write-Ahead Log (WAL) archiving.
- If a data corruption incident occurs, initiate Point-In-Time Recovery (PITR) to a timestamp 1 minute prior to the failure event.

---

## 16. Production Launch Verification Checklist

- [ ] **Builds**: `npm run build` succeeds in both `backend` and `frontend` with zero TypeScript errors.
- [ ] **Tests**: All automated tests pass (`npm test` in backend: 4/4 passing).
- [ ] **Health Check**: `https://api.beautybid.in/api/health` returns `status: "healthy"` with active DB latency.
- [ ] **HTTPS & DNS**: `https://beautybid.in` and `https://api.beautybid.in` resolve with valid SSL/TLS certificates.
- [ ] **CORS**: Cross-origin requests between frontend domain and backend domain function without browser console errors.
- [ ] **Mandatory Disclosures**: "Promotional ranking based on verified spend" disclosure banner renders prominently across all public views.
- [ ] **Deterministic Calculation**: Server calculation matches:
  $\text{required\_payment} = \text{target\_rank\_holder\_spend} + \text{minimum\_increment}$.
- [ ] **Razorpay Modal**: Razorpay checkout opens in Test Mode (`rzp_test_...`) and accepts test card credentials.
- [ ] **Webhook Idempotency**: Razorpay webhook triggers, verifies HMAC signature using timing-safe comparison, and updates verified promotional spend inside a row-locked transaction.
- [ ] **Audit Trail**: Safe public ledger (`/api/payments/history/product/:id`) displays historical promotional payments without exposing any PII or gateway secrets.
- [ ] **Admin Security**: Admin routes (`/api/admin/*`) reject unauthenticated requests with 401/403 and require valid JWTs with role `ADMIN`.
- [ ] **Rate Limiting**: Excess requests to `/api/auth/*` trigger HTTP 429 Too Many Requests.
