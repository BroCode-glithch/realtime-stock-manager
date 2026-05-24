import { createFileRoute, redirect } from "@tanstack/react-router";
import { useStore } from "@/lib/inventory-store";

export const Route = createFileRoute("/")({
  component: () => null,
  beforeLoad: () => {
    const user = useStore.getState().user;
    throw redirect({ to: user ? "/dashboard" : "/login" });
  },
});
