import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "@/lib/admin.functions";
import { formatPrice } from "@/lib/money";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin dashboard — JUJ" }, { name: "robots", content: "noindex" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data } = useQuery({ queryKey: ["admin", "stats"], queryFn: () => getAdminStats() });
  const cards = [
    { label: "Users", value: data?.users },
    { label: "Sellers", value: data?.sellers },
    { label: "Offers", value: data?.offers },
    { label: "Orders", value: data?.orders },
    { label: "Revenue", value: data ? formatPrice(data.totalRevenue, "USD") : undefined },
    { label: "Commission earned", value: data ? formatPrice(data.totalCommission, "USD") : undefined },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">{c.label}</p>
          <p className="mt-1 font-display text-2xl font-bold">{c.value ?? "…"}</p>
        </div>
      ))}
    </div>
  );
}
