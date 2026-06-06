import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  FormGrid,
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
import { AddFormSection } from "@/features/shared/AddFormSection";
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

const emptyEditForm = {
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);

  const centers = useQuery({
    queryKey: ["centers", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("franchise_centers")
        .select("id, slug, name, status, city, address_line1, region, country")
        .eq("brand_id", brandId!)
        .is("deleted_at", null)
        .order("name");
      return supabaseList(data, qErr) as Center[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["centers", brandId] });

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

      <AddFormSection buttonLabel="Add center" panelTitle="Add a new center">
        <>
          <p className="ed-text-sm ed-muted">
            New centers are provisioned when you approve a franchise application — that creates the center record and{" "}
            <code>{`{center}.{brand}`}</code> domain mapping in one step.
          </p>
          <Link to="/app/franchise-applications">
            <Button>Go to franchise applications</Button>
          </Link>
        </>
      </AddFormSection>

      <Card title="Centers">
        <DataList
          items={centers.data ?? []}
          empty="No centers yet. Approve a franchise application to provision the first center."
          render={(c) => {
            const editing = editingId === c.id;
            return (
              <ListRow
                aside={
                  <>
                    {!editing && (
                      <Link to={`/app/centers/${c.slug}`}>
                        <Button variant="primary">View</Button>
                      </Link>
                    )}
                    <CrudRowActions
                      editing={editing}
                      onEdit={() => startEdit(c)}
                      onSave={() => updateCenter.mutate(c.id)}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => deleteCenter.mutate(c.id)}
                      deleteDescription="The center will be removed from active lists. Historical data is kept."
                      saveDisabled={!editForm.slug.trim() || !editForm.name.trim() || updateCenter.isPending}
                    />
                  </>
                }
              >
                {editing ? (
                  <div className="ed-editable-form">
                    <FormGrid columns={3}>
                      <Input
                        label="Name"
                        value={editForm.name}
                        onChange={(v) => setEditForm((f) => ({ ...f, name: v }))}
                        editable
                      />
                      <Input
                        label="Slug"
                        value={editForm.slug}
                        onChange={(v) => setEditForm((f) => ({ ...f, slug: v }))}
                        editable
                      />
                      <Select
                        label="Status"
                        value={editForm.status}
                        onChange={(v) => setEditForm((f) => ({ ...f, status: v }))}
                        options={STATUS_OPTIONS}
                        editable
                      />
                      <Input
                        label="City"
                        value={editForm.city}
                        onChange={(v) => setEditForm((f) => ({ ...f, city: v }))}
                        editable
                      />
                      <Input
                        label="Address"
                        value={editForm.address_line1}
                        onChange={(v) => setEditForm((f) => ({ ...f, address_line1: v }))}
                        editable
                      />
                      <Input
                        label="Region"
                        value={editForm.region}
                        onChange={(v) => setEditForm((f) => ({ ...f, region: v }))}
                        editable
                      />
                    </FormGrid>
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
