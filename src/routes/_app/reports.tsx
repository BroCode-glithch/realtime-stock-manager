import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/lib/inventory-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_app/reports")({
  component: Reports,
  head: () => ({ meta: [{ title: "Reports — Smart Inventory" }] }),
});

function Reports() {
  const products = useStore((s) => s.products);
  const demand = useStore((s) => s.demand);
  const baseline = useStore((s) => s.staticBaseline);

  const perProduct = useMemo(() => {
    return products.map((p) => {
      const recent = demand.filter((d) => d.productId === p.id).slice(-7);
      const avg = recent.reduce((a, b) => a + b.demand, 0) / Math.max(1, recent.length);
      return {
        name: p.name.length > 12 ? p.name.slice(0, 11) + "…" : p.name,
        stock: p.quantity,
        avgDemand: +avg.toFixed(1),
      };
    });
  }, [products, demand]);

  const adaptive = useMemo(() => {
    const stockouts = products.filter((p) => p.quantity === 0).length;
    const excess = products.filter((p) => {
      const recent = demand.filter((d) => d.productId === p.id).slice(-7);
      const avg = recent.reduce((a, b) => a + b.demand, 0) / Math.max(1, recent.length);
      return p.quantity > Math.max(50, avg * 15);
    }).length;
    return {
      stockouts: Math.round((stockouts / Math.max(1, products.length)) * 100),
      excess: Math.round((excess / Math.max(1, products.length)) * 100),
    };
  }, [products, demand]);

  const comparison = [
    { metric: "Stock-out %", Static: baseline.stockouts, Adaptive: adaptive.stockouts },
    { metric: "Excess stock %", Static: baseline.excess, Adaptive: adaptive.excess },
  ];

  const exportCsv = () => {
    const rows = [["Name", "Category", "Quantity", "ReorderLevel", "UnitPrice"]];
    for (const p of products) rows.push([p.name, p.category, String(p.quantity), String(p.reorderLevel), String(p.unitPrice)]);
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Performance vs. static inventory</p>
        <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1.5">
          <Download className="h-4 w-4" /> CSV
        </Button>
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-semibold">Adaptive vs Static</h2>
        <p className="text-xs text-muted-foreground">Lower is better</p>
        <div className="mt-4 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparison} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="metric" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Static" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Adaptive" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-semibold">Stock vs avg daily demand</h2>
        <p className="text-xs text-muted-foreground">Per SKU, last 7 days</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perProduct} margin={{ top: 5, right: 8, left: -20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} angle={-30} textAnchor="end" axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="stock" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="avgDemand" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
