import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdminOffers, setOfferStatus } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/money";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/offers")({
  head: () => ({ meta: [{ title: "Admin offers — JUJ" }, { name: "robots", content: "noindex" }] }),
  component: AdminOffers,
});

const nextActions: Record<string, { label: string; status: "active" | "paused" | "archived" }[]> = {
  draft: [{ label: "Publish", status: "active" }, { label: "Archive", status: "archived" }],
  active: [{ label: "Pause", status: "paused" }, { label: "Archive", status: "archived" }],
  paused: [{ label: "Publish", status: "active" }, { label: "Archive", status: "archived" }],
  archived: [{ label: "Restore", status: "paused" }],
};

function AdminOffers() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "offers"], queryFn: () => listAdminOffers() });
  const mut = useMutation({
    mutationFn: (v: { id: number; status: "draft" | "active" | "paused" | "archived" }) => setOfferStatus({ data: v }),
    onSuccess: () => { toast.success("Offer updated"); qc.invalidateQueries({ queryKey: ["admin", "offers"] }); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      {(data ?? []).map((o: any) => (
        <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
          <div className="min-w-0 flex-1">
            <Link to="/catalog/product/$offer" params={{ offer: `${o.slug}-${o.id}` }} className="font-medium hover:text-primary">
              {o.title}
            </Link>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatPrice(o.price_minor, o.currency)} · {o.category?.name} · by {o.seller?.display_name} · stock {o.stock_count} · sold {o.sales_count}
            </p>
          </div>
          <Badge variant={o.status === "active" ? "default" : "secondary"}>{o.status}</Badge>
          <div className="flex gap-2">
            {(nextActions[o.status] ?? []).map((a) => (
              <Button key={a.status} size="sm" variant={a.status === "archived" ? "destructive" : "outline"} onClick={() => mut.mutate({ id: o.id, status: a.status })}>
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
