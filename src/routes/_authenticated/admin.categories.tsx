import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listAdminCategories, saveCategory } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({ meta: [{ title: "Admin categories — JUJ" }, { name: "robots", content: "noindex" }] }),
  component: AdminCategories,
});

type Cat = {
  id: string; parent_id: string | null; slug: string; name: string; icon: string | null;
  commission_percent: number; sort_order: number; show_in_header: boolean; is_active: boolean;
};

const empty: Omit<Cat, "id"> = { parent_id: null, slug: "", name: "", icon: "", commission_percent: 10, sort_order: 0, show_in_header: false, is_active: true };

function AdminCategories() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "categories"], queryFn: () => listAdminCategories() });
  const [editing, setEditing] = useState<(Omit<Cat, "id" | "icon"> & { id?: string; icon?: string | null }) | null>(null);

  const mut = useMutation({
    mutationFn: (v: any) => saveCategory({ data: v }),
    onSuccess: () => {
      toast.success("Category saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const cats = (data ?? []) as Cat[];

  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({ ...empty })}>New category</Button>

      {editing && (
        <form
          className="space-y-3 rounded-xl border bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate({
              ...editing,
              icon: editing.icon || null,
              parent_id: editing.parent_id || null,
              commission_percent: Number(editing.commission_percent ?? 10),
              sort_order: Number(editing.sort_order ?? 0),
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input required placeholder="Name" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input required placeholder="slug-like-this" pattern="[a-z0-9-]+" value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={editing.parent_id ?? ""}
              onChange={(e) => setEditing({ ...editing, parent_id: e.target.value || null })}
              aria-label="Parent category"
            >
              <option value="">No parent (top level)</option>
              {cats.filter((c) => c.id !== editing.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input type="number" min={0} max={100} step="0.1" placeholder="Commission %" value={editing.commission_percent ?? 10} onChange={(e) => setEditing({ ...editing, commission_percent: Number(e.target.value) })} />
            <Input type="number" min={0} placeholder="Sort order" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!editing.show_in_header} onChange={(e) => setEditing({ ...editing, show_in_header: e.target.checked })} /> Show in header</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} /> Active</label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={mut.isPending}>Save</Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {cats.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{c.name} <span className="text-sm text-muted-foreground">/{c.slug}</span></p>
              <p className="text-sm text-muted-foreground">
                {c.parent_id ? `parent: ${cats.find((p) => p.id === c.parent_id)?.name ?? "?"}` : "top level"} · commission {c.commission_percent}% · order {c.sort_order}
              </p>
            </div>
            {c.show_in_header && <Badge variant="outline">header</Badge>}
            <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "active" : "hidden"}</Badge>
            <Button size="sm" variant="outline" onClick={() => setEditing({ ...c })}>Edit</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
