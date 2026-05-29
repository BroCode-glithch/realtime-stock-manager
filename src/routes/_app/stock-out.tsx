import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { can, useStore, formatNaira } from "../../lib/inventory-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowUpFromLine } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_app/stock-out")({
  component: StockOut,
  head: () => ({ meta: [{ title: "Stock Out (Sold) — Smart Inventory" }] }),
});

function StockOut() {
  const role = useStore((s) => s.user?.role ?? "staff");
  const products = useStore((s) => s.products);
  const transactions = useStore((s) => s.transactions);
  const channels = useStore((s) => s.channels);
  const recordTransaction = useStore((s) => s.recordTransaction);
  const canAdd = can(role, "stock_out");

  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const enabledChannels = useMemo(() => channels.filter((channel) => channel.enabled), [channels]);
  const [channelId, setChannelId] = useState("");

  useEffect(() => {
    if (!channelId && enabledChannels.length > 0) {
      setChannelId(enabledChannels[0].id);
    }
  }, [channelId, enabledChannels]);

  const outs = useMemo(
    () => transactions.filter((t) => t.quantityChanged < 0).sort((a, b) => b.timestamp - a.timestamp),
    [transactions]
  );

  const submit = () => {
    if (!productId || qty <= 0) return;
    void recordTransaction(productId, qty, "out", channelId || undefined);
    setQty(1);
  };

  const totalSold = outs.reduce((sum, t) => {
    const p = products.find((x) => x.id === t.productId);
    return sum + (p?.unitPrice ?? 0) * -t.quantityChanged;
  }, 0);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpFromLine className="h-4 w-4 text-destructive" />
          <h2 className="font-semibold">Record a sale</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_120px_220px_auto] items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.code ? `(${p.code})` : ""} — {p.quantity} available
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Quantity sold</Label>
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(+e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Channel</Label>
            <Select value={channelId} onValueChange={setChannelId}>
              <SelectTrigger><SelectValue placeholder="Select channel" /></SelectTrigger>
              <SelectContent>
                {enabledChannels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={submit} variant="default" disabled={!canAdd}>Record sale</Button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Record an outgoing sale transaction.</p></TooltipContent>
          </Tooltip>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-sm">Stock Out (Sold) history</h2>
          <span className="text-xs text-muted-foreground">Total revenue: <span className="font-semibold text-foreground">{formatNaira(totalSold)}</span></span>
        </div>
        <div className="overflow-x-auto scrollbar-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outs.map((t) => {
                const p = products.find((x) => x.id === t.productId);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">{new Date(t.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{t.productName}</TableCell>
                    <TableCell className="text-right tabular-nums text-destructive">{t.quantityChanged}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNaira((p?.unitPrice ?? 0) * -t.quantityChanged)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.userId}</TableCell>
                  </TableRow>
                );
              })}
              {outs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
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
