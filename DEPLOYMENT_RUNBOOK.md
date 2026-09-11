# BeautyBid — Production Deployment Runbook

This runbook details the exact, step-by-step deployment procedure for the **BeautyBid** platform using the actual repository structure, verified package scripts, and production configurations.

---

## 1. GitHub Repository Setup

1. **Verify Git Exclusions**  
   Ensure that sensitive files, secrets, and local build outputs are never committed. The `.gitignore` in both root, `backend/`, and `frontend/` ignores:
   - `node_modules/`
   - `dist/`
   - `.env`
   - `.env.local`
   - `.env.*.local`
   - Local log files (`*.log`)

2. **Initialize and Push to GitHub**
   ```bash
   # From repository root (BeautyBid)
   git init
   git add .
   git commit -m "feat: production-ready BeautyBid platform"
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_ORGANIZATION_OR_USERNAME>/beautybid.git
   git push -u origin main
   ```

---

## 2. Production PostgreSQL Setup (Supabase / Neon)

1. **Create Managed Database Instance**
   - Recommended provider: **Supabase** (or Neon).
   - Region: Select **AWS Mumbai (`ap-south-1`)** for minimal latency to Indian users.
   - Database Engine: PostgreSQL 16 or 17.

2. **Retrieve Connection Strings**
   - **Transaction Connection Pooler URL (Port 6543 / PgBouncer)**:  
     Used for the live application backend (`DATABASE_URL`).  
     *Format*: `postgresql://postgres.[ref]:[YOUR_PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=20`
   - **Direct Session URL (Port 5432)**:  
     Used exclusively for Prisma schema migrations (`DIRECT_URL`).  
     *Format*: `postgresql://postgres.[ref]:[YOUR_PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`

3. **Network Access**
   - Ensure network access allows incoming connections from your backend hosting platform (e.g. `0.0.0.0/0` with strong password).

---

## 3. Required Environment Variables

### Backend (`backend` Service)
Configure these variables in your backend hosting provider (Render / Railway):

| Variable Name | Sensitivity | Description |
| :--- | :---: | :--- |
| `NODE_ENV` | Low | Set to `production`. |
| `PORT` | Low | Set to `5000`. |
| `DATABASE_URL` | **Secret** | Pooled PostgreSQL connection string (Port 6543, `pgbouncer=true`). |
| `DIRECT_URL` | **Secret** | Direct PostgreSQL connection string (Port 5432) for running migrations. |
| `JWT_SECRET` | **Secret** | 64-character random string (Generate via: `openssl rand -base64 64`). |
| `JWT_EXPIRES_IN` | Low | Set to `7d`. |
| `FRONTEND_URL` | Medium | Allowed CORS origin: `https://beautybid.in` (No trailing slash). |
| `RAZORPAY_KEY_ID` | Medium | Razorpay Test Key ID (format: `rzp_test_...`). |
| `RAZORPAY_KEY_SECRET` | **Secret** | Razorpay Test Key Secret. |
| `RAZORPAY_WEBHOOK_SECRET`| **Secret** | Secret configured during Razorpay webhook creation. |
| `DEFAULT_MIN_RANK_INCREMENT` | Low | Minimum outbid increment (default: `500`). |
| `CURRENCY` | Low | Set to `INR`. |

### Frontend (`frontend` Service)
Configure these variables in your frontend hosting provider (Vercel):

| Variable Name | Sensitivity | Description |
| :--- | :---: | :--- |
| `VITE_API_URL` | Low | Public backend API URL: `https://api.beautybid.in/api`. |
| `VITE_RAZORPAY_KEY_ID` | Medium | Razorpay Test Key ID (format: `rzp_test_...`). Safe for client bundle. |
| `VITE_APP_NAME` | Low | Platform name: `BeautyBid`. |
| `VITE_APP_DESCRIPTION`| Low | `India's First Promotional Beauty Ranking Platform`. |

---

## 4. Backend Deployment (Render / Railway)

