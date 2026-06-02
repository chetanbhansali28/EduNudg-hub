import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { brandAdminPath } from "@/lib/adminPaths";
import { brandPortalUrl } from "@/lib/brandPortalUrl";
import { Badge, Button, Card, DataList, Input, ListRow, MutationError, PageTitle, Select } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { CrudRowActions } from "./components/CrudRowActions";
import { useMutationError } from "./hooks/useMutationError";

type BrandStatus = "draft" | "active" | "suspended" | "archived";

interface Brand {
  id: string;
  slug: string;
  name: string;
  status: BrandStatus;
  logo_url: string | null;
}

const STATUS_OPTIONS: { value: BrandStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "archived", label: "Archived" },
];

const emptyForm = { slug: "", name: "", status: "draft" as BrandStatus, logo_url: "" };

export function BrandsPage() {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const brands = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brands")
        .select("id, slug, name, status, logo_url")
        .is("deleted_at", null)
        .order("name");
      return supabaseList(data, qErr) as Brand[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["brands"] });
    qc.invalidateQueries({ queryKey: ["platform-stats"] });
  };

  const createBrand = useMutation({
    mutationFn: async () => {
      clear();
      const { error: mErr } = await getSupabase().from("brands").insert({
        slug: form.slug.trim(),
        name: form.name.trim(),
        status: form.status,
        logo_url: form.logo_url.trim() || null,
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
    },
    onError: capture,
  });

  const updateBrand = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("brands")
        .update({
          slug: editForm.slug.trim(),
          name: editForm.name.trim(),
          status: editForm.status,
          logo_url: editForm.logo_url.trim() || null,
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

  const deleteBrand = useMutation({
    mutationFn: async (id: string) => {
      clear();
      if (!confirm("Archive this brand? Related data remains but the brand is hidden from lists.")) return;
      const { error: mErr } = await getSupabase()
        .from("brands")
        .update({ deleted_at: new Date().toISOString(), status: "archived" })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidate,
    onError: capture,
  });

  const startEdit = (b: Brand) => {
    clear();
    setEditingId(b.id);
    setEditForm({
      slug: b.slug,
      name: b.name,
      status: b.status,
      logo_url: b.logo_url ?? "",
    });
  };

  return (
    <>
      <PageTitle>Brands</PageTitle>
      <MutationError message={error} />
      <Card title="Create brand">
        <Input label="Slug" value={form.slug} onChange={(v) => setForm((f) => ({ ...f, slug: v }))} placeholder="abacusworld" />
        <Input label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Abacus World" />
        <Input
          label="Logo URL"
          value={form.logo_url}
          onChange={(v) => setForm((f) => ({ ...f, logo_url: v }))}
          placeholder="https://…"
        />
        <Select label="Status" value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} options={STATUS_OPTIONS} />
        <Button onClick={() => createBrand.mutate()} disabled={!form.slug.trim() || !form.name.trim() || createBrand.isPending}>
          Create brand
        </Button>
      </Card>
      <Card title="All brands">
        <DataList
          items={brands.data ?? []}
          empty="No brands yet."
          render={(b) => {
            const editing = editingId === b.id;
            return (
              <ListRow
                aside={
                  <>
                    {!editing && (
                      <Button
                        variant="ghost"
                        onClick={() => window.open(brandPortalUrl(b.slug), "_blank", "noopener,noreferrer")}
                      >
                        Brand backend
                      </Button>
                    )}
                    <CrudRowActions
                      editing={editing}
                      onEdit={() => startEdit(b)}
                      onSave={() => updateBrand.mutate(b.id)}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => deleteBrand.mutate(b.id)}
                      saveDisabled={!editForm.slug.trim() || !editForm.name.trim() || updateBrand.isPending}
                    />
                  </>
                }
              >
                {editing ? (
                  <div className="ed-form-section">
                    <Input label="Name" value={editForm.name} onChange={(v) => setEditForm((f) => ({ ...f, name: v }))} />
                    <Input label="Slug" value={editForm.slug} onChange={(v) => setEditForm((f) => ({ ...f, slug: v }))} />
                    <Input
                      label="Logo URL"
                      value={editForm.logo_url}
                      onChange={(v) => setEditForm((f) => ({ ...f, logo_url: v }))}
                    />
                    <Select
                      label="Status"
                      value={editForm.status}
                      onChange={(v) => setEditForm((f) => ({ ...f, status: v }))}
                      options={STATUS_OPTIONS}
                    />
                  </div>
                ) : (
                  <div>
                    <Link to={brandAdminPath(b.slug)} className="ed-brand-name-link">
                      <strong>{b.name}</strong>
                    </Link>
                    <div className="ed-text-sm ed-muted">{b.slug}</div>
                    <Badge tone={b.status === "active" ? "success" : b.status === "suspended" ? "warning" : "default"}>
                      {b.status}
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
