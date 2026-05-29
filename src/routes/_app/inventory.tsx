import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useStore,
  type Product,
  formatNaira,
  productStatus,
  allTimeMovement,
} from "@/lib/inventory-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

export const Route = createFileRoute("/_app/inventory")({
  component: Inventory,
  head: () => ({ meta: [{ title: "Product Listing — Smart Inventory" }] }),
});

function Inventory() {
  const products = useStore((s) => s.products);
  const transactions = useStore((s) => s.transactions);
  const deleteProduct = useStore((s) => s.deleteProduct);
  const role = useStore((s) => s.user?.role ?? "staff");
  const [q, setQ] = useState("");
  const canEdit = role === "admin" || role === "manager";

  const filtered = products.filter((p) =>
    [p.name, p.category, p.supplier, p.code, p.color]
      .filter(Boolean).join(" ").toLowerCase()
      .includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, color…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        {canEdit && <ProductDialog mode="create" />}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="text-right">Price (₦)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">In Stock</TableHead>
                <TableHead className="text-right">Inventory Value</TableHead>
                <TableHead className="text-right">All-time In</TableHead>
                <TableHead className="text-right">All-time Out</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const status = productStatus(p);
                const { inQty, outQty } = allTimeMovement(transactions, p.id);
                const value = p.quantity * p.unitPrice;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.category} • {p.supplier}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.code ?? "—"}</TableCell>
                    <TableCell className="text-sm">{p.color ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNaira(p.unitPrice)}</TableCell>
                    <TableCell><StatusBadge status={status} /></TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{p.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNaira(value)}</TableCell>
                    <TableCell className="text-right tabular-nums text-success">+{inQty}</TableCell>
                    <TableCell className="text-right tabular-nums text-destructive">-{outQty}</TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <ProductDialog mode="edit" product={p} />
                          {role === "admin" && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteProduct(p.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                    No products found
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

function StatusBadge({ status }: { status: "in_stock" | "low" | "out" }) {
  const map = {
    in_stock: { label: "In Stock", cls: "bg-success/10 text-success" },
    low: { label: "Low", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    out: { label: "Out", cls: "bg-destructive/10 text-destructive" },
  } as const;
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>
      {label}
    </span>
  );
}

function ProductDialog({ mode, product }: { mode: "create" | "edit"; product?: Product }) {
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Product, "id">>({
    name: product?.name ?? "",
    category: product?.category ?? "",
    supplier: product?.supplier ?? "",
    quantity: product?.quantity ?? 0,
    reorderLevel: product?.reorderLevel ?? 10,
    unitPrice: product?.unitPrice ?? 0,
    color: product?.color ?? "",
    code: product?.code ?? "",
  });

  const submit = () => {
    if (!form.name) return;
    if (mode === "create") addProduct(form);
    else if (product) updateProduct(product.id, form);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button className="gap-1.5"><Plus className="h-4 w-4" /> New product</Button>
        ) : (
          <Button size="icon" variant="ghost" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "create" ? "New product" : "Edit product"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Item code"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
            <Field label="Color"><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
            <Field label="Supplier"><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Qty"><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} /></Field>
            <Field label="Reorder"><Input type="number" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: +e.target.value })} /></Field>
            <Field label="Price (₦)"><Input type="number" step="1" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: +e.target.value })} /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>{mode === "create" ? "Create" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
