import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  Input,
  ListRow,
  MutationError,
  PageTitle,
  Select,
} from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { useBrandScope } from "./hooks/useBrandScope";

type CenterStatus = "pending" | "active" | "suspended" | "closed";

interface Center {
  id: string;
  slug: string;
  name: string;
  status: CenterStatus;
  city: string | null;
  address_line1: string | null;
  region: string | null;
  country: string | null;
}

const STATUS_OPTIONS: { value: CenterStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "closed", label: "Closed" },
];

const emptyForm = {
  slug: "",
  name: "",
  status: "pending" as CenterStatus,
  city: "",
  address_line1: "",
  region: "",
  country: "IN",
};

export function CentersPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const centers = useQuery({
    queryKey: ["centers", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("franchise_centers")
        .select("id, slug, name, status, city, address_line1, region, country")
        .eq("brand_id", brandId!)
        .is("deleted_at", null)
        .order("name");
      return supabaseList(data, error) as Center[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["centers", brandId] });

  const createCenter = useMutation({
    mutationFn: async () => {
      if (!brandId) throw new Error("Brand context required");
      clear();
      const { error: mErr } = await getSupabase().from("franchise_centers").insert({
        brand_id: brandId,
        slug: form.slug.trim(),
        name: form.name.trim(),
        status: form.status,
        city: form.city.trim() || null,
        address_line1: form.address_line1.trim() || null,
        region: form.region.trim() || null,
        country: form.country.trim() || "IN",
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
    },
    onError: capture,
  });

  const updateCenter = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("franchise_centers")
        .update({
          slug: editForm.slug.trim(),
          name: editForm.name.trim(),
          status: editForm.status,
          city: editForm.city.trim() || null,
          address_line1: editForm.address_line1.trim() || null,
          region: editForm.region.trim() || null,
          country: editForm.country.trim() || "IN",
        })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
    onError: capture,
  });

  const deleteCenter = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm("Remove this center from active lists? Historical data is kept.")) return;
      clear();
      const { error: mErr } = await getSupabase()
        .from("franchise_centers")
        .update({ deleted_at: new Date().toISOString(), status: "closed" })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidate,
    onError: capture,
  });

  const startEdit = (c: Center) => {
    clear();
    setEditingId(c.id);
    setEditForm({
      slug: c.slug,
      name: c.name,
      status: c.status,
      city: c.city ?? "",
      address_line1: c.address_line1 ?? "",
      region: c.region ?? "",
      country: c.country ?? "IN",
    });
  };

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found. Check domain mapping for this hostname.</p>;
  }

  return (
    <>
      <PageTitle>Franchise Centers</PageTitle>
      <MutationError message={error} />
      <Card title="Add center">
        <Input label="Slug" value={form.slug} onChange={(v) => setForm((f) => ({ ...f, slug: v }))} placeholder="koramangala" />
        <Input label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
        <Select label="Status" value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} options={STATUS_OPTIONS} />
        <Input label="City" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
        <Input label="Address" value={form.address_line1} onChange={(v) => setForm((f) => ({ ...f, address_line1: v }))} />
        <Input label="Region" value={form.region} onChange={(v) => setForm((f) => ({ ...f, region: v }))} />
        <Input label="Country" value={form.country} onChange={(v) => setForm((f) => ({ ...f, country: v }))} />
        <Button
          onClick={() => createCenter.mutate()}
          disabled={!form.slug.trim() || !form.name.trim() || createCenter.isPending}
        >
          Create center
        </Button>
      </Card>
      <Card title="All centers">
        <DataList
          items={centers.data ?? []}
          empty="No centers yet."
          render={(c) => {
            const editing = editingId === c.id;
            return (
              <ListRow
                aside={
                  <CrudRowActions
                    editing={editing}
                    onEdit={() => startEdit(c)}
                    onSave={() => updateCenter.mutate(c.id)}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => deleteCenter.mutate(c.id)}
                    saveDisabled={!editForm.slug.trim() || !editForm.name.trim() || updateCenter.isPending}
                  />
                }
              >
                {editing ? (
                  <div className="ed-form-section">
                    <Input label="Name" value={editForm.name} onChange={(v) => setEditForm((f) => ({ ...f, name: v }))} />
                    <Input label="Slug" value={editForm.slug} onChange={(v) => setEditForm((f) => ({ ...f, slug: v }))} />
                    <Select label="Status" value={editForm.status} onChange={(v) => setEditForm((f) => ({ ...f, status: v }))} options={STATUS_OPTIONS} />
                    <Input label="City" value={editForm.city} onChange={(v) => setEditForm((f) => ({ ...f, city: v }))} />
                    <Input label="Address" value={editForm.address_line1} onChange={(v) => setEditForm((f) => ({ ...f, address_line1: v }))} />
                  </div>
                ) : (
                  <div>
                    <strong>{c.name}</strong>
                    <div className="ed-text-sm ed-muted">{c.slug}</div>
                    {c.city && <div className="ed-text-sm ed-muted">{c.city}</div>}
                    <Badge tone={c.status === "active" ? "success" : c.status === "suspended" ? "warning" : "default"}>
                      {c.status}
                    </Badge>
                  </div>
                )}
              </ListRow>
            );
          }}
        />
      </Card>
    </>
  );
}
