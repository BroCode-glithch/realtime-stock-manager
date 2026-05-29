import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiJson, type ApiDailySalesReport, type ApiInventorySummaryReport, type ApiPerformanceReport } from "@/lib/inventory-api";
import {
  can,
  useStore,
  formatNaira,
  type DailySalesReport,
  type InventorySummaryReport,
  type PerformanceReport,
} from "../../lib/inventory-store";
import { Download, FileText } from "lucide-react";

export const Route = createFileRoute("/_app/reports")({
  component: Reports,
  head: () => ({ meta: [{ title: "Reports — Smart Inventory" }] }),
});

function Reports() {
  const role = useStore((s) => s.user?.role ?? "staff");
  const canViewReports = can(role, "view_reports");
  const products = useStore((s) => s.products);
  const demand = useStore((s) => s.demand);
  const transactions = useStore((s) => s.transactions);
  const baseline = useStore((s) => s.staticBaseline);
  const [dailySales, setDailySales] = useState<DailySalesReport | null>(null);
  const [inventorySummary, setInventorySummary] = useState<InventorySummaryReport | null>(null);
  const [performance, setPerformance] = useState<PerformanceReport | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [sales, inventory, perf] = await Promise.all([
        apiJson<ApiDailySalesReport>("/api/reports/daily-sales"),
        apiJson<ApiInventorySummaryReport>("/api/reports/inventory-summary"),
        apiJson<ApiPerformanceReport>("/api/reports/performance"),
      ]);
      if (!alive) return;
      if (sales) setDailySales(sales);
      if (inventory) setInventorySummary(inventory);
      if (perf) setPerformance(perf);
    })();
    return () => {
      alive = false;
    };
  }, [products.length, transactions.length, demand.length]);

  const fallbackDailySales = useMemo<DailySalesReport>(() => {
    const outs = transactions.filter((t) => t.quantityChanged < 0);
    const dayMap = new Map<string, { unitsSold: number; revenue: number }>();
    let totalUnits = 0;
    let totalRevenue = 0;

    for (const transaction of outs) {
      const day = new Date(transaction.timestamp).toISOString().slice(0, 10);
      const product = products.find((item) => item.id === transaction.productId);
      const unitsSold = -transaction.quantityChanged;
      const revenue = (product?.unitPrice ?? 0) * unitsSold;
      const current = dayMap.get(day) ?? { unitsSold: 0, revenue: 0 };
      current.unitsSold += unitsSold;
      current.revenue += revenue;
      dayMap.set(day, current);
      totalUnits += unitsSold;
      totalRevenue += revenue;
    }

    return {
      series: [...dayMap.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([day, point]) => ({ day, ...point })),
      totalUnits,
      totalRevenue,
    };
  }, [products, transactions]);

  const fallbackInventorySummary = useMemo<InventorySummaryReport>(() => {
    const currentStockValue = products.reduce((sum, product) => sum + product.quantity * product.unitPrice, 0);
    const stockoutRate = Math.round((products.filter((product) => product.quantity === 0).length / Math.max(1, products.length)) * 100);
    const excessStockRate = Math.round((products.filter((product) => {
      const recent = demand.filter((entry) => entry.productId === product.id).slice(-7);
      const avg = recent.reduce((sum, entry) => sum + entry.demand, 0) / Math.max(1, recent.length);
      return product.quantity > Math.max(50, avg * 15);
    }).length / Math.max(1, products.length)) * 100);

    const productMovementTotals = products.map((product) => {
      const rows = transactions.filter((transaction) => transaction.productId === product.id);
      const unitsIn = rows.filter((transaction) => transaction.quantityChanged > 0).reduce((sum, transaction) => sum + transaction.quantityChanged, 0);
      const unitsOut = rows.filter((transaction) => transaction.quantityChanged < 0).reduce((sum, transaction) => sum + (-transaction.quantityChanged), 0);
      return {
        productId: product.id,
        productName: product.name,
        unitsIn,
        unitsOut,
        net: unitsIn - unitsOut,
      };
    });

    return { currentStockValue, stockoutRate, excessStockRate, productMovementTotals };
  }, [products, demand, transactions]);

  const fallbackPerformance = useMemo<PerformanceReport>(() => {
    const revenueByProduct = products
      .map((product) => {
        const outRows = transactions.filter((transaction) => transaction.productId === product.id && transaction.quantityChanged < 0);
        return {
          productId: product.id,
          productName: product.name,
          revenue: outRows.reduce((sum, transaction) => sum + (-transaction.quantityChanged) * product.unitPrice, 0),
        };
      })
      .sort((left, right) => right.revenue - left.revenue);

    return {
      stockoutRate: fallbackInventorySummary.stockoutRate,
      excessStockRate: fallbackInventorySummary.excessStockRate,
      currentStockValue: fallbackInventorySummary.currentStockValue,
      revenueByProduct,
      revenueByDay: fallbackDailySales.series,
    };
  }, [products, transactions, fallbackDailySales, fallbackInventorySummary]);

  const dailySalesReport = dailySales ?? fallbackDailySales;
  const inventoryReport = inventorySummary ?? fallbackInventorySummary;
  const performanceReport = performance ?? fallbackPerformance;

  const comparison = [
    { metric: "Stock-out %", Static: baseline.stockouts, Adaptive: inventoryReport.stockoutRate },
    { metric: "Excess stock %", Static: baseline.excess, Adaptive: inventoryReport.excessStockRate },
  ];

  const revenueTrend = dailySalesReport.series;
  const revenueByProduct = performanceReport.revenueByProduct.map((item) => ({
    name: item.productName.length > 12 ? `${item.productName.slice(0, 11)}…` : item.productName,
    revenue: item.revenue,
  }));

  const exportCsv = () => {
    const rows = [["Product", "Units In", "Units Out", "Net"]];
    for (const row of inventoryReport.productMovementTotals) {
      rows.push([row.productName, String(row.unitsIn), String(row.unitsOut), String(row.net)]);
    }
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();
    doc.setFontSize(18);
    doc.text("Smart Inventory — Report", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated ${today}`, 14, 25);

    doc.setTextColor(20);
    doc.setFontSize(12);
    doc.text("Adaptive vs Static performance", 14, 35);
    autoTable(doc, {
      startY: 39,
      head: [["Metric", "Static (%)", "Adaptive (%)"]],
      body: comparison.map((item) => [item.metric, String(item.Static), String(item.Adaptive)]),
      headStyles: { fillColor: [70, 110, 200] },
      styles: { fontSize: 10 },
    });

    const afterY1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text("Inventory movement", 14, afterY1);
    autoTable(doc, {
      startY: afterY1 + 4,
      head: [["Product", "Units In", "Units Out", "Net"]],
      body: inventoryReport.productMovementTotals.map((row) => [
        row.productName,
        String(row.unitsIn),
        String(row.unitsOut),
        String(row.net),
      ]),
      headStyles: { fillColor: [70, 110, 200] },
      styles: { fontSize: 9 },
    });

    doc.save(`inventory-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (!canViewReports) {
    return (
      <Card className="p-5">
        <h2 className="font-semibold">Reports unavailable</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your role can view operational pages, but report access is reserved for managers and admins.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">Performance vs. static inventory</p>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1.5">
                <Download className="h-4 w-4" /> CSV
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Download the report as CSV.</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" onClick={exportPdf} className="gap-1.5">
                <FileText className="h-4 w-4" /> PDF
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Export the report as PDF.</p></TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Total revenue" value={formatNaira(dailySalesReport.totalRevenue)} />
        <Stat label="Units sold" value={dailySalesReport.totalUnits.toString()} />
        <Stat label="Current stock value" value={formatNaira(inventoryReport.currentStockValue)} />
      </div>

      <Card className="p-4 md:p-5">
        <h2 className="text-sm font-semibold">Adaptive vs Static</h2>
        <p className="text-xs text-muted-foreground">Lower is better</p>
        <div className="mt-4 h-56 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparison} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="metric" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Static" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Adaptive" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 md:p-5">
        <h2 className="text-sm font-semibold">Daily sales trend</h2>
        <p className="text-xs text-muted-foreground">Units sold and revenue by day</p>
        <div className="mt-4 h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueTrend} margin={{ top: 5, right: 8, left: -20, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="unitsSold" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="revenue" stroke="var(--chart-3)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3">
          <h2 className="font-semibold text-sm">Revenue by product</h2>
        </div>
        <div className="overflow-x-auto scrollbar-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueByProduct.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNaira(item.revenue)}</TableCell>
                </TableRow>
              ))}
              {revenueByProduct.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="py-10 text-center text-sm text-muted-foreground">
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
