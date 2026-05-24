import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Product } from "@/lib/inventory-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Minus, Pencil, Trash2, Search } from "lucide-react";

export const Route = createFileRoute("/_app/inventory")({
  component: Inventory,
  head: () => ({ meta: [{ title: "Inventory — Smart Inventory" }] }),
});

function Inventory() {
  const products = useStore((s) => s.products);
  const recordTransaction = useStore((s) => s.recordTransaction);
  const deleteProduct = useStore((s) => s.deleteProduct);
  const role = useStore((s) => s.user?.role ?? "staff");
  const [q, setQ] = useState("");
  const canEdit = role === "admin" || role === "manager";

  const filtered = products.filter((p) =>
    [p.name, p.category, p.supplier].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        {canEdit && <ProductDialog mode="create" />}
      </div>

      <div className="space-y-2">
        {filtered.map((p) => {
          const low = p.quantity <= p.reorderLevel;
          return (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium">{p.name}</h3>
                    {low && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-destructive">
                        Low
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.category} • {p.supplier} • ${p.unitPrice.toFixed(2)}
                  </p>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="text-2xl font-semibold tabular-nums">{p.quantity}</span>
                    <span className="text-xs text-muted-foreground">in stock / reorder at {p.reorderLevel}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex gap-1">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => recordTransaction(p.id, 1, "out")}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => recordTransaction(p.id, 1, "in")}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <ProductDialog mode="edit" product={p} />
                      {role === "admin" && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteProduct(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No products found</p>
        )}
      </div>
    </div>
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
          <Button size="icon"><Plus className="h-4 w-4" /></Button>
        ) : (
          <Button size="icon" variant="ghost" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "create" ? "New product" : "Edit product"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
            <Field label="Supplier"><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Qty"><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} /></Field>
            <Field label="Reorder"><Input type="number" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: +e.target.value })} /></Field>
            <Field label="Price"><Input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: +e.target.value })} /></Field>
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
