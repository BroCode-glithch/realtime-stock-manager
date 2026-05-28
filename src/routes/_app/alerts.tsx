import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore, type Alert as AlertType } from "@/lib/inventory-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, PackageX, TrendingUp, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/_app/alerts")({
  component: Alerts,
  head: () => ({ meta: [{ title: "Alerts — Smart Inventory" }] }),
});

const meta = {
  low_stock: { icon: PackageX, color: "text-destructive", bg: "bg-destructive/10", label: "Low stock" },
  reorder: { icon: AlertTriangle, color: "text-warning-foreground", bg: "bg-warning/20", label: "Reorder" },
  overstock: { icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", label: "Overstock" },
} as const;

type Filter = "all" | AlertType["type"];

function Alerts() {
  const alerts = useStore((s) => s.alerts);
  const markRead = useStore((s) => s.markAlertsRead);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const t = setTimeout(() => markRead(), 800);
    return () => clearTimeout(t);
  }, [markRead]);

  const counts = useMemo(() => ({
    all: alerts.length,
    low_stock: alerts.filter((a) => a.type === "low_stock").length,
    reorder: alerts.filter((a) => a.type === "reorder").length,
    overstock: alerts.filter((a) => a.type === "overstock").length,
  }), [alerts]);

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.type === filter);

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "low_stock", label: "Low", count: counts.low_stock },
    { id: "reorder", label: "Reorder", count: counts.reorder },
    { id: "overstock", label: "Overstock", count: counts.overstock },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length} of {alerts.length} alerts</p>
        <Button size="sm" variant="ghost" onClick={markRead} className="gap-1.5">
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-border bg-card p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {t.label}
            <span className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] tabular-nums ${
              filter === t.id ? "bg-primary-foreground/20" : "bg-secondary"
            }`}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((a) => {
          const m = meta[a.type];
          const Icon = m.icon;
          return (
            <Card key={a.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${m.bg} ${m.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{a.productName}</p>
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="p-10 text-center">
            <CheckCheck className="mx-auto mb-3 h-8 w-8 text-success" />
            <p className="text-sm font-medium">All clear</p>
            <p className="mt-1 text-xs text-muted-foreground">No alerts in this filter</p>
          </Card>
        )}
      </div>
    </div>
  );
}
