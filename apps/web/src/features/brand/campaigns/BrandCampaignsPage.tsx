import { useState } from "react";
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
  PageGridFull,
  PageTitle,
  Textarea,
  ToggleField,
} from "@edunudg/ui";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { deleteBrandCampaign, listBrandCampaigns, upsertBrandCampaign } from "@/lib/campaignsApi";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";

const emptyForm = {
  name: "",
  description: "",
  goalType: "enrollment",
  startsAt: "",
  endsAt: "",
  isActive: false,
};

export function BrandCampaignsPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const { bindClose, closeAddForm } = useAddFormCloser();

  const campaigns = useQuery({
    queryKey: ["brand-campaigns", brandId],
    enabled: !!brandId,
    queryFn: () => listBrandCampaigns(brandId!),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["brand-campaigns", brandId] });

  const create = useMutation({
    mutationFn: async () => {
      if (!brandId) throw new Error("Brand required");
      clear();
      await upsertBrandCampaign(brandId, form);
    },
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
      closeAddForm();
    },
    onError: capture,
  });

  const update = useMutation({
    mutationFn: async (id: string) => {
      if (!brandId) throw new Error("Brand required");
      clear();
      await upsertBrandCampaign(brandId, { ...editForm, id });
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
    onError: capture,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!brandId) throw new Error("Brand required");
      clear();
      await deleteBrandCampaign(brandId, id);
    },
    onSuccess: invalidate,
    onError: capture,
  });

  if (missingBrand) return <p className="ed-empty">Brand context not found.</p>;

  const toLocalDatetime = (iso: string | null) => (iso ? iso.slice(0, 16) : "");

  return (
    <>
      <PageTitle>Campaigns</PageTitle>
      <p className="ed-text-sm ed-muted">Enrollment and marketing campaigns visible to franchise centers when active.</p>
      <MutationError message={error} />

      <PageGridFull>
        <AddFormSection buttonLabel="Add campaign" panelTitle="Create campaign">
          {({ close }) => {
            bindClose(close);
            return (
              <>
                <FormGrid>
                  <Input label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                  <Input
                    label="Goal type"
                    value={form.goalType}
                    onChange={(v) => setForm((f) => ({ ...f, goalType: v }))}
                    placeholder="enrollment"
                  />
                  <Input label="Starts" value={form.startsAt} onChange={(v) => setForm((f) => ({ ...f, startsAt: v }))} type="datetime-local" />
                  <Input label="Ends" value={form.endsAt} onChange={(v) => setForm((f) => ({ ...f, endsAt: v }))} type="datetime-local" />
                </FormGrid>
                <Textarea label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} />
                <ToggleField
                  label="Active"
                  description="Visible to franchise centers"
                  checked={form.isActive}
                  onChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
                />
                <Button onClick={() => create.mutate()} disabled={!form.name.trim() || create.isPending}>
                  Create campaign
                </Button>
              </>
            );
          }}
        </AddFormSection>
      </PageGridFull>

      <PageGridFull>
        <Card title="Campaigns">
          <DataList
            items={campaigns.data ?? []}
            empty="No campaigns yet."
            render={(c) => {
              const editing = editingId === c.id;
              return (
                <ListRow
                  aside={
                    <CrudRowActions
                      editing={editing}
                      onEdit={() => {
                        setEditingId(c.id);
                        setEditForm({
                          name: c.name,
                          description: c.description ?? "",
                          goalType: c.goal_type,
                          startsAt: toLocalDatetime(c.starts_at),
                          endsAt: toLocalDatetime(c.ends_at),
                          isActive: c.is_active,
                        });
                      }}
                      onSave={() => update.mutate(c.id)}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => remove.mutate(c.id)}
                      saveDisabled={!editForm.name.trim() || update.isPending}
                    />
                  }
                >
                  {editing ? (
                    <div className="ed-form-section">
                      <FormGrid>
                        <Input label="Name" value={editForm.name} onChange={(v) => setEditForm((f) => ({ ...f, name: v }))} />
                        <Input
                          label="Goal type"
                          value={editForm.goalType}
                          onChange={(v) => setEditForm((f) => ({ ...f, goalType: v }))}
                        />
                        <Input
                          label="Starts"
                          value={editForm.startsAt}
                          onChange={(v) => setEditForm((f) => ({ ...f, startsAt: v }))}
                          type="datetime-local"
                        />
                        <Input
                          label="Ends"
                          value={editForm.endsAt}
                          onChange={(v) => setEditForm((f) => ({ ...f, endsAt: v }))}
                          type="datetime-local"
                        />
                      </FormGrid>
                      <Textarea
                        label="Description"
                        value={editForm.description}
                        onChange={(v) => setEditForm((f) => ({ ...f, description: v }))}
                      />
                      <ToggleField
                        label="Active"
                        checked={editForm.isActive}
                        onChange={(checked) => setEditForm((f) => ({ ...f, isActive: checked }))}
                      />
                    </div>
                  ) : (
                    <div>
                      <strong>{c.name}</strong>
                      <Badge tone={c.is_active ? "success" : "default"}>{c.is_active ? "Active" : "Draft"}</Badge>
                      <div className="ed-text-sm ed-muted">{c.goal_type}</div>
                      {c.description && <p className="ed-text-sm">{c.description}</p>}
                      {(c.starts_at || c.ends_at) && (
                        <div className="ed-text-sm ed-muted">
                          {c.starts_at ? new Date(c.starts_at).toLocaleString() : "ù"} ?{" "}
                          {c.ends_at ? new Date(c.ends_at).toLocaleString() : "ù"}
                        </div>
                      )}
                    </div>
                  )}
                </ListRow>
              );
            }}
          />
        </Card>
      </PageGridFull>
    </>
  );
}
