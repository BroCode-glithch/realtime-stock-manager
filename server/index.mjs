import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const port = Number(process.env.PORT ?? 3001);

const seedProducts = [
  { id: "p1", name: "Wireless Mouse", category: "Electronics", supplier: "TechCorp", quantity: 42, reorderLevel: 20, unitPrice: 24.99 },
  { id: "p2", name: "USB-C Cable", category: "Electronics", supplier: "TechCorp", quantity: 8, reorderLevel: 30, unitPrice: 9.99 },
  { id: "p3", name: "Mechanical Keyboard", category: "Electronics", supplier: "KeyMakers", quantity: 15, reorderLevel: 10, unitPrice: 89 },
  { id: "p4", name: "Notebook A5", category: "Stationery", supplier: "PaperCo", quantity: 120, reorderLevel: 40, unitPrice: 4.5 },
  { id: "p5", name: "Ballpoint Pen", category: "Stationery", supplier: "PaperCo", quantity: 280, reorderLevel: 100, unitPrice: 1.2 },
  { id: "p6", name: "Desk Lamp", category: "Office", supplier: "LumaWorks", quantity: 5, reorderLevel: 12, unitPrice: 34.5 },
  { id: "p7", name: "Office Chair", category: "Furniture", supplier: "SitWell", quantity: 90, reorderLevel: 15, unitPrice: 189 },
  { id: "p8", name: "Monitor 27\"", category: "Electronics", supplier: "ViewPlus", quantity: 22, reorderLevel: 8, unitPrice: 279 },
];

function generateDemandHistory() {
  const points = [];
  const now = Date.now();
  for (const product of seedProducts) {
    for (let i = 13; i >= 0; i -= 1) {
      const dayDate = new Date(now - i * 86400000);
      const day = `${dayDate.getMonth() + 1}/${dayDate.getDate()}`;
      points.push({
        productId: product.id,
        day,
        demand: Math.max(0, Math.round(5 + Math.random() * 12 + Math.sin(i / 2) * 3)),
      });
    }
  }
  return points;
}

function evalAlerts(products, demand) {
  const alerts = [];
  for (const product of products) {
    const recent = demand.filter((entry) => entry.productId === product.id).slice(-7);
    const avg = recent.reduce((total, entry) => total + entry.demand, 0) / Math.max(1, recent.length);
    const adaptiveThreshold = Math.max(product.reorderLevel, Math.round(avg * 3));
    if (product.quantity <= adaptiveThreshold) {
      alerts.push({
        id: `a-${product.id}-${Date.now()}-${randomUUID().slice(0, 8)}`,
        productId: product.id,
        productName: product.name,
        type: product.quantity <= product.reorderLevel ? "low_stock" : "reorder",
        message: `${product.name} at ${product.quantity} units. Avg demand ${avg.toFixed(1)}/day. Suggested reorder.`,
        timestamp: Date.now(),
        read: false,
      });
    } else if (product.quantity > adaptiveThreshold * 5 && product.quantity > 50) {
      alerts.push({
        id: `a-${product.id}-${Date.now()}-${randomUUID().slice(0, 8)}`,
        productId: product.id,
        productName: product.name,
        type: "overstock",
        message: `${product.name} overstocked at ${product.quantity} units (avg demand ${avg.toFixed(1)}/day).`,
        timestamp: Date.now(),
        read: false,
      });
    }
  }
  return alerts;
}

function createState() {
  const products = seedProducts.map((product) => ({ ...product }));
  const demand = generateDemandHistory();
  return {
    products,
    transactions: [],
    alerts: evalAlerts(products, demand),
    demand,
    staticBaseline: { stockouts: 18, excess: 24 },
  };
}

let state = createState();

