import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Papa from "papaparse";
import { useStore, type Product } from "@/lib/inventory-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Check, Download, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_app/import")({
  component: ImportPage,
  head: () => ({ meta: [{ title: "Import — Smart Inventory" }] }),
});

type Row = Omit<Product, "id">;

const REQUIRED = ["name", "category", "supplier", "quantity", "reorderLevel", "unitPrice"];

function ImportPage() {
  const bulkImport = useStore((s) => s.bulkImport);
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleFile = (file: File) => {
    setError(null);
    setDone(false);
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const headers = res.meta.fields ?? [];
        const missing = REQUIRED.filter((r) => !headers.includes(r));
        if (missing.length) {
          setError(`Missing columns: ${missing.join(", ")}`);
          setRows([]);
          return;
        }
        const parsed: Row[] = res.data.map((r) => ({
          name: String(r.name ?? "").trim(),
          category: String(r.category ?? "").trim(),
          supplier: String(r.supplier ?? "").trim(),
          quantity: Number(r.quantity) || 0,
          reorderLevel: Number(r.reorderLevel) || 0,
          unitPrice: Number(r.unitPrice) || 0,
        })).filter((r) => r.name);
        if (!parsed.length) {
          setError("No valid rows found.");
          return;
        }
        setRows(parsed);
      },
      error: (err) => setError(err.message),
    });
  };

  const confirm = () => {
    bulkImport(rows);
    setDone(true);
    setRows([]);
    setFileName(null);
  };

  const downloadTemplate = () => {
    const csv = "name,category,supplier,quantity,reorderLevel,unitPrice\nSample SKU,Electronics,Acme,50,10,19.99\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "inventory-template.csv";
    a.click();
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">Bulk import products</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a CSV to initialize inventory. Required columns:{" "}
              <code className="rounded bg-secondary px-1 py-0.5 text-[11px]">{REQUIRED.join(", ")}</code>
            </p>
            <Button onClick={downloadTemplate} variant="ghost" size="sm" className="mt-2 gap-1.5 -ml-2">
              <Download className="h-3.5 w-3.5" /> Download template
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <label className="flex flex-col items-center justify-center gap-3 cursor-pointer rounded-xl border-2 border-dashed border-border bg-secondary/30 hover:bg-secondary/60 transition-colors py-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-sm">Click to choose a CSV file</p>
            <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
          </div>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      </Card>

      {error && (
        <Card className="p-4 border-destructive/40">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        </Card>
      )}

      {done && (
        <Card className="p-4 border-success/40">
          <div className="flex items-center gap-2 text-success text-sm">
            <Check className="h-4 w-4" /> Import complete. Products added to inventory.
          </div>
        </Card>
      )}

      {rows.length > 0 && (
        <Card className="p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">{fileName}</p>
              <span className="text-xs text-muted-foreground">{rows.length} rows ready</span>
            </div>
            <Button size="sm" onClick={confirm}>Confirm import</Button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-secondary/60 text-left">
                <tr>
                  {REQUIRED.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2">{r.category}</td>
                    <td className="px-3 py-2">{r.supplier}</td>
                    <td className="px-3 py-2 tabular-nums">{r.quantity}</td>
                    <td className="px-3 py-2 tabular-nums">{r.reorderLevel}</td>
                    <td className="px-3 py-2 tabular-nums">₦{r.unitPrice.toLocaleString("en-NG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 20 && (
              <p className="border-t border-border bg-secondary/30 px-3 py-2 text-center text-[11px] text-muted-foreground">
                + {rows.length - 20} more rows
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
