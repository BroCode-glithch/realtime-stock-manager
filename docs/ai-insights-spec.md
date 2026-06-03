# AI Insights — Full Specification & Backend Contract

> Module: **Intelligent Inventory — AI Insights**
> Audience: Node.js backend developer, frontend developer, project supervisor.
> Status: v1 spec (prototype-ready). Frontend prototype lives in this repo; backend is the Node.js server in `server/index.mjs`.

This document is the single source of truth for the AI layer of the system. It covers what the AI must do, how it must behave, the exact REST contracts the Node.js backend must expose, the data shapes, the prompts, the fallback rules (so the system still works if the AI provider is down), the security rules, and the environment variables / API keys required for deployment.

---

## 1. Product Goals (what the AI must do)

The AI layer adds **five capabilities** on top of the existing inventory CRUD + alerts:

| # | Capability | Purpose | Endpoint |
|---|---|---|---|
| 1 | Demand Forecasting | Predict next 7 / 14 / 30 day demand per SKU with confidence band | `POST /api/ai/forecast` |
| 2 | Reorder Recommendation Engine | What to buy, how much, when — with reasons | `POST /api/ai/recommendations` |
| 3 | Alert Intelligence | Upgrade threshold alerts to risk-ranked smart alerts | `POST /api/ai/alerts/score` |
| 4 | Manager Assistant (chat) | Natural-language Q&A grounded in the live inventory state | `POST /api/ai/chat` |
| 5 | Weekly Narrative Report | Auto-generated, role-scoped PDF/JSON summary | `POST /api/ai/weekly-summary` |

### Guardrails (non-negotiable)

1. **Recommend, never auto-execute.** No endpoint may create a purchase order without a human acceptance step.
2. **Every output must include `reasons[]`** — list the factors (current stock, forecast, lead time, safety stock, velocity, seasonality).
3. **Audit trail.** Every accepted/rejected recommendation is logged via `POST /api/ai/recommendations/:id/decision`.
4. **Fallback rules.** If the AI provider returns 4xx/5xx, timeout, or is unconfigured, the endpoint MUST return a deterministic rule-based answer with `source: "fallback"` and HTTP 200 — never 500.
5. **Role-based access.** Only `admin` and `manager` roles may call AI endpoints. `staff` receives `403`.
6. **PII minimization.** Never send customer data to the model. Send only product / stock / demand aggregates.

---

## 2. High-Level Architecture

```text
 ┌──────────────┐    HTTPS     ┌───────────────────────────┐    HTTPS    ┌──────────────────────┐
 │  React app   │ ───────────▶ │  Node.js API (Express)    │ ──────────▶ │  Lovable AI Gateway  │
 │ (AI Insights │              │  server/index.mjs         │             │ ai.gateway.lovable.dev│
 │   page)      │ ◀─────────── │  /api/ai/*  +  /api/*     │ ◀────────── │ (model = gemini-3…)  │
 └──────────────┘   JSON/SSE   └───────────────────────────┘   JSON/SSE  └──────────────────────┘
                                          │
                                          ▼
                                ┌────────────────────┐
                                │ PostgreSQL (later) │
                                │ in-memory now      │
                                └────────────────────┘
```

* Frontend never calls the AI provider directly. The Node.js backend is the only holder of `LOVABLE_API_KEY`.
* Heavy computation (forecast math, scoring) happens server-side so the same answer is reproducible for audits.

---

## 3. Environment Variables / API Keys

Add to the backend's `.env` (do **not** commit). All AI keys are server-only.

| Variable | Required | Purpose | Where to get it |
|---|---|---|---|
| `PORT` | no (default `3001`) | HTTP port | — |
| `LOVABLE_API_KEY` | **yes (primary)** | Auth header for Lovable AI Gateway | Lovable → Settings → Workspace → AI |
| `AI_MODEL_CHAT` | no (default `google/gemini-3-flash-preview`) | Chat / assistant / narrative model | — |
| `AI_MODEL_FORECAST` | no (default `google/gemini-3-flash-preview`) | Forecast reasoning model | — |
| `AI_PROVIDER_BASE_URL` | no (default `https://ai.gateway.lovable.dev/v1`) | Override for testing | — |
| `AI_TIMEOUT_MS` | no (default `20000`) | Per-request timeout before fallback | — |
| `AI_ENABLE_FALLBACK` | no (default `true`) | Allow deterministic fallback when provider fails | — |
| `JWT_SECRET` | yes | Validate Bearer tokens from the frontend | generate `openssl rand -hex 32` |
| `CORS_ORIGIN` | no (default `*` in dev) | Lock to deployed frontend in prod | — |

