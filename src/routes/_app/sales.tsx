import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore, formatNaira } from "@/lib/inventory-store";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_app/sales")({
  component: SalesReport,
  head: () => ({ meta: [{ title: "Daily Sales Report — Smart Inventory" }] }),
});

function SalesReport() {
  const products = useStore((s) => s.products);
  const transactions = useStore((s) => s.transactions);

  const { byDay, byProduct, totalRevenue, totalUnits } = useMemo(() => {
    const outs = transactions.filter((t) => t.quantityChanged < 0);
    const dayMap = new Map<string, { units: number; revenue: number }>();
    const prodMap = new Map<string, { name: string; units: number; revenue: number }>();
    let totalRevenue = 0;
    let totalUnits = 0;

    for (const t of outs) {
      const d = new Date(t.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const p = products.find((x) => x.id === t.productId);
      const units = -t.quantityChanged;
      const revenue = (p?.unitPrice ?? 0) * units;

      const dEntry = dayMap.get(key) ?? { units: 0, revenue: 0 };
      dEntry.units += units;
      dEntry.revenue += revenue;
      dayMap.set(key, dEntry);

      const pEntry = prodMap.get(t.productId) ?? { name: t.productName, units: 0, revenue: 0 };
      pEntry.units += units;
      pEntry.revenue += revenue;
      prodMap.set(t.productId, pEntry);

      totalRevenue += revenue;
      totalUnits += units;
    }

    const byDay = [...dayMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({ day, ...v }));
    const byProduct = [...prodMap.values()].sort((a, b) => b.revenue - a.revenue);
    return { byDay, byProduct, totalRevenue, totalUnits };
  }, [transactions, products]);

  const today = byDay[byDay.length - 1];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Today's revenue" value={formatNaira(today?.revenue ?? 0)} />
        <Stat label="Today's units sold" value={(today?.units ?? 0).toString()} />
        <Stat label="All-time revenue" value={formatNaira(totalRevenue)} sub={`${totalUnits} units total`} />
      </div>

      <Card className="p-4">
        <h2 className="font-semibold text-sm mb-3">Daily revenue trend</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatNaira(v)} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-sm">Sales by product</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Units sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byProduct.map((p) => (
                <TableRow key={p.name}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.units}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNaira(p.revenue)}</TableCell>
                </TableRow>
              ))}
              {byProduct.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                    No sales recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </Card>
  );
}
