import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdminUsers, setSellerVerification, setUserStatus } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Admin users — JUJ" }, { name: "robots", content: "noindex" }] }),
  component: AdminUsers,
});

const statusVariant = (s: string): "default" | "secondary" | "destructive" =>
  s === "active" ? "default" : s === "suspended" ? "secondary" : "destructive";

function AdminUsers() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "users"], queryFn: () => listAdminUsers() });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const statusMut = useMutation({
    mutationFn: (v: { userId: string; status: "active" | "suspended" | "banned" }) => setUserStatus({ data: v }),
    onSuccess: () => { toast.success("User updated"); refresh(); },
    onError: (e) => toast.error(e.message),
  });
  const verifyMut = useMutation({
    mutationFn: (v: { userId: string; status: "unverified" | "pending" | "verified" | "rejected" }) => setSellerVerification({ data: v }),
    onSuccess: () => { toast.success("Seller updated"); refresh(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      {(data ?? []).map((u: any) => (
        <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{u.email}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {u.roles.map((r: string) => <Badge key={r} variant="outline">{r}</Badge>)}
              <Badge variant={statusVariant(u.status)}>{u.status}</Badge>
              {u.seller && <Badge variant="secondary">seller: {u.seller.display_name} · {u.seller.verification_status}</Badge>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {u.status !== "active" && <Button size="sm" variant="outline" onClick={() => statusMut.mutate({ userId: u.id, status: "active" })}>Activate</Button>}
            {u.status !== "suspended" && <Button size="sm" variant="outline" onClick={() => statusMut.mutate({ userId: u.id, status: "suspended" })}>Suspend</Button>}
            {u.status !== "banned" && <Button size="sm" variant="destructive" onClick={() => statusMut.mutate({ userId: u.id, status: "banned" })}>Ban</Button>}
            {u.seller && u.seller.verification_status !== "verified" && (
              <Button size="sm" onClick={() => verifyMut.mutate({ userId: u.id, status: "verified" })}>Verify seller</Button>
            )}
            {u.seller && u.seller.verification_status === "verified" && (
              <Button size="sm" variant="outline" onClick={() => verifyMut.mutate({ userId: u.id, status: "rejected" })}>Revoke verification</Button>
            )}
          </div>
        </div>
      ))}
      {data && data.length === 0 && <p className="text-muted-foreground">No users yet.</p>}
    </div>
  );
}
