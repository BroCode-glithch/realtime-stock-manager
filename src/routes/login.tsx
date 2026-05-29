import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore, type Role } from "../lib/inventory-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Boxes } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — Inventory" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState("manager@demo.io");
  const [password, setPassword] = useState("demo");
  const [role, setRole] = useState<Role>("manager");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const creds: Record<Role, { email: string; password: string }> = {
      admin: { email: "admin@example.com", password: "admin123" },
      manager: { email: "manager@example.com", password: "manager123" },
      staff: { email: "staff@example.com", password: "staff123" },
    };
    const next = creds[role];
    setEmail(next.email);
    setPassword(next.password);
  }, [role]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    const ok = await login(email, password);
    if (!ok) {
      setError("Login failed. Check the backend auth response and test credentials.");
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Boxes className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Smart Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Adaptive, real-time stock intelligence
          </p>
        </div>
        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
            Use the role selector to load a matching backend test account.
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Sign in</Button>
          <p className="text-center text-xs text-muted-foreground">
            Backend auth required — demo accounts are prefilled from the role selector.
          </p>
        </form>
      </div>
    </div>
  );
}
