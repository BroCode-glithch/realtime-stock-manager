import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "../../lib/inventory-store";
import { Card } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Package, AlertTriangle, TrendingDown, DollarSign } from "lucide-react";
import { useMemo } from "react";
import { SimControls } from "@/components/SimControls";
import { formatNaira } from "../../lib/inventory-store";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Smart Inventory" }] }),
});

function Dashboard() {
  const products = useStore((s) => s.products);
  const alerts = useStore((s) => s.alerts);
  const demand = useStore((s) => s.demand);

  const stats = useMemo(() => {
    const totalUnits = products.reduce((a, p) => a + p.quantity, 0);
    const value = products.reduce((a, p) => a + p.quantity * p.unitPrice, 0);
    const low = products.filter((p) => p.quantity <= p.reorderLevel).length;
    return { totalUnits, value, low, activeAlerts: alerts.filter((a) => !a.read).length };
  }, [products, alerts]);

  const trend = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const d of demand) byDay.set(d.day, (byDay.get(d.day) ?? 0) + d.demand);
    return Array.from(byDay.entries()).slice(-14).map(([day, demand]) => ({ day, demand }));
  }, [demand]);

  return (
    <div className="space-y-5">
      <SimControls />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Package className="h-4 w-4" />} label="Total units" value={stats.totalUnits.toLocaleString()} accent="primary" />
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="Stock value" value={formatNaira(stats.value)} accent="success" />
        <StatCard icon={<TrendingDown className="h-4 w-4" />} label="Low stock" value={String(stats.low)} accent="warning" />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Active alerts" value={String(stats.activeAlerts)} accent="destructive" />
      </div>

      <Card className="p-4 md:p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h2 className="text-sm font-semibold">Demand trend</h2>
            <p className="text-xs text-muted-foreground">Last 14 days, all SKUs</p>
          </div>
        </div>
        <div className="h-48 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Line type="monotone" dataKey="demand" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 md:p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">Recent alerts</h2>
          <span className="text-xs text-muted-foreground">{alerts.length} total</span>
        </div>
        <div className="space-y-2">
          {alerts.slice(0, 5).map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3">
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                a.type === "overstock" ? "bg-warning" : a.type === "reorder" ? "bg-warning" : "bg-destructive"
              }`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.productName}</p>
                <p className="truncate text-xs text-muted-foreground">{a.message}</p>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">All stock healthy</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: string; accent: "primary" | "success" | "warning" | "destructive" }) {
  const accentClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  }[accent];
  return (
    <Card className="p-4">
      <div className={`mb-3 grid h-8 w-8 place-items-center rounded-lg ${accentClass}`}>{icon}</div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
    </Card>
  );
}