function snapshot() {
  return {
    products: state.products,
    transactions: state.transactions,
    alerts: state.alerts,
    demand: state.demand,
    staticBaseline: state.staticBaseline,
  };
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function recalcAlerts() {
  state = { ...state, alerts: evalAlerts(state.products, state.demand) };
}

function applyTick() {
  const target = state.products[Math.floor(Math.random() * state.products.length)];
  if (!target) return;
  const consumed = Math.min(target.quantity, Math.floor(Math.random() * 3) + 1);
  const today = new Date();
  const day = `${today.getMonth() + 1}/${today.getDate()}`;
  const demand = [...state.demand];
  const index = demand.findIndex((entry) => entry.productId === target.id && entry.day === day);
  if (index >= 0) demand[index] = { ...demand[index], demand: demand[index].demand + consumed };
  else demand.push({ productId: target.id, day, demand: consumed });

  const products = state.products.map((product) =>
    product.id === target.id ? { ...product, quantity: Math.max(0, product.quantity - consumed) } : product
  );

  state = {
    ...state,
    products,
    demand: demand.slice(-500),
    alerts: [...evalAlerts(products, demand), ...state.alerts].slice(0, 100),
  };
}

function applyTransaction(body) {
  const { productId, qty, type } = body ?? {};
  const product = state.products.find((entry) => entry.id === productId);
  if (!product) return false;
  const delta = type === "out" ? -Math.abs(Number(qty) || 0) : Math.abs(Number(qty) || 0);
  const transaction = {
    id: `t-${randomUUID().slice(0, 8)}`,
    productId,
    productName: product.name,
    userId: "system",
    quantityChanged: delta,
    type,
    timestamp: Date.now(),
  };
  state = {
    ...state,
    products: state.products.map((entry) =>
      entry.id === productId ? { ...entry, quantity: Math.max(0, entry.quantity + delta) } : entry
    ),
    transactions: [transaction, ...state.transactions].slice(0, 200),
  };
  recalcAlerts();
  return true;
}

function applyProductCreate(body) {
  const nextProduct = {
    id: `p-${randomUUID().slice(0, 8)}`,
    name: body?.name ?? "",
    category: body?.category ?? "General",
    supplier: body?.supplier ?? "Unknown",
    quantity: Number(body?.quantity) || 0,
    reorderLevel: Number(body?.reorderLevel) || 0,
    unitPrice: Number(body?.unitPrice) || 0,
  };
  state = { ...state, products: [...state.products, nextProduct] };
  recalcAlerts();
}

function applyProductUpdate(id, body) {
  state = {
    ...state,
    products: state.products.map((product) => (product.id === id ? { ...product, ...body } : product)),
  };
  recalcAlerts();
}

function applyProductDelete(id) {
  state = {
    ...state,
    products: state.products.filter((product) => product.id !== id),
    transactions: state.transactions.filter((transaction) => transaction.productId !== id),
    demand: state.demand.filter((entry) => entry.productId !== id),
    alerts: state.alerts.filter((alert) => alert.productId !== id),
  };
  recalcAlerts();
}

const server = createServer(async (req, res) => {
  try {
    if (!req.url || !req.method) {
      res.writeHead(400);
      res.end();
      return;
    }

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "content-type",
      });
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

    if (req.method === "GET" && url.pathname === "/api/health") {
      json(res, 200, { ok: true, service: "realtime-inventory-api" });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/state") {
      json(res, 200, snapshot());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/tick") {
      applyTick();
      json(res, 200, snapshot());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/transactions") {
      const body = await readBody(req);
      if (!applyTransaction(body)) {
        json(res, 404, { error: "Product not found" });
        return;
      }
      json(res, 200, snapshot());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/products") {
      const body = await readBody(req);
      applyProductCreate(body);
      json(res, 200, snapshot());
      return;
    }

    if (req.method === "PATCH" && url.pathname.startsWith("/api/products/")) {
      const id = url.pathname.split("/").pop();
      const body = await readBody(req);
      if (!id) {
        json(res, 400, { error: "Missing product id" });
        return;
      }
      if (!state.products.some((product) => product.id === id)) {
        json(res, 404, { error: "Product not found" });
        return;
      }
      applyProductUpdate(id, body ?? {});
      json(res, 200, snapshot());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/alerts/read") {
      state = { ...state, alerts: state.alerts.map((alert) => ({ ...alert, read: true })) };
      json(res, 200, snapshot());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/reset") {
      state = createState();
      json(res, 200, snapshot());
      return;
    }

    if (req.method === "POST" && url.pathname.endsWith("/delete")) {
      const id = url.pathname.split("/")[3];
      if (!id) {
        json(res, 400, { error: "Missing product id" });
        return;
      }
      if (!state.products.some((product) => product.id === id)) {
        json(res, 404, { error: "Product not found" });
        return;
      }
      applyProductDelete(id);
      json(res, 200, snapshot());
      return;
    }

    json(res, 404, { error: "Not found" });
  } catch (error) {
    console.error(error);
    json(res, 500, { error: "Internal server error" });
  }
});

server.listen(port, () => {
  console.log(`Inventory API listening on http://127.0.0.1:${port}`);
});