### Option A: Render (Recommended)
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository `beautybid`.
3. Configure settings:
   - **Name**: `beautybid-api`
   - **Region**: Singapore (`ap-southeast-1`)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci && npm run prisma:deploy && npm run build`
   - **Start Command**: `npm start`
4. Add all Backend Environment Variables listed in Section 3.
5. Under **Advanced**, configure **Health Check Path**: `/api/health`.
6. Click **Create Web Service**.

### Option B: Railway
1. In Railway, click **New Project** -> **Deploy from GitHub repo**.
2. Set Root Directory to `/backend`.
3. Add Backend Environment Variables.
4. Set Build Command: `npm ci && npm run prisma:deploy && npm run build`.
5. Set Start Command: `npm start`.

---

## 5. Frontend Deployment (Vercel)

1. In Vercel Dashboard, click **Add New...** -> **Project**.
2. Import your GitHub repository `beautybid`.
3. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click Edit and select `frontend`.
   - **Build Command**: `npm run build` (runs `tsc && vite build`).
   - **Output Directory**: `dist`
4. Add Frontend Environment Variables:
   - `VITE_API_URL`: `https://api.beautybid.in/api`
   - `VITE_RAZORPAY_KEY_ID`: `rzp_test_...`
   - `VITE_APP_NAME`: `BeautyBid`
