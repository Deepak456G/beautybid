# BeautyBid — India-First Beauty Product Promotional Ranking Platform

> **Promotional Ranking Disclosure**: BeautyBid rankings are strictly determined by verified promotional spend paid by brands. Rankings do not represent product quality, clinical efficacy, or editorial recommendations.

BeautyBid is a high-performance web platform inspired by pay-to-rank promotional mechanics (such as Outbid), tailored specifically for the Indian beauty, skincare, and cosmetics industry with original branding, editorial luxury aesthetics, transparent consumer disclosures, server-side transactional ranking calculations, and Razorpay payment verification.

---

## 1. System Architecture

```
[ Frontend: React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion ]
                             │
                             ▼  (Reverse Proxy / CORS)
[ Backend: Node.js + Express + TypeScript + Helmet + Rate Limit ]
        │                       │                           │
        ▼                       ▼                           ▼
[ Transactional Ranking ]   [ Razorpay Gateway & ]     [ Click & View ]
[    Engine (Atomic)    ]   [ Webhook Idempotency]     [  Analytics   ]
        │                       │
        └───────────────┬───────┘
                        ▼
    [ PostgreSQL 17 Database via Prisma ORM ]
```

---

## 2. Deterministic Ranking Economics & Rules

BeautyBid enforces an explicit, deterministic ranking model:

### The 10 Invariant Ranking Rules
1. **Verified Spend**: Every product has an integer/decimal `verified_spend` in INR.
2. **Descending Order**: Products are ranked strictly in descending order of `verified_spend`.
3. **Spend Equals Visibility**: Higher verified promotional spend directly earns a higher public promotional rank.
4. **Zero Client Trust**: The frontend must **NEVER** decide the final ranking or payment amount.
5. **Server-Side Calculation**: The backend determines the exact required payment amount for any requested rank.
6. **Configurable Minimum Increment**: The minimum outbid increment (`minimum_increment`) is configurable from the Admin settings table (`site_settings`).
7. **Verification Gate**: Payments must be cryptographically verified via Razorpay HMAC signature or webhook before `verified_spend` is modified.
8. **Row-Level Concurrency Lock**: Ranking updates execute inside an atomic PostgreSQL transaction with exclusive row-level locking (`SELECT ... FOR UPDATE`) to prevent race conditions.
9. **Webhook Idempotency**: Duplicate Razorpay webhooks are tracked in `payment_events` and verified payments never increment spend twice.
10. **Immutable History**: All ranking shifts are permanently logged in `ranking_history` and `payments`.

### Explicit Calculation Formula & Variable Dictionary

$$\mathbf{required\_payment\_amount} = \mathbf{target\_rank\_holder\_spend} + \mathbf{minimum\_increment}$$

$$\mathbf{new\_verified\_spend} = \mathbf{required\_payment\_amount}$$

