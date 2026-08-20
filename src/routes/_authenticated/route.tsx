import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { adminStatus } from "@/lib/admin-gate.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { unlocked } = await adminStatus();
    if (!unlocked) throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
