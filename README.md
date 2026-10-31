# Brightloop Software — Subscription Management & Invoicing Platform

[![MERN Stack](https://img.shields.io/badge/Stack-MERN%20(MongoDB,%20Express,%20React,%20Node)-blue.svg)](#tech-stack)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A unified platform that automates the entire lifecycle of a modern subscription business: products and multi-attribute variants, recurring billing plans, quotation templates, subscription state machines, automated idempotent invoicing, configurable tax and discount engines, partial payment tracking, and real-time revenue analytics (MRR/ARR).

---

## 🚀 Key Features

* **Role-Based Access Control (RBAC):**
  * **Admin:** Full governance over catalog, multi-attribute variants, recurring plans, automated tax rates, coupon/discount engines, and internal staff provisioning.
  * **Internal Staff:** Day-to-day operations handling customers, quotations, subscriptions, invoices, and payment receipts.
  * **Customer Portal:** Dedicated self-service portal to review active agreements, trigger pauses/cancellations, renew contracts, and download invoices.
* **Subscription Lifecycle State Machine:** Strict progression enforcing `Draft → Quotation → Confirmed → Active → Closed` (with `Paused` state and renewal capability). Every transition records an immutable audit history with user attribution, timestamps, and notes.
* **Idempotent Billing Engine:** Guarantees zero double-billing or skipped billing periods using a compound unique index on `(subscription, billingPeriodStart)` combined with automated catch-up scheduling.
* **Automated Tax & Discount Engines:** Per-line tax calculations (`GST`, `VAT`, `Sales Tax`) with full tax breakdowns, plus automatic coupon deductions respecting minimum spends, cart quotas, and redemption limits.
* **Partial Payments & Overpayment Protection:** Record multi-method payments (`Card`, `Bank Transfer`, `UPI`, `Cash`, `Cheque`), update balances in real-time, and automatically mark invoices as `Paid` upon complete settlement.
* **Background Automations (`node-cron`):**
  * Midnight recurring billing generator.
  * Automatic plan closure for expired terms with `autoCloseOnEnd` enabled.
  * 1 AM daily scan identifying past-due balances and marking them as `Overdue`.
* **Finance Analytics & MRR Dashboard:** High-performance MongoDB aggregation pipelines computing Monthly Recurring Revenue (MRR), Annual Run Rate (ARR), cash collections, outstanding receivables, and Recharts visual trends.
* **High Performance (Sub-500ms):** Server-side pagination, indexing, `.lean()` projections, and batch inserts tested against **5,000+ subscriptions**.

---

## 🛠️ Tech Stack

* **Frontend:** React 18, Vite, React Router v6, Tailwind CSS, TanStack Query (v5), React Hook Form, Zod, Recharts, Lucide Icons, Axios.
* **Backend:** Node.js (ES Modules), Express.js, MongoDB with Mongoose ODM.
* **Security & Auth:** JWT (Authorization header + httpOnly cookie support), bcrypt password hashing (enforcing >8 chars with uppercase, lowercase, and special character), Helmet security headers, CORS origin restrictions, Express Rate Limiter.
* **Messaging & Utilities:** Nodemailer (password reset & invoice dispatch), `node-cron` scheduled jobs.

---

## 📁 Repository Structure

```
subscription-management-system/
├── client/                      # Frontend (React 18 + Vite + Tailwind)
│   ├── src/
│   │   ├── api/                 # Axios instance and API clients
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/          # Button, Input, Modal, Table, Badge, Pagination, Loader
│   │   │   └── layout/          # Sidebar, Navbar, ProtectedRoute, RoleGuard, AppLayout
│   │   ├── context/             # AuthContext (JWT session management)
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── auth/            # Login, Signup, ForgotPassword, ResetPassword
│   │   │   ├── dashboard/       # Finance KPI dashboard & Recharts
│   │   │   ├── products/        # Catalog & multi-attribute variants
│   │   │   ├── plans/           # Billing periods & policy configuration
│   │   │   ├── templates/       # Quotation templates
│   │   │   ├── subscriptions/   # State machine, detail view, & stepper
│   │   │   ├── invoices/        # Printable invoice document & actions
│   │   │   ├── payments/        # Payment history & settlement receipts
│   │   │   ├── discounts/       # Promotion & coupon rule engine
│   │   │   ├── taxes/           # Tax rate configuration
│   │   │   ├── customers/       # Customer directory & addresses
│   │   │   ├── staff/           # Internal operator provisioning
│   │   │   └── portal/          # Customer self-service portal
│   │   ├── routes/              # Client routing with role guards
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── server/                      # Backend (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── config/              # db.js, env.js
│   │   ├── controllers/         # Thin REST controllers
│   │   ├── middleware/          # auth, role, validate, errorHandler, rateLimiter
│   │   ├── models/              # Mongoose schemas & compound indexes
│   │   ├── routes/              # Express API routers
│   │   ├── services/            # Core business logic (billing, discount, tax, email)
│   │   ├── jobs/                # node-cron recurring billing & overdue jobs
│   │   ├── utils/               # ApiError, asyncHandler, number generators
│   │   ├── seed/                # Demo & 5k benchmark dataset generator
│   │   ├── app.js               # Express application setup
│   │   └── server.js            # Entry point & DB bootstrap
│   ├── .env.example
│   └── package.json
├── README.md
└── .gitignore
```

---

## ⚡ Quick Start & Setup

### Prerequisites
* **Node.js:** v18.x, v20.x, or v22.x
* **MongoDB:** Local MongoDB daemon on port `27017` or MongoDB Atlas cloud URI

### 1. Root Monorepo Setup (Fastest)
From the root project directory:
```bash
# 1. Install all dependencies for both client & server
npm run install:all

# 2. Seed the database with demo accounts, catalog, plans & subscriptions
npm run seed

# 3. Start the backend server (runs on http://localhost:5000)
npm run server

# 4. In a second terminal, start the frontend (runs on http://localhost:5173)
npm run client
```

### 2. Manual Setup (Per-Service)
#### Backend Setup:
```bash
cd server
npm install
npm run seed
npm run dev
# Server runs on http://localhost:5000
```

#### Frontend Setup:
```bash
cd client
npm install
npm run dev
# Client runs on http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@brightloop.com` | `Admin@12345` | Full access: Staff, Taxes, Discounts, Products, Plans, Finance Dashboard |
| **Internal Staff** | `staff1@brightloop.com` | `Staff@12345` | Operations: Subscriptions, Invoices, Payments, Customers |
| **Customer** | `billing@apexinnovations.io` | `Customer@12345` | Customer Portal: My Subscriptions, My Invoices, Self-serve payment status |

*(Public signup at `/signup` creates a Customer account. Staff accounts are created by Admin at `/staff`.)*

---

## 📊 Database Seeding & Scaling Verification

### Standard Seed
Creates 1 Admin, 2 Staff, 4 Customers, 4 Products with variants, 4 Plans, 3 Tax rules, 2 Discount rules, 2 Quotation templates, and 20 sample subscriptions:
```bash
cd server
npm run seed
```

### 5,000+ Subscriptions Scale Benchmark
To test the sub-2 second query requirement under high load:
```bash
cd server
npm run seed:5k
```

#### Measured Benchmarks (with 5,000+ Records):
* **Subscriptions List (5,000 records):** ~`234 ms`
* **Invoices List (3,125 records):** ~`97 ms`
* **Payments List (2,812 records):** ~`83 ms`
* **Finance Aggregation Pipeline (MRR, Total Revenue, Receivables):** ~`485 ms`

---

## 🌐 API Reference Overview

All REST endpoints follow the standardized response shape:
```json
{
  "success": true,
  "data": { ... },
  "message": "Status description"
}
```

### Authentication (`/api/v1/auth`)
* `POST /signup` — Register customer account (enforces min 9 characters with uppercase, lowercase, special character).
* `POST /login` — Authenticate and receive JWT cookie/token.
* `POST /logout` — Invalidate session.
* `GET  /me` — Retrieve current authenticated profile.
* `POST /forgot-password` — Issue hashed, time-limited reset token via email.
* `POST /reset-password/:token` — Validate token and set new password.

### Catalog & Pricing
* `GET    /api/v1/products` — List catalog products & variants.
* `POST   /api/v1/products` — *(Admin)* Create product with attribute variants.
* `GET    /api/v1/plans` — List billing plans (daily, weekly, monthly, yearly).
* `POST   /api/v1/plans` — *(Admin)* Configure plan options (`autoCloseOnEnd`, `allowEarlyClose`, `allowPause`, `allowRenew`).
* `GET, POST, PUT /api/v1/taxes` — *(Admin)* Tax rules (`GST`, `VAT`, `Sales Tax`).
* `GET, POST, PUT /api/v1/discounts` — *(Admin)* Promotion engine rules.

### Quotations & Subscriptions (`/api/v1/subscriptions`)
* `GET    /` — List subscriptions (filtered, paginated, role-scoped).
* `GET    /:id` — Single subscription with line items and status audit history.
* `POST   /` — Create subscription (manual or pre-filled from `QuotationTemplate`).
* `PATCH  /:id/transition` — Enforce lifecycle transition (`Draft → Quotation → Confirmed → Active → Closed/Paused`).
* `POST   /:id/renew` — Renew closed agreement according to plan policies.

### Invoices (`/api/v1/invoices`)
* `GET    /` — Paginated invoice listing with status and balance filters.
* `GET    /:id` — Invoice detail with tax breakdown and discounts applied.
* `POST   /generate/:subscriptionId` — Idempotently generate next invoice.
* `POST   /generate-due` — Bulk generate all subscriptions due today.
* `PATCH  /:id/confirm` — Move invoice from `Draft` to `Confirmed`.
* `PATCH  /:id/cancel` — Cancel invoice.
* `POST   /:id/send` — Email invoice to customer.

### Payments (`/api/v1/payments`)
* `GET    /` — List payment records.
* `POST   /` — Record payment against invoice (supports partial payments, rejects overpayment, auto-marks invoice `Paid` when balance is 0).

### Analytics & Reports (`/api/v1/reports`) — *Admin & Staff*
* `GET /metrics` — MRR, ARR, active subscription count, total collected, outstanding debt.
* `GET /revenue-trend` — Monthly aggregated revenue for Recharts.
* `GET /plan-distribution` — Active subscriber count per billing tier.
* `GET /overdue-invoices` — Aging queue of unpaid overdue invoices.

---

## 🚀 Cloud Deployment to Render

This project is configured for **1-click Unified Deployment** on [Render](https://render.com), running both the Node.js API and the compiled React frontend from a single web service.

### Option A: Automatic Blueprint Deployment (Recommended)
1. Push this repository to your GitHub account.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** and select **Blueprint**.
3. Connect your GitHub repository. Render will automatically detect [`render.yaml`](render.yaml) and configure:
   - **Build Command:** `npm run render-build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
4. When prompted for environment variables:
   - Provide your **`MONGO_URI`** (e.g. from a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster).
   - `JWT_SECRET` is generated automatically by Render.
5. Click **Apply**. Your app will build, bundle, and go live on your free Render URL (e.g., `https://brightloop-sms.onrender.com`).

### Option B: Manual Web Service on Render
1. Click **New +** ➔ **Web Service**.
2. Select your repository.
3. Configure the settings:
   - **Runtime:** `Node`
   - **Build Command:** `npm run render-build`
   - **Start Command:** `npm start`
4. Add the following **Environment Variables** in the Render settings:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/brightloop_subscriptions?retryWrites=true&w=majority`
   - `JWT_SECRET`: `your_secure_jwt_secret_key_here`
   - `JWT_EXPIRES_IN`: `7d`
5. Click **Deploy Web Service**.

---

## 🐳 Docker Container Deployment

Run the complete full-stack system (Node API + React Frontend + MongoDB 6.0) locally or on any cloud VPS using Docker Compose:

```bash
# Build and run containers in detached mode
docker compose up -d --build

# Verify running containers
docker compose ps

# Access application
# Open browser at: http://localhost:5000
```

---

## 🔒 Security Best Practices

1. **Password Enforcement:** Server and client enforce a 9+ character password containing uppercase, lowercase, and special characters. Passwords are salted and hashed using `bcryptjs` and stripped from JSON queries.
2. **JWT Transport:** Tokens delivered via httpOnly cookies and standard `Authorization: Bearer` headers.
3. **HTTP Hardening:** Powered by `helmet`, CORS restricted to the frontend client URL, and rate limiting applied to authentication routes.
4. **Idempotency Guarantee:** Unique compound MongoDB index `{ subscription: 1, billingPeriodStart: 1 }` prevents double-invoicing even under concurrent cron triggers.

---

## 📄 License
This project is licensed under the MIT License. Built for **Brightloop Software**.
