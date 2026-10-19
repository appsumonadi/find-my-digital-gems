import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdminOrders, setOrderStatus } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/money";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({ meta: [{ title: "Admin orders — JUJ" }, { name: "robots", content: "noindex" }] }),
  component: AdminOrders,
});

const variant = (s: string) =>
  (["delivered", "completed", "paid"].includes(s) ? "default" : ["cancelled", "refunded"].includes(s) ? "destructive" : "secondary") as const;

function AdminOrders() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "orders"], queryFn: () => listAdminOrders() });
  const mut = useMutation({
    mutationFn: (v: { id: string; status: "cancelled" | "refunded" | "completed" | "needs_attention" }) => setOrderStatus({ data: v }),
    onSuccess: () => { toast.success("Order updated"); qc.invalidateQueries({ queryKey: ["admin", "orders"] }); },
    onError: (e) => toast.error(e.message),
  });

  const orders = (data ?? []) as any[];
  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">Order #{o.number} · {formatPrice(o.total_minor, o.currency)}</p>
              <p className="text-sm text-muted-foreground">
                {o.buyer?.email ?? o.guest_email ?? "guest"} · {new Date(o.created_at).toLocaleString()}
              </p>
            </div>
            <Badge variant={variant(o.status)}>{o.status}</Badge>
            <div className="flex gap-2">
              {!["cancelled", "refunded"].includes(o.status) && (
                <>
                  <Button size="sm" variant="outline" onClick={() => mut.mutate({ id: o.id, status: "cancelled" })}>Cancel</Button>
                  <Button size="sm" variant="destructive" onClick={() => mut.mutate({ id: o.id, status: "refunded" })}>Refund</Button>
                </>
              )}
              {o.status === "needs_attention" && (
                <Button size="sm" variant="outline" onClick={() => mut.mutate({ id: o.id, status: "completed" })}>Mark completed</Button>
              )}
            </div>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {(o.items ?? []).map((i: any) => (
              <li key={i.id}>
                {i.qty}× {i.offer?.title ?? "offer"} — {formatPrice(i.unit_price_minor, o.currency)} each · commission {formatPrice(i.commission_minor, o.currency)} · <Badge variant="outline">{i.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {data && orders.length === 0 && (
        <p className="text-muted-foreground">No orders yet. Orders appear here once checkout and payments are enabled.</p>
      )}
    </div>
  );
}
