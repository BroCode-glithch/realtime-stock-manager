import { createFileRoute } from "@tanstack/react-router";
import type { ComponentType } from "react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useStore } from "../../lib/inventory-store";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Layers3,
  LineChart,
  Shield,
  TriangleAlert,
} from "lucide-react";

export const Route = createFileRoute("/_app/guide")({
  component: SystemGuide,
  head: () => ({ meta: [{ title: "System Guide — Smart Inventory" }] }),
});

function SystemGuide() {
  const role = useStore((s) => s.user?.role ?? "staff");

  const sections = {
    admin: {
      title: "Admin",
      summary: "Full operational control across products, channels, reports, imports, and recovery actions.",
      canDo: [
        "Create, edit, and delete products",
        "Manage sales channels",
        "Import and restore seeded data",
        "Review dashboard, sales, alerts, and reports",
        "Approve cleanup and recovery actions",
      ],
      limits: ["Backend permissions remain the final authority."],
    },
    manager: {
      title: "Manager",
      summary: "Operational oversight with reporting and inventory coordination, but without destructive recovery control.",
      canDo: [
        "Create and edit products",
        "Stock in and stock out items",
        "View reports and trends",
        "Enable or disable channels",
        "Use import for structured inventory onboarding",
      ],
      limits: ["Cannot delete products.", "Cannot reset the system state."],
    },
    staff: {
      title: "Staff",
      summary: "Frontline inventory and sales operations with minimal access to admin-level controls.",
      canDo: [
        "Record stock-in entries",
        "Record stock-out sales",
        "View dashboard, products, alerts, and profile",
        "Choose from active sales channels",
      ],
      limits: ["Cannot create, edit, or delete products.", "Cannot manage channels or reports."],
    },
  } as const;

  const current = sections[role as keyof typeof sections] ?? sections.staff;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Boxes className="h-4 w-4" /> System overview
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">How the system works</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Smart Inventory is built as a role-aware operations platform. It keeps a single source of truth for products,
            stock movements, alerts, channels, and reporting, while letting the UI remain responsive through cached
            state and realtime updates.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Product master", "Each item has a code, color, price, quantity, and reorder threshold."],
              ["Live transactions", "Stock in, stock out and adjustments are recorded with user, channel, and timestamp."],
              ["Alert engine", "Low-stock, reorder and overstock alerts are generated from current inventory state."],
              ["Reporting", "Charts and summaries compare daily results, stock value, and trend performance."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-border bg-secondary/30 p-4">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Shield className="h-4 w-4" /> Your role today
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">{current.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{current.summary}</p>
          <div className="mt-4 space-y-3">
            <BlockList title="What you can do" items={current.canDo} icon={CheckCircle2} tone="success" />
            <BlockList title="Key limits" items={current.limits} icon={TriangleAlert} tone="warning" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">Role-based access</Badge>
            <Badge variant="secondary">Realtime sync</Badge>
            <Badge variant="secondary">Backend-driven</Badge>
          </div>
        </Card>
      </section>

      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <ArrowRight className="h-4 w-4" /> System flow
        </div>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">Step-by-step flow</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Smart Inventory follows a clear journey from login to action to insight. Every screen reads from the same backend state,
          and user changes cascade through transactions, alerts, and reports so the whole system stays aligned.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["1", "Login", "Sign in and retrieve a secure session token, user profile, and role permissions."],
            ["2", "Sync state", "Load products, transactions, alerts, channels, and dashboard summaries."],
            ["3", "Operate", "Record stock movements, update products, manage channels, or apply imports."],
            ["4", "Observe", "Dashboard charts, reports, and alerts refresh automatically based on the same source data."],
          ].map(([step, title, desc]) => (
            <div key={step} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step {step}</span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{step}</span>
              </div>
              <p className="mt-3 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Layers3 className="h-4 w-4" /> Architecture diagram
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The app is designed as a frontend-backed system with realtime updates. The browser keeps a cache of the latest state,
          while the backend authorizes actions, stores committed transactions, and regenerates alerts and reports.
        </p>
        <div className="mt-6 overflow-x-auto rounded-3xl border border-border bg-card p-4">
          <svg viewBox="0 0 900 320" className="h-[320px] w-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L10,5 L0,10" fill="#8b5cf6" />
              </marker>
            </defs>
            <rect x="36" y="40" width="240" height="80" rx="18" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1.5" />
            <text x="158" y="70" textAnchor="middle" fontSize="14" fontWeight="700" fill="#4f46e5">User Interface</text>
            <text x="158" y="90" textAnchor="middle" fontSize="12" fill="#6b7280">Dashboard, products, stock, alerts</text>

            <rect x="330" y="40" width="240" height="80" rx="18" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
            <text x="450" y="70" textAnchor="middle" fontSize="14" fontWeight="700" fill="#111827">App State</text>
            <text x="450" y="90" textAnchor="middle" fontSize="12" fill="#6b7280">Cached data, auth, realtime events</text>

            <rect x="624" y="40" width="240" height="80" rx="18" fill="#ecfdf5" stroke="#86efac" strokeWidth="1.5" />
            <text x="744" y="70" textAnchor="middle" fontSize="14" fontWeight="700" fill="#166534">Backend API</text>
            <text x="744" y="90" textAnchor="middle" fontSize="12" fill="#4b5563">Products, transactions, alerts, reports</text>

            <path d="M276 80 L330 80" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#arrow)" />
            <path d="M330 100 L276 100" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#arrow)" />
            <path d="M570 80 L624 80" stroke="#22c55e" strokeWidth="2" markerEnd="url(#arrow)" />
            <path d="M624 100 L570 100" stroke="#22c55e" strokeWidth="2" markerEnd="url(#arrow)" />

            <rect x="330" y="170" width="240" height="80" rx="18" fill="#fff7ed" stroke="#fdba74" strokeWidth="1.5" />
            <text x="450" y="200" textAnchor="middle" fontSize="14" fontWeight="700" fill="#c2410c">Realtime Sync</text>
            <text x="450" y="220" textAnchor="middle" fontSize="12" fill="#7c2d12">WebSocket events, immediate UI updates</text>

            <path d="M450 120 L450 170" stroke="#f97316" strokeWidth="2" markerEnd="url(#arrow)" />
            <path d="M450 250 L450 260" stroke="#f97316" strokeWidth="2" markerEnd="url(#arrow)" />
          </svg>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["UI layer", "Handles forms, product lookup, transaction entry, and alerts feedback."],
              ["State layer", "Caches records locally and redraws the app when new data arrives."],
              ["Server layer", "Validates requests, stores records, and refreshes alerts and reports."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-border bg-secondary/20 p-3">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <LineChart className="h-4 w-4" /> Charts and reports
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The dashboard and reports pages read from the same backend source, but surface complementary insights.
            Changes in stock levels and sales immediately flow into chart totals and performance metrics.
          </p>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ["Dashboard trend", "Shows the last 14 days of demand across all SKUs."],
              ["Revenue breakdown", "Sales are displayed by product, channel, and daily totals."],
              ["Alert correlation", "Alerts reflect current stock versus demand and reorder thresholds."],
              ["Value summary", "Current stock value, total sales and movement totals are visible in one place."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-xl border border-border p-3">
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-5">{desc}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <ClipboardList className="h-4 w-4" /> Daily operating guide
          </div>
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="a1">
              <AccordionTrigger>Start of day</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                <p>Open Dashboard and confirm the active alerts count and current stock value.</p>
                <p>Review channel status; disabled channels should not be used for sales.</p>
                <p>Identify priority reorder items before the first transaction.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="a2">
              <AccordionTrigger>During operations</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                <p>Record stock-in for received inventory with the correct product and quantity.</p>
                <p>Record stock-out sales under the right channel and confirm the item details.</p>
                <p>If a product changes price, update it in the product dialog so reports remain accurate.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="a3">
              <AccordionTrigger>End of day</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                <p>Run the report summary to compare actual sales versus inventory movement.</p>
                <p>Check Alerts for low-stock or reorder signals and schedule restock actions.</p>
                <p>When needed, admins can import or restore seeded state for cleanup and recovery.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </section>

      <Card className="p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Layers3 className="h-4 w-4" /> Role matrix
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {Object.values(sections).map((section) => (
            <div key={section.title} className="rounded-2xl border border-border bg-secondary/20 p-4">
              <p className="text-sm font-semibold">{section.title}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{section.summary}</p>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                {section.canDo.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function BlockList({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items: readonly string[];
  icon: ComponentType<{ className?: string }>;
  tone: "success" | "warning";
}) {
  const toneClass = tone === "success" ? "bg-success/10 text-success" : "bg-warning/15 text-warning-foreground";

  return (
    <div className="rounded-2xl border border-border bg-secondary/20 p-4">
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2 leading-5">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}