> If `LOVABLE_API_KEY` is missing, the AI endpoints still respond but every response carries `source: "fallback"` and `warnings: ["AI provider not configured"]`. The UI must surface this.

Header sent to the gateway (already implemented in this repo's pattern):
```
Lovable-API-Key: <LOVABLE_API_KEY>
X-Lovable-AIG-SDK: vercel-ai-sdk
Content-Type: application/json
```

---

## 4. Shared Data Shapes

```ts
type Confidence = "high" | "medium" | "low";

type ForecastPoint = { day: string; predicted: number; lower: number; upper: number };

type Forecast = {
  productId: string;
  horizonDays: 7 | 14 | 30;
  points: ForecastPoint[];
  meanDailyDemand: number;
  confidence: Confidence;
  reasons: string[];          // human-readable factors
  source: "ai" | "fallback";
};

type Recommendation = {
  id: string;                  // server-generated, used for audit
  productId: string;
  productName: string;
  action: "reorder" | "hold" | "reduce" | "promote";
  quantity: number;            // 0 if action !== "reorder"
  orderByDate: string;         // ISO date
  expectedStockoutDate: string | null;
  reasons: string[];
  priority: "critical" | "high" | "medium" | "low";
  estimatedLostSalesNaira: number;
  source: "ai" | "fallback";
};

type SmartAlert = {
  id: string;
  productId: string;
  type: "stockout_risk" | "overstock_risk" | "demand_spike" | "dead_stock";
  riskScore: number;           // 0-100
  horizonDays: number;
  message: string;
  reasons: string[];
  priority: "critical" | "high" | "medium" | "low";
};

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };
```

---

## 5. REST API Contract (Node.js)

All endpoints are JSON, prefixed `/api/ai`, require `Authorization: Bearer <jwt>` with role ∈ {`admin`, `manager`}.
On AI provider failure, return HTTP 200 with `source: "fallback"`.
On validation failure return 400 `{ error, details }`. On auth failure return 401/403.

### 5.1 `POST /api/ai/forecast`
Predict per-product demand.

Request:
```json
{
  "productIds": ["p2", "p6"],   // optional; omit for all
  "horizonDays": 14              // 7 | 14 | 30
}
```
Response:
```json
{
  "forecasts": [Forecast, ...],
  "generatedAt": 1733244000000,
  "source": "ai"
}
```

### 5.2 `POST /api/ai/recommendations`
Reorder / hold / reduce / promote recommendations.

Request:
```json
{ "productIds": ["p2"], "leadTimeDays": 3, "safetyStockDays": 4 }
```
Response:
```json
{ "recommendations": [Recommendation, ...], "source": "ai" }
```

### 5.3 `POST /api/ai/recommendations/:id/decision`
Audit trail. Required after a manager accepts/rejects.

Request:
```json
{ "decision": "accepted" | "rejected", "note": "string?" }
```
Response: the persisted audit row.

### 5.4 `GET /api/ai/recommendations/audit`
Returns last 200 decisions for the report.

### 5.5 `POST /api/ai/alerts/score`
Re-rank existing alerts by business impact.

Request:
```json
{ "alertIds": ["a-..."] }   // optional; omit to score all open alerts
```
Response: `{ "alerts": [SmartAlert, ...] }`

### 5.6 `POST /api/ai/chat`
Manager assistant. Stateless from server's POV — the client sends the full history.

Request:
```json
{
  "messages": [ChatMessage, ...],
  "includeData": ["products", "alerts", "transactions"]
}
```
Response (non-streaming default):
```json
{
  "reply": "string (markdown)",
  "citations": [{ "productId": "p2", "field": "quantity", "value": 8 }],
  "source": "ai"
}
```
SSE streaming variant: `POST /api/ai/chat/stream` returns `text/event-stream` with `data: {delta}` frames.

### 5.7 `POST /api/ai/weekly-summary`
Generate the narrative manager report.

Request:
```json
{ "rangeStart": "2026-05-27", "rangeEnd": "2026-06-03", "format": "json" | "markdown" }
```
Response:
```json
{
  "summary": { "stockoutRisks": [...], "overstockRisks": [...], "salesTrend": "...", "recommendedActions": [...] },
  "narrative": "markdown string",
  "source": "ai"
}
```

---

## 6. Fallback Algorithms (used when AI is unavailable)

These run server-side and produce the same shape as the AI responses so the UI doesn't branch.

### 6.1 Forecast — Exponential moving average
```
α = 0.4
EMA_t = α * demand_t + (1 - α) * EMA_{t-1}
predicted_d = round(EMA_last)
band       = ±max(2, 0.35 * EMA_last)   // wider = lower confidence
confidence = std_dev < 0.25 * mean ? "high" : std_dev < 0.6 * mean ? "medium" : "low"
```

### 6.2 Reorder recommendation
```
avgDaily   = mean(demand last 14 days)
daysCover  = quantity / max(avgDaily, 0.1)
reorderPt  = avgDaily * (leadTimeDays + safetyStockDays)
if quantity <= reorderPt:
  action   = "reorder"
  quantity = ceil(avgDaily * (leadTimeDays + safetyStockDays + 7) - quantity)
  priority = daysCover < leadTimeDays ? "critical" : "high"
elif quantity > avgDaily * 30 and avgDaily > 0:
  action   = "reduce" | "promote"
else:
  action   = "hold"
estimatedLostSalesNaira = max(0, (reorderPt - quantity)) * unitPrice
```

### 6.3 Alert scoring
`riskScore = clamp( 100 * (reorderPt - quantity) / max(reorderPt, 1) , 0, 100 )` for stockout-type; mirror for overstock.

### 6.4 Chat fallback
Return a templated answer summarizing the top 5 stockout-risk SKUs and top 5 overstock SKUs computed from rules.

---

## 7. Prompts (server-side, not user-editable)

### 7.1 System prompt (all AI endpoints)
```
You are the inventory intelligence engine for a Nigerian retail SMB.
Currency is Naira (₦). Always justify with concrete numbers from the provided context.
Never invent product names or SKUs. If data is insufficient, say so and ask for the missing field.
Return STRICT JSON matching the schema given in the user message — no prose outside JSON.
```

### 7.2 Forecast user prompt template
```
SCHEMA: { "forecasts": [{ "productId", "horizonDays", "points":[{"day","predicted","lower","upper"}], "meanDailyDemand", "confidence", "reasons":[] }] }

CONTEXT:
- horizonDays: {{horizon}}
- products: {{productsJson}}      // id, name, quantity, unitPrice
- demand_history (last 14d/SKU): {{demandJson}}

TASK: Predict daily demand for each product for the next {{horizon}} days.
Include a 90% interval (lower/upper). Confidence reflects variance.
Reasons should cite trend, weekday pattern, recent spike, or sparsity.
```

### 7.3 Recommendation user prompt template
```
SCHEMA: { "recommendations": [{ "productId","action","quantity","orderByDate","expectedStockoutDate","reasons","priority","estimatedLostSalesNaira" }] }

CONTEXT:
- products: {{productsJson}}
- forecasts: {{forecastsJson}}
- leadTimeDays: {{leadTime}}
- safetyStockDays: {{safety}}
- staticBaseline: {{baselineJson}}

TASK: For each product produce ONE recommendation. Action ∈ reorder|hold|reduce|promote.
Quantity 0 unless action=reorder. orderByDate = today + max(0, daysCover - leadTimeDays).
Reasons must list: current stock, forecast mean, lead time, safety stock, and the risk being avoided.
```

### 7.4 Chat system extension
```
You may answer questions about inventory using ONLY the supplied JSON context.
When citing a number, also append a citations[] entry with productId + field.
```

---

## 8. Database Tables (when PostgreSQL is wired)

```sql
CREATE TABLE ai_recommendations (
  id           UUID PRIMARY KEY,
  product_id   TEXT NOT NULL,
  payload      JSONB NOT NULL,     -- full Recommendation
  source       TEXT NOT NULL,      -- 'ai' | 'fallback'
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_recommendation_decisions (
  id                 UUID PRIMARY KEY,
  recommendation_id  UUID REFERENCES ai_recommendations(id) ON DELETE CASCADE,
  user_id            TEXT NOT NULL,
  decision           TEXT CHECK (decision IN ('accepted','rejected')),
  note               TEXT,
  decided_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_forecasts (
  id           UUID PRIMARY KEY,
  product_id   TEXT NOT NULL,
  horizon_days INT NOT NULL,
  payload      JSONB NOT NULL,
  source       TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_chat_messages (
  id           UUID PRIMARY KEY,
  user_id      TEXT NOT NULL,
  thread_id    UUID NOT NULL,
  role         TEXT NOT NULL,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON ai_recommendations (product_id, created_at DESC);
CREATE INDEX ON ai_chat_messages (thread_id, created_at);
```

---

## 9. Frontend "AI Insights" Page (design contract)

Route: `/_app/ai-insights`. Tabs:
1. **Forecast** — line chart per selected SKU + confidence band, horizon switcher (7/14/30).
2. **Recommendations** — sortable table (Priority, SKU, Action, Qty, Order-by, Reason). Each row has Accept / Reject buttons → calls `/decision`.
3. **Smart Alerts** — list grouped by priority with risk score bar.
4. **Assistant** — chat composer; quick-prompt chips ("Risky SKUs this week", "Top 10 slow movers", "Why is X overstocked?").
5. **Weekly Report** — "Generate" button → markdown render + "Export PDF" (reuses existing jsPDF setup).

Empty / fallback states must show the badge **"Source: rule-based fallback"** when `source === "fallback"`.

---

## 10. Build Order (practical)

1. `POST /api/ai/forecast` with EMA fallback (no AI yet). Wire chart tab.
2. `POST /api/ai/recommendations` with rules + decision audit endpoint.
3. Add Lovable AI Gateway call; flip `source: "fallback"` → `"ai"` automatically.
4. Smart alert scoring + UI badge.
5. Chat endpoint (non-streaming first, SSE second).
6. Weekly narrative.
7. PostgreSQL persistence for audit + chat threads.

---

## 11. Security checklist

* [ ] JWT validated on every `/api/ai/*` request.
* [ ] Role check: only `admin` / `manager`.
* [ ] Rate limit: 30 req/min/user on chat, 10 req/min on forecast.
* [ ] Input validation with Zod (`productIds` length ≤ 200, `messages` length ≤ 40, message content ≤ 4000 chars).
* [ ] No PII in prompts. Strip customer fields server-side.
* [ ] Log only request id + user id + latency + token usage, never prompt content in production.
* [ ] CORS locked to deployed frontend origin in prod.
* [ ] All recommendations require human acceptance before any downstream PO system is called (out of v1 scope).
* [ ] Secrets in environment, never in repo.

---

## 12. Error contract

```json
{ "error": "string code", "message": "human", "details": [{ "field": "...", "message": "..." }] }
```
Codes: `unauthorized`, `forbidden`, `validation_failed`, `provider_unavailable` (only if fallback disabled), `rate_limited`, `internal_error`.

---

## 13. Handoff checklist for the Node.js dev

1. Pull this repo, run `node server/index.mjs` — confirm `/api/health` returns ok.
2. Read sections 4, 5, 6, 7 of this doc.
3. Add `LOVABLE_API_KEY` to `.env`.
4. Implement endpoints in the order of Section 10; copy fallback formulas from Section 6 verbatim.
5. Add Zod validation per Section 11.
6. Wire the audit table per Section 8 when PostgreSQL is connected.
7. Open a PR; supervisor reviews against this spec.

— End of spec —