| Variable Name | Description |
|---|---|
| `target_rank` | The leaderboard rank position the brand is aiming to acquire (e.g., `1` for #1). |
| `target_rank_holder_name` | The name of the product currently holding `target_rank`. |
| `target_rank_holder_spend` | The current verified spend of the product occupying `target_rank`. |
| `minimum_increment` | The minimum monetary amount (in INR) required to outbid a position (default: ₹500, configurable to ₹1). |
| `required_payment_amount` | The exact amount the promoting brand must pay (`target_rank_holder_spend + minimum_increment`). |
| `previous_verified_spend` | The previous verified promotional spend of the promoting product. |
| `new_verified_spend` | The new total verified spend of the product upon payment verification. |
| `achieved_rank` | The new rank assigned to the product after recalculating all active products. |

### Concrete Example
```
Initial Leaderboard:
#1 Product A = ₹100,000
#2 Product B = ₹75,000
#3 Product C = ₹50,000

Minimum Increment = ₹1

If Product C wants Rank #1:
target_rank_holder_spend = ₹100,000 (Product A)
minimum_increment        = ₹1
required_payment_amount  = ₹100,000 + ₹1 = ₹100,001

After verified payment:
#1 Product C = ₹100,001 (Claims Rank #1)
#2 Product A = ₹100,000 (Moves to Rank #2)
#3 Product B = ₹75,000  (Moves to Rank #3)
```

---

## 3. Directory Structure

```
BeautyBid/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # PostgreSQL relational schema
│   │   └── seed.ts             # 10+ realistic Indian beauty brands & products
│   ├── src/
│   │   ├── config/             # Environment variables & constants
│   │   ├── middleware/         # Auth, validation, rate limiting
│   │   ├── modules/
│   │   │   ├── admin/          # Platform metrics, moderation, settings
│   │   │   ├── analytics/      # Privacy-friendly views & click tracker
│   │   │   ├── auth/           # JWT, bcrypt, RBAC (USER, BRAND, ADMIN)
│   │   │   ├── payments/       # Razorpay orders, HMAC verify, webhooks
│   │   │   ├── products/       # Products, categories, details
│   │   │   └── ranking/        # Transactional outbid calculations
│   │   ├── utils/              # Prisma client singleton
│   │   ├── index.ts            # Express server entry point
│   │   └── ranking.test.ts     # Automated ranking & idempotency unit tests
│   ├── .env                    # Local environment config
│   ├── .env.example            # Environment template
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Header, Footer, Cards, Banners, SafeLedger
│   │   ├── context/            # AuthContext (JWT session management)
│   │   ├── pages/              # Home, ProductDetail, Promote, Categories, HowItWorks, Dashboards
│   │   ├── services/           # Axios API services
│   │   ├── types/              # TypeScript interfaces
│   │   ├── App.tsx             # React Router routing
│   │   ├── main.tsx
│   │   └── index.css           # Tailwind CSS directives
│   ├── index.html              # HTML with Google Fonts & Razorpay SDK
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts          # Vite proxy to backend
└── README.md
```

---

## 4. Local Setup & Installation

### Prerequisites
- **Node.js**: v20+ (tested on Node v22)
- **PostgreSQL**: 15+ (tested on PostgreSQL 17 on localhost:5432)

### Step 1: Database Setup
Create the PostgreSQL database (if not already created):
```sql
CREATE DATABASE beautybid_db;
```

### Step 2: Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run prisma:seed
```

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
```

---

## 5. Environment Variables (`backend/.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/beautybid_db?schema=public` |
| `JWT_SECRET` | Secret key for JWT session signing | `beautybid_jwt_super_secret_key` |
| `JWT_EXPIRES_IN` | Session expiration window | `7d` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID (test or live) | `rzp_test_beautybid12345` |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret Key | `beautybid_secret_key_testing_98765` |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification secret | `beautybid_webhook_secret_998877` |
| `DEFAULT_MIN_RANK_INCREMENT` | Minimum spend to outbid a position (INR) | `500` |
| `CURRENCY` | Currency code | `INR` |

---

## 6. Development & Run Commands

### Run Backend
```bash
cd backend
npm run dev
# Server running at: http://localhost:5000
```

### Run Frontend
```bash
cd frontend
npm run dev
# Application running at: http://localhost:5173
```

### Run Automated Tests
```bash
cd backend
npm test
# Executes 5 automated unit/integration tests covering ranking calculations, outbids, idempotency and disclosure checks
```

---

## 7. Test Credentials & Demo Accounts

The database seed provides pre-configured test accounts for instant evaluation:

| Role | Email | Password | Access |
|---|---|---|---|
| **Platform Administrator** | `admin@beautybid.in` | `AdminPassword@2026` | Admin Console (`/admin`): metrics, payments, moderation, increment settings |
| **Brand (Minimalist)** | `growth@beminimalist.co` | `BrandPassword@2026` | Brand Dashboard (`/dashboard`), product promotions |
| **Brand (Forest Essentials)** | `concierge@forestessentialsindia.com` | `BrandPassword@2026` | Brand Dashboard (`/dashboard`), outbid actions |
| **Brand (Kama Ayurveda)** | `partners@kamaayurveda.com` | `BrandPassword@2026` | Brand Dashboard (`/dashboard`), outbid actions |

*Tip: The Login page includes instant 1-click login buttons for Administrator and Brand accounts.*

---

## 8. Razorpay Test Mode & Webhook Configuration

### Live Test Mode
To use your own live Razorpay Test keys:
1. Obtain `Key Id` and `Key Secret` from [Razorpay Dashboard](https://dashboard.razorpay.com/#/app/keys).
2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`.
3. In Razorpay Webhooks settings, add:
   - Webhook URL: `https://your-api-domain.com/api/payments/webhook`
   - Secret: value of `RAZORPAY_WEBHOOK_SECRET`
   - Active Events: `payment.captured`, `order.paid`, `payment.failed`.

### Sandbox Simulation Mode
If using local test keys (`rzp_test_beautybid...`), BeautyBid automatically engages its sandbox payment simulator:
- Orders are cryptographically formatted.
- Clicking **"Pay & Claim Rank"** simulates instant payment completion and runs server-side rank recalculation.
- You can also trigger `POST /api/payments/simulate-sandbox-pay` to simulate a payment event programmatically.

---

## 9. Complete API Endpoint List

### Authentication
- `POST /api/auth/register` — Register a user or brand account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Retrieve current authenticated session profile

### Promotional Rankings
- `GET /api/ranking/leaderboard` — Get ranked beauty products with filters (`category`, `sort`, `search`, `page`)
- `POST /api/ranking/calculate` — Server-side calculation of required promotional payment for a rank
- `GET /api/ranking/min-increment` — Retrieve current minimum increment in INR

### Products
- `GET /api/products/categories/all` — List all beauty categories with counts
- `GET /api/products/:slug` — Single product details, rank position, outbid calculator, milestones
- `POST /api/products` — Create a new beauty formulation (requires auth)
- `GET /api/products/brand/my-products` — Brand product portfolio with live outbid costs

### Payments
- `POST /api/payments/create-order` — Create Razorpay order with strictly calculated server price
- `POST /api/payments/verify` — Verify client Razorpay signature and apply promotion atomically
- `POST /api/payments/webhook` — Razorpay webhook endpoint with idempotency checks
- `GET /api/payments/history/product/:productId` — Safe public payment history (no private PII)
- `GET /api/payments/my-payments` — Brand user payment receipts

### Analytics
- `POST /api/analytics/track` — Track view, card_click, or external_click with privacy-safe hashed IP
- `GET /api/analytics/redirect/:productId` — Tracked outgoing redirect to brand product page
- `GET /api/analytics/brand-summary` — Brand portfolio CTR, views, and clicks

### Admin
- `GET /api/admin/metrics` — All-time, monthly, and daily revenue and transaction breakdown
- `GET /api/admin/payments` — Global payment ledger with gateway transaction IDs
- `GET /api/admin/products` — Global product moderation list
- `PATCH /api/admin/products/:id/status` — Approve, suspend, or feature product
- `GET /api/admin/settings` — Platform settings
- `POST /api/admin/settings` — Update minimum ranking increment or platform text

---

## 10. Production Deployment Guide

### Database (Managed PostgreSQL)
- Provision a managed PostgreSQL instance (e.g. Supabase, Neon, AWS RDS, Railway).
- Set `DATABASE_URL` in backend production environment variables.
- Run `npx prisma db push` and `npx prisma db seed`.

### Backend Deployment (Node.js / Docker)
- Deploy `backend/` to Render, Railway, Fly.io, or AWS ECS.
- Run `npm run build` and `npm start`.
- Ensure all environment variables from `.env.example` are populated.

### Frontend Deployment (Vercel)
- Deploy `frontend/` to Vercel.
- Set Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Set `VITE_API_URL` or configure `vercel.json` rewrites for `/api/(.*) -> https://your-backend-api.com/api/$1`.