5. Click **Deploy**.
6. SPA routing is automatically handled by the included [`frontend/vercel.json`](file:///c:/Users/deepa/OneDrive/Desktop/BeautyBid/frontend/vercel.json).

---

## 6. Backend Production URL Configuration

1. After deployment, Render assigns a default URL (e.g. `https://beautybid-api.onrender.com`).
2. In Render -> **Settings** -> **Custom Domains**, add:
   `api.beautybid.in`
3. Add the DNS CNAME record in your DNS provider (see Section 12).

---

## 7. Frontend API URL Configuration

1. Once the backend URL is active (either custom domain `https://api.beautybid.in/api` or provider default `https://beautybid-api.onrender.com/api`), confirm `VITE_API_URL` is set in Vercel.
2. If using custom domain, ensure it matches:
   `VITE_API_URL=https://api.beautybid.in/api`
3. Trigger a redeploy in Vercel if the environment variable was updated.

---

## 8. CORS Configuration

The backend CORS policy is implemented in [`backend/src/index.ts`](file:///c:/Users/deepa/OneDrive/Desktop/BeautyBid/backend/src/index.ts):
- It strictly matches `FRONTEND_URL` (`https://beautybid.in`).
- It automatically permits `https://www.beautybid.in`.
- It dynamically permits Vercel preview branch domains (`*.vercel.app`).
- It supports `credentials: true` for authorization headers.

Ensure `FRONTEND_URL` in the backend environment matches your production domain without any trailing slash.

---

## 9. Prisma Migration & Seed Procedure

### Automated Migrations on Deploy
The backend build command automatically runs:
```bash
npm run prisma:deploy
```
This applies the committed migration `backend/prisma/migrations/20260910000000_init/migration.sql` to the production database using `DIRECT_URL`.

### One-Time Database Seeding (Initial Brands & Categories)
To populate initial Indian beauty brands (Minimalist, Forest Essentials, Kama Ayurveda, Plum, etc.) and categories:
1. Open the Render Shell (or Railway CLI) for the deployed backend service.
2. Run:
   ```bash
   npm run prisma:seed
   ```
3. Verify output reports:
   `✨ Seed completed successfully.`

---

## 10. Razorpay TEST Key Configuration

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. In the top bar, toggle the switch to **Test Mode** (confirm the orange "Test Mode" badge is displayed).
3. Navigate to **Account & Settings** -> **API Keys** -> **Generate Key**.
4. Copy the generated **Key ID** (`rzp_test_...`) and **Key Secret**.
5. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the backend hosting environment.
6. Set `VITE_RAZORPAY_KEY_ID` in the frontend hosting environment.

---

## 11. Razorpay Webhook Configuration

1. In Razorpay Dashboard (still in **Test Mode**), navigate to:
   **Account & Settings** -> **Webhooks** -> **Add New Webhook**.
2. **Webhook URL**: `https://api.beautybid.in/api/payments/webhook`  
   *(or `https://beautybid-api.onrender.com/api/payments/webhook` if not using custom domain)*
3. **Secret**: Enter a strong secret passphrase and set the same value in backend as `RAZORPAY_WEBHOOK_SECRET`.
4. **Active Events**: Select the following three required events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
5. Click **Save Webhook**.

---

## 12. Custom Domain & DNS Configuration (Cloudflare)

Configure the following DNS records in your domain registrar or Cloudflare DNS:

| Type | Name | Content / Target | Proxy Status | Purpose |
| :--- | :--- | :--- | :---: | :--- |
| **CNAME** | `@` (beautybid.in) | `cname.vercel-dns.com` | **Proxied** | Frontend Apex Domain |
| **CNAME** | `www` | `cname.vercel-dns.com` | **Proxied** | Frontend WWW Subdomain |
| **CNAME** | `api` | `beautybid-api.onrender.com` | **Proxied** | Backend API Subdomain |

### SSL/TLS Settings in Cloudflare
- SSL/TLS Encryption Mode: **Full (Strict)**.
- **Always Use HTTPS**: Enabled.
- **Minimum TLS Version**: TLS 1.2.
- **HSTS**: Enabled.

---

## 13. Health-Check Verification

Verify the deployed backend API using `curl`:

```bash
curl -i https://api.beautybid.in/api/health
```

**Expected Response (HTTP 200 OK)**:
```json
{
  "status": "healthy",
  "platform": "BeautyBid",
  "environment": "production",
  "timestamp": "2026-09-12T...",
  "uptimeSeconds": 42,
  "database": {
    "status": "connected",
    "latencyMs": 5
  },
  "currency": "INR",
  "disclaimer": "Rankings are based on verified promotional spend and do not represent product quality."
}
```

If the database is unreachable, the endpoint returns `HTTP 503 Service Unavailable` with `"status": "degraded"`.

---

## 14. Complete Production Smoke Test

Execute this 8-step smoke test after deployment:

1. **Mandatory Disclosure Verification**:
   Open `https://beautybid.in`. Confirm the legal disclosure banner is pinned at the top:
   *"Rankings are based on verified promotional spend and do not represent product quality or editorial recommendations."*
2. **Leaderboard Verification**:
   Confirm the leaderboard loads products ordered by verified spend (Rank #1 has the highest spend).
3. **Product Page Navigation**:
   Click on any product (e.g. Minimalist Niacinamide). Confirm product details, current rank, and public payment audit history load cleanly.
4. **Promotion Calculator Test**:
   Click **Promote This Product** or go to `/promote`. Select a target rank. Verify that the required payment amount is calculated deterministically:
   $$\text{required\_amount} = \text{target\_rank\_holder\_spend} + \text{minimum\_increment}$$
5. **Razorpay Checkout Modal (Test Mode)**:
   Click **Proceed to Promotion**. Confirm the Razorpay modal opens in Test Mode.
6. **Simulated Payment Execution**:
   - In Razorpay modal, select **Card**.
   - Card Number: `4111 1111 1111 1111`
   - Expiry: Any future date (e.g. `12/28`)
   - CVV: `123`
   - OTP: `123456`
7. **Webhook & Promotion Confirmation**:
   - Payment succeeds.
   - Razorpay delivers webhook to `/api/payments/webhook`.
   - Verified spend updates inside a PostgreSQL transaction.
   - Product claims the target rank on the public leaderboard.
8. **Admin Panel Verification**:
   - Navigate to `/login` and log in with admin credentials.
   - Access `/admin` to verify real-time promotional revenue, transaction list, and configurable minimum increment settings.

---

## 15. How to Switch from Razorpay TEST to LIVE Later

When business KYC and Razorpay account activation are complete:

1. In Razorpay Dashboard, toggle the switch from **Test Mode** to **Live Mode** (green badge).
2. Navigate to **Account & Settings** -> **API Keys** -> **Generate Live Key**.
3. Copy the live **Key ID** (`rzp_live_...`) and **Key Secret**.
4. In Razorpay Dashboard (Live Mode), navigate to **Webhooks** -> **Add New Webhook**:
   - URL: `https://api.beautybid.in/api/payments/webhook`
   - Active Events: `payment.captured`, `order.paid`, `payment.failed`
   - Generate a strong Live Webhook Secret.
5. Update Environment Variables:
   - **Backend Hosting (Render)**:
     - `RAZORPAY_KEY_ID`: `rzp_live_...`
     - `RAZORPAY_KEY_SECRET`: Live secret
     - `RAZORPAY_WEBHOOK_SECRET`: Live webhook secret
   - **Frontend Hosting (Vercel)**:
     - `VITE_RAZORPAY_KEY_ID`: `rzp_live_...`
6. Trigger a redeployment on both Render and Vercel.
7. Perform one live verification transaction (e.g. ₹10 promotion) to verify end-to-end live settlement.
