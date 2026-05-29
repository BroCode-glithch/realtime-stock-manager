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
            The platform runs a live inventory loop: products are maintained centrally, stock
            movements feed demand, alerts are generated from current stock plus forecasted demand,
            and reports compare static versus adaptive behavior.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Products", "Inventory master records with code, color, quantity, price, and reorder level."],
              ["Transactions", "Stock in, stock out, and adjustment history tied to channels and users."],
              ["Alerts", "Low stock, reorder, and overstock signals generated from live stock and demand."],
              ["Reports", "Daily sales, inventory summary, and performance comparison charts."],
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
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["1", "Login", "User signs in and the backend returns token, role, and profile data."],
            ["2", "Sync state", "The app pulls products, transactions, alerts, channels, and baseline stats."],
            ["3", "Operate", "Users add stock, record sales, update products, or manage channels based on role."],
            ["4", "Observe", "Dashboards, charts, alerts, and reports update from snapshots and realtime events."],
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

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <LineChart className="h-4 w-4" /> Charts and reports
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The dashboard and reports pages read the same backend state, but present it differently.
            Trend charts help spot demand movement, while reports compare static and adaptive stock behavior.
          </p>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ["Dashboard trend", "Shows the last 14 days of demand across all SKUs."],
              ["Revenue charts", "Breaks sales down by day and by product."],
              ["Adaptive vs static", "Compares stock-out and excess stock rates side-by-side."],
              ["Inventory summary", "Shows current stock value and movement totals."],
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
                <p>Open Dashboard and confirm the active alerts count.</p>
                <p>Check inventory levels for low-stock products.</p>
                <p>Review the current sales channels if you are a manager or admin.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="a2">
              <AccordionTrigger>During operations</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                <p>Record stock-in when new goods arrive.</p>
                <p>Record stock-out when goods are sold or issued.</p>
                <p>Use the product dialog to update item code, color, price, and reorder level.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="a3">
              <AccordionTrigger>End of day</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm leading-6 text-muted-foreground">
                <p>Open Reports for a daily sales snapshot.</p>
                <p>Review stock-out vs excess-stock performance.</p>
                <p>Check Alerts and decide if any products need to be restocked or adjusted.</p>
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