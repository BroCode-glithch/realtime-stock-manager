# Smart Inventory Backend Handoff

This document defines what the backend team must build so the frontend can consume the system as an API-driven application.

## 1. Frontend Surfaces Already Implemented

The frontend currently includes these modules and expects backend support for them:

- Login / role-based access flow
- Dashboard with live inventory summary and alert count
- Full product listing table with code, color, price, status, current value, all-time in/out movement
- Stock In log
- Stock Out / Sold log
- Daily Sales report
- Alerts list and mark-as-read behavior
- Reports with CSV and PDF export
- Import page for bulk product upload
- Settings page for Sales Channels guide and channel controls
- Desktop sidebar and mobile bottom bar navigation

## 2. What The Backend Must Provide

The backend should be a separate codebase and expose a stable JSON API.

### Core responsibilities

- Persist users, products, transactions, alerts, demand history, sales channels, and audit events.
- Accept stock-in and stock-out transactions.
- Maintain a full inventory snapshot for frontend synchronization.
- Return daily sales aggregation and product movement totals.
- Support realtime updates through WebSocket or Socket.IO.
- Enforce role-based access control.
- Provide a seed/reset flow for testing.

## 3. Required Data Model

### Product

- `id`
- `name`
- `category`
- `supplier`
- `quantity`
- `reorderLevel`
- `unitPrice`
- `code`
- `color`
- `status` derived from quantity and reorder level

### Transaction

- `id`
- `productId`
- `productName`
- `userId`
- `quantityChanged`
- `type` = `in` | `out` | `adjust`
- `channelId` optional
- `timestamp`

### Alert

- `id`
- `productId`
- `productName`
- `type` = `low_stock` | `reorder` | `overstock`
- `message`
- `timestamp`
- `read`

### DemandPoint

- `productId`
- `day`
- `demand`

### SalesChannel

- `id`
- `name`
- `type` = `retail` | `online` | `marketplace` | `mobile`
- `enabled`
- `notes` optional

### User

- `id`
- `name`
- `email`
- `role` = `admin` | `manager` | `staff`

## 4. Required REST API

### System

- `GET /api/health`
- `GET /api/state`

### Products

- `GET /api/products`
- `GET /api/products/{id}`
- `POST /api/products`
- `PATCH /api/products/{id}`
- `DELETE /api/products/{id}`

### Transactions

- `POST /api/transactions`
- `GET /api/transactions`

### Alerts

- `GET /api/alerts`
- `POST /api/alerts/read`

### Reports

- `GET /api/reports/daily-sales`
- `GET /api/reports/inventory-summary`
- `GET /api/reports/performance`

### Sales Channels

- `GET /api/channels`
- `POST /api/channels`
- `PATCH /api/channels/{id}`
- `DELETE /api/channels/{id}`

### Admin / Testing

- `POST /api/reset`
- `POST /api/import`

## 5. Request And Response Requirements

The backend team should use JSON for all payloads.

### Product create/update payload

```json
{
  "name": "Wireless Mouse",
  "category": "Electronics",
  "supplier": "TechCorp",
  "quantity": 42,
  "reorderLevel": 20,
  "unitPrice": 18500,
  "code": "WM-001",
  "color": "Black"
}
```

### Transaction payload

```json
{
  "productId": "p1",
  "qty": 3,
  "type": "out",
  "channelId": "c2"
}
```

### Sales channel payload

```json
{
  "name": "Online Store (Web)",
  "type": "online",
  "enabled": true,
  "notes": "Primary ecommerce channel"
}
```

### Inventory snapshot response

```json
{
  "products": [],
  "transactions": [],
  "alerts": [],
  "demand": [],
  "staticBaseline": {
    "stockouts": 18,
    "excess": 24
  },
  "channels": []
}
```

## 6. Realtime Contract

The frontend should receive live updates from the backend through WebSocket or Socket.IO.

### Connection behavior

- On connect, authenticate with JWT.
- Send an initial snapshot event after auth.
- Push update events when products, transactions, alerts, or channels change.
- Keep the connection alive with ping/pong or heartbeat events.

### Required events

- `snapshot`
- `transaction`
- `product:update`
- `alert`
- `channel:update`
- `tick`
- `ping`
- `pong`

### Example event envelope

```json
{
  "event": "transaction",
  "payload": {
    "id": "t-001",
    "productId": "p1",
    "productName": "Wireless Mouse",
    "userId": "u-12",
    "quantityChanged": -3,
    "type": "out",
    "timestamp": 1780053300774
  }
}
```

## 7. Authentication And Roles

The frontend needs JWT-based auth.

### Required rules

- `admin` can manage everything.
- `manager` can manage products, approve inventory decisions, and view reports.
- `staff` can record stock movement and view their allowed pages.

### Backend should provide

- JWT login endpoint or test credentials.
- Role claim inside the token.
- 401 for missing token.
- 403 for insufficient role.

## 8. Reports Required By Frontend

The Daily Sales and Reports pages need these backend outputs:

- Revenue by day
- Units sold by day
- Revenue by product
- Stock-out rate
- Excess stock rate
- Current stock value
- Historical transactions

## 9. Error Format

Use a consistent error shape:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "quantity",
      "message": "Must be greater than 0"
    }
  ]
}
```

### Status codes

- `400` invalid request
- `401` unauthenticated
- `403` unauthorized role
- `404` not found
- `409` conflict
- `422` validation failure
- `500` unexpected error

## 10. Backend Deliverables

The backend team should return these artifacts:

- Final `openapi.yaml`
- Realtime contract document or `asyncapi.yaml`
- Seed data file
- DB migration / DDL scripts
- Dockerfile
- Environment variable list
- Postman collection or curl examples
- Sample JWTs or test users for each role
- `/api/reset` test support

## 11. Recommended Implementation Notes

- Use PostgreSQL if possible.
- Keep product, transaction, alert, demand, user, and channel data normalized.
- Use indexes on product id, transaction timestamp, channel id, and demand day.
- Emit realtime events after each successful write.
- Keep `/api/state` as the frontend sync endpoint.

## 12. Frontend Integration Expectations

The frontend will:

- fetch the initial snapshot on app load
- listen to realtime events for changes
- call REST endpoints for mutations
- refresh report charts from backend data
- render product table, stock logs, and sales metrics from API data

If the backend contract changes, the frontend team will need the updated OpenAPI file and event spec.
