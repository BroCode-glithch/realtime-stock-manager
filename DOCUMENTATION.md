# Intelligent Real-Time Inventory Management System

**Developer:** Emmanuel — Final-year project
**Duration:** Two-week agile sprint prototype
**Status:** Functional prototype with adaptive decision support

---

## 1. Project Overview

A web-based inventory platform that monitors stock levels in real time and
provides adaptive reorder recommendations using a moving-average demand
algorithm. The prototype demonstrates how data-driven decision support
outperforms static reorder thresholds in retail / small-warehouse scenarios.

### 1.1 Objectives
- Continuously track stock levels and transactions.
- Detect demand trends per SKU and adjust reorder thresholds adaptively.
- Surface low-stock, reorder, and overstock alerts to staff.
- Provide exportable reports comparing adaptive vs. static performance.

### 1.2 Scope
- Authentication with role-based access (Admin / Manager / Staff).
- Inventory CRUD with audit trail.
- Real-time simulation loop (start/stop + adjustable speed).
- Alerts with category filters.
- CSV import for inventory initialization.
- CSV and PDF report exports.
- Mobile-first responsive UI with desktop sidebar.

---

## 2. Architecture

```
┌────────────────────┐      HTTP/JSON       ┌─────────────────────┐
│   React Frontend   │  ─────────────────►  │  Node.js REST API   │
│ (TanStack Start +  │                       │  (server/index.mjs) │
│  Zustand store)    │  ◄─── snapshots ───  │  in-memory state    │
└────────────────────┘                       └─────────────────────┘
        │                                              │
        └── simulation tick every N seconds ───────────┘
```

- **Frontend:** React 19, TanStack Router, TailwindCSS v4, Zustand, Recharts, jsPDF.
- **Backend (optional):** Node.js HTTP server (`server/index.mjs`) exposing REST
  endpoints for products, transactions, alerts, and simulation ticks. When the
  backend is unreachable, the Zustand store falls back to local state so the
  prototype keeps working in browser-only mode.
- **Database (planned for production):** PostgreSQL (schema in §5).

### 2.1 Run the backend
```bash
npm run api:dev      # starts http://127.0.0.1:3001
```
Vite proxies `/api/*` to the Node server.

---

## 3. Phase Plan (per spec)

| Phase | Deliverable | Status |
|------|-------------|--------|
| 1. Requirement Analysis | SRS (§4) | ✅ |
| 2. System Design | ER diagram, architecture, UI mockups | ✅ |
| 3. Implementation | React + Node prototype | ✅ |
| 4. Testing | Manual + simulated demand | ✅ |
| 5. Deployment | Dockerized (template) | 🚧 |
| 6. Evaluation | Adaptive vs Static reports | ✅ |

---

## 4. Software Requirements Specification (Summary)

### 4.1 Functional
| ID | Requirement |
|----|-------------|
| FR-1 | User authentication (role-based: Admin/Manager/Staff) |
| FR-2 | Inventory CRUD |
| FR-3 | Real-time monitoring (simulation tick + live UI) |
| FR-4 | Adaptive reorder support (moving-average demand) |
| FR-5 | Reports + analytics (CSV, PDF) |
| FR-6 | Low-stock / reorder / overstock notifications |
| FR-7 | Audit trail (transactions log) |
| FR-8 | CSV bulk import for inventory initialization |

### 4.2 Non-Functional
- Performance: tick interval configurable 0.5–10s.
- Usability: mobile-first, desktop sidebar, accessible color tokens.
- Security: JWT-style mock auth (extend with bcrypt + HTTPS in production).
- Maintainability: modular routes, single Zustand store, typed.
- Portability: Vite build deploys to any static host; backend Dockerizable.

---

## 5. Database Schema (PostgreSQL — production target)

```sql
CREATE TABLE Users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  role VARCHAR(50),
  password_hash TEXT
);

CREATE TABLE Products (
  product_id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  category VARCHAR(50),
  supplier VARCHAR(100),
  quantity INT,
  reorder_level INT,
  unit_price DECIMAL(10,2)
);

CREATE TABLE Transactions (
  transaction_id SERIAL PRIMARY KEY,
  product_id INT REFERENCES Products(product_id),
  user_id INT REFERENCES Users(user_id),
  quantity_changed INT,
  transaction_type VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE DemandPatterns (
  pattern_id SERIAL PRIMARY KEY,
  product_id INT REFERENCES Products(product_id),
  avg_demand DECIMAL(10,2),
  trend_status VARCHAR(50),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Alerts (
  alert_id SERIAL PRIMARY KEY,
  product_id INT REFERENCES Products(product_id),
  user_id INT REFERENCES Users(user_id),
  alert_type VARCHAR(50),
  message TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. REST API (Node.js backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service health probe |
| GET | `/api/state` | Full snapshot (products, alerts, demand) |
| POST | `/api/tick` | Run one simulation step |
| POST | `/api/transactions` | Record IN/OUT transaction |
| POST | `/api/products` | Create product |
| PATCH | `/api/products/:id` | Update product |
| POST | `/api/products/:id/delete` | Delete product |
| POST | `/api/alerts/read` | Mark all alerts read |
| POST | `/api/reset` | Reseed demo state |

---

## 7. Adaptive Decision Algorithm

For each product:
1. Compute `avgDemand` = mean of last 7 days of consumption.
2. `adaptiveThreshold = max(staticReorderLevel, round(avgDemand × 3))`.
3. If `stock ≤ staticReorderLevel` → **low_stock** alert.
4. Else if `stock ≤ adaptiveThreshold` → **reorder** alert.
5. Else if `stock > adaptiveThreshold × 5` and `stock > 50` → **overstock** alert.

This makes the reorder boundary expand during demand surges and contract when
demand softens, in contrast to a fixed reorder level.

---

## 8. Features Implemented

- ✅ Mock JWT auth + RBAC gating
- ✅ Inventory CRUD with search
- ✅ Live simulation with **start/stop + speed slider** (0.5s–10s)
- ✅ Alerts with **low_stock / reorder / overstock filters**
- ✅ **CSV import** screen with template + preview + validation
- ✅ Reports with **CSV and PDF export**
- ✅ Desktop sidebar + mobile bottom navigation
- ✅ Audit trail of transactions

---

## 9. Testing Notes

- **Unit (manual):** CRUD round-trips, alert generation per state mutation.
- **Integration:** Frontend gracefully degrades when `/api/*` unreachable.
- **System / simulation:** Adjusted tick to 0.5s; verified reorder alerts fire
  faster than static baseline on rapid consumption.
- **Metrics:** Stock-out % and excess stock % rendered on the Reports page,
  compared to a static baseline of 18% / 24%.

---

## 10. Deployment Plan

- Backend → Docker image, deployable on Render/Heroku.
- Frontend → Vite build, deployable on Vercel/Netlify/Cloudflare Pages.
- Database → managed Postgres (Neon / Render).
- CI → GitHub Actions running `bun run build` and lint.

---

## 11. Two-Week Sprint Recap

| Day | Activity |
|-----|----------|
| 1–2 | Requirement analysis, design |
| 3–7 | Frontend + store + backend skeleton |
| 8–10 | Real-time tick, adaptive algorithm, alerts |
| 11–12 | Reports, CSV import, PDF export |
| 13–14 | Documentation, polish, deployment |
