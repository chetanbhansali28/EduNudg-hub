import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { brandAdminPath } from "@/lib/adminPaths";
import { brandPortalUrl } from "@/lib/brandPortalUrl";
import { uniqueBrandSlug } from "@/lib/brandSlug";
import { Badge, Button, Card, DataList, FormGrid, Input, ListRow, MutationError, PageTitle, PasswordInput, Select } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { BrandLogoUpload } from "@/features/brand/BrandLogoUpload";
import { PlatformSignupRequestsPanel } from "@/features/platform/brandSignups/PlatformSignupRequestsPanel";
import { ManualPlatformBrandSignupCard } from "@/features/platform/brandSignups/ManualPlatformBrandSignupCard";
import { fetchBrandOwnerLoginEmail, upsertBrandOwnerCredentials } from "@/lib/brandOwnerCredentialsApi";
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

const emptyEditForm = { name: "", status: "draft" as BrandStatus, loginEmail: "", password: "" };

export function BrandsPage() {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [originalLoginEmail, setOriginalLoginEmail] = useState<string | null>(null);

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

  const updateBrand = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const slug = await uniqueBrandSlug(editForm.name.trim(), { excludeBrandId: id });
      const { error: mErr } = await getSupabase()
        .from("brands")
        .update({
          slug,
          name: editForm.name.trim(),
          status: editForm.status,
        })
        .eq("id", id);
      if (mErr) throw mErr;

      const loginEmail = editForm.loginEmail.trim();
      if (loginEmail) {
        if (!originalLoginEmail && !editForm.password.trim()) {
          throw new Error("Password required for a new brand login");
        }
        const { error: credErr } = await upsertBrandOwnerCredentials({
          brandId: id,
          email: loginEmail,
          password: editForm.password.trim() || undefined,
          fullName: editForm.name.trim(),
        });
        if (credErr) throw new Error(credErr);
      }
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      setOriginalLoginEmail(null);
    },
    onError: capture,
  });

  const deleteBrand = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("brands")
        .update({ deleted_at: new Date().toISOString(), status: "archived" })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidate,
    onError: capture,
  });

  const startEdit = async (b: Brand) => {
    clear();
    setEditingId(b.id);
    let loginEmail = "";
    try {
      loginEmail = (await fetchBrandOwnerLoginEmail(b.id)) ?? "";
    } catch {
      loginEmail = "";
    }
    setOriginalLoginEmail(loginEmail || null);
    setEditForm({
      name: b.name,
      status: b.status,
      loginEmail,
      password: "",
    });
  };

  const editingBrand = brands.data?.find((b) => b.id === editingId);

  return (
    <>
      <PageTitle>Brands</PageTitle>
      <MutationError message={error} />

      <ManualPlatformBrandSignupCard />
      <PlatformSignupRequestsPanel />

      <Card title="Brands">
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
                      onCancel={() => {
                        setEditingId(null);
                        setOriginalLoginEmail(null);
                      }}
                      onDelete={() => deleteBrand.mutate(b.id)}
                      deleteDescription="Related data remains but the brand is hidden from lists."
                      deleteTitle="Archive this brand?"
                      saveDisabled={!editForm.name.trim() || updateBrand.isPending}
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
                      <Select
                        label="Status"
                        value={editForm.status}
                        onChange={(v) => setEditForm((f) => ({ ...f, status: v }))}
                        options={STATUS_OPTIONS}
                        editable
                      />
                      <BrandLogoUpload
                        brandId={b.id}
                        currentLogoUrl={editingBrand?.logo_url}
                        editable
                      />
                      <Input
                        label="Login email"
                        value={editForm.loginEmail}
                        onChange={(v) => setEditForm((f) => ({ ...f, loginEmail: v }))}
                        type="email"
                        editable
                      />
                      <PasswordInput
                        label="Password"
                        value={editForm.password}
                        onChange={(v) => setEditForm((f) => ({ ...f, password: v }))}
                        placeholder={originalLoginEmail ? "Leave blank to keep current password" : "Required for new login"}
                      />
                    </FormGrid>
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
