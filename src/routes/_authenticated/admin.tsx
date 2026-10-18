import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/auth" });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

const tabs = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/users", label: "Users & sellers" },
  { to: "/admin/offers", label: "Offers" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/orders", label: "Orders" },
] as const;

function AdminLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="font-display text-2xl font-bold">Admin panel</h1>
      <nav className="mt-4 flex gap-2 overflow-x-auto border-b pb-2">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            activeOptions={{ exact: "exact" in t && t.exact }}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent"
            activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
