// Remove createServer(...).listen(...) — Vercel handles the server lifecycle. Export a handler function — Vercel calls this whenever a request hits /api/....

import { randomUUID } from "node:crypto";

// --- State setup (same as your original) ---
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

// … keep your helper functions: generateDemandHistory, sanitizeAlertSettings, evalAlerts, createState, snapshot, applyTick, applyTransaction, etc.
// (no changes needed inside those functions)

let state = createState();

// --- Utility for reading body in serverless style ---
async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk; });
    req.on("end", () => {
      if (!data) return resolve(null);
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

// --- Vercel handler ---
export default async function handler(req, res) {
  try {
    const { method, url } = req;

    if (method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "content-type");
      return res.status(204).end();
    }

    // Routing
    if (method === "GET" && url === "/api/health") {
      return res.status(200).json({ ok: true, service: "realtime-inventory-api" });
    }

    if (method === "GET" && url === "/api/state") {
      return res.status(200).json(snapshot());
    }

    if (method === "POST" && url === "/api/tick") {
      applyTick();
      return res.status(200).json(snapshot());
    }

    if (method === "GET" && url === "/api/settings") {
      return res.status(200).json({ alertSettings: state.alertSettings });
    }

    if (method === "PATCH" && url === "/api/settings") {
      const body = await readBody(req);
      state = { ...state, alertSettings: sanitizeAlertSettings(body ?? {}) };
      recalcAlerts();
      return res.status(200).json({ alertSettings: state.alertSettings, snapshot: snapshot() });
    }

    if (method === "POST" && url === "/api/transactions") {
      const body = await readBody(req);
      if (!applyTransaction(body)) {
        return res.status(404).json({ error: "Product not found" });
      }
      return res.status(200).json(snapshot());
    }

    if (method === "POST" && url === "/api/products") {
      const body = await readBody(req);
      applyProductCreate(body);
      return res.status(200).json(snapshot());
    }

    if (method === "PATCH" && url.startsWith("/api/products/")) {
      const id = url.split("/").pop();
      const body = await readBody(req);
      if (!id) return res.status(400).json({ error: "Missing product id" });
      if (!state.products.some(p => p.id === id)) return res.status(404).json({ error: "Product not found" });
      applyProductUpdate(id, body ?? {});
      return res.status(200).json(snapshot());
    }

    if (method === "POST" && url === "/api/alerts/read") {
      state = { ...state, alerts: state.alerts.map(a => ({ ...a, read: true })) };
      return res.status(200).json(snapshot());
    }

    if (method === "POST" && url === "/api/reset") {
      state = createState();
      return res.status(200).json(snapshot());
    }

    if (method === "POST" && url.endsWith("/delete")) {
      const id = url.split("/")[3];
      if (!id) return res.status(400).json({ error: "Missing product id" });
      if (!state.products.some(p => p.id === id)) return res.status(404).json({ error: "Product not found" });
      applyProductDelete(id);
      return res.status(200).json(snapshot());
    }

    return res.status(404).json({ error: "Not found" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
