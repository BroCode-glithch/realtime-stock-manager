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
import { ArrowDownToLine } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_app/stock-in")({
  component: StockIn,
  head: () => ({ meta: [{ title: "Stock In Log — Smart Inventory" }] }),
});

function StockIn() {
  const role = useStore((s) => s.user?.role ?? "staff");
  const products = useStore((s) => s.products);
  const transactions = useStore((s) => s.transactions);
  const channels = useStore((s) => s.channels);
  const recordTransaction = useStore((s) => s.recordTransaction);
  const currentUser = useStore((s) => s.user);
  const canAdd = can(role, "stock_in");

  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const enabledChannels = useMemo(() => channels.filter((channel) => channel.enabled), [channels]);
  const [channelId, setChannelId] = useState("");

  useEffect(() => {
    if (!channelId && enabledChannels.length > 0) {
      setChannelId(enabledChannels[0].id);
    }
  }, [channelId, enabledChannels]);

  const ins = useMemo(
    () => transactions.filter((t) => t.quantityChanged > 0).sort((a, b) => b.timestamp - a.timestamp),
    [transactions]
  );

  const submit = () => {
    if (!productId || qty <= 0) return;
    void recordTransaction(productId, qty, "in", channelId || undefined);
    setQty(1);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowDownToLine className="h-4 w-4 text-success" />
          <h2 className="font-semibold">Receive new stock</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_120px_220px_auto] items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.code ? `(${p.code})` : ""} — {p.quantity} in stock
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Quantity</Label>
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
              <Button onClick={submit} disabled={!canAdd}>Add to inventory</Button>
            </TooltipTrigger>
            <TooltipContent side="top"><p>Record incoming stock for this product.</p></TooltipContent>
          </Tooltip>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Added quantity is automatically reflected in the product listing's available stock.
        </p>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3">
          <h2 className="font-semibold text-sm">Stock In history</h2>
        </div>
        <div className="overflow-x-auto scrollbar-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ins.map((t) => {
                const p = products.find((x) => x.id === t.productId);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">{new Date(t.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{t.productName}</TableCell>
                    <TableCell className="text-right tabular-nums text-success">+{t.quantityChanged}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNaira((p?.unitPrice ?? 0) * t.quantityChanged)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.userName ?? (currentUser && t.userId === currentUser.id ? currentUser.name : t.userId)}</TableCell>
                  </TableRow>
                );
              })}
              {ins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No stock-in records yet
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
