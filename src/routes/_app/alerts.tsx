import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useStore } from "@/lib/inventory-store";
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

function Alerts() {
  const alerts = useStore((s) => s.alerts);
  const markRead = useStore((s) => s.markAlertsRead);

  useEffect(() => {
    const t = setTimeout(() => markRead(), 800);
    return () => clearTimeout(t);
  }, [markRead]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{alerts.length} alerts generated</p>
        <Button size="sm" variant="ghost" onClick={markRead} className="gap-1.5">
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
      </div>

      {alerts.map((a) => {
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
                  <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {m.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {new Date(a.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
      {alerts.length === 0 && (
        <Card className="p-10 text-center">
          <CheckCheck className="mx-auto mb-3 h-8 w-8 text-success" />
          <p className="text-sm font-medium">All clear</p>
          <p className="mt-1 text-xs text-muted-foreground">No alerts at the moment</p>
        </Card>
      )}
    </div>
  );
}
