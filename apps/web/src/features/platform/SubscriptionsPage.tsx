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
import { CrudRowActions } from "./components/CrudRowActions";
import { useMutationError } from "./hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";

interface Plan {
  id: string;
  code: string;
  name: string;
  price_cents: number;
  currency: string;
  billing_interval: string;
  is_active: boolean;
}

interface BrandOption {
  id: string;
  name: string;
}

interface BrandSubscription {
  id: string;
  brand_id: string;
  plan_id: string;
  status: string;
  brands?: { name: string } | null;
  subscription_plans?: { name: string } | null;
}

type SubStatus = "active" | "past_due" | "cancelled" | "trialing";

const SUB_STATUS_OPTIONS: { value: SubStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "trialing", label: "Trialing" },
  { value: "past_due", label: "Past due" },
  { value: "cancelled", label: "Cancelled" },
];

const emptyPlan = { code: "", name: "", price_cents: "", billing_interval: "month", is_active: true };

export function SubscriptionsPage() {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState(emptyPlan);

  const [subForm, setSubForm] = useState({ brand_id: "", plan_id: "", status: "active" as SubStatus });
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSub, setEditSub] = useState({ brand_id: "", plan_id: "", status: "active" as SubStatus });
  const planCloser = useAddFormCloser();
  const subCloser = useAddFormCloser();

  const plans = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase().from("subscription_plans").select("*").order("price_cents");
      return supabaseList(data, qErr) as Plan[];
    },
  });

  const brands = useQuery({
    queryKey: ["brands-options"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brands")
        .select("id, name")
        .is("deleted_at", null)
        .order("name");
      return supabaseList(data, qErr) as BrandOption[];
    },
  });

  const subs = useQuery({
    queryKey: ["brand-subscriptions"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brand_subscriptions")
        .select("*, brands(name), subscription_plans(name)")
        .order("created_at", { ascending: false });
      return supabaseList(data, qErr) as BrandSubscription[];
    },
  });

  const brandOptions = (brands.data ?? []).map((b) => ({ value: b.id, label: b.name }));
  const planOptions = (plans.data ?? []).map((p) => ({ value: p.id, label: p.name }));

  const invalidatePlans = () => {
    qc.invalidateQueries({ queryKey: ["subscription-plans"] });
    qc.invalidateQueries({ queryKey: ["platform-stats"] });
  };
  const invalidateSubs = () => qc.invalidateQueries({ queryKey: ["brand-subscriptions"] });

  const createPlan = useMutation({
    mutationFn: async () => {
      clear();
      const { error: mErr } = await getSupabase().from("subscription_plans").insert({
        code: planForm.code.trim(),
        name: planForm.name.trim(),
        price_cents: Number(planForm.price_cents) || 0,
        billing_interval: planForm.billing_interval,
        is_active: planForm.is_active,
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidatePlans();
      setPlanForm(emptyPlan);
      planCloser.closeAddForm();
    },
    onError: capture,
  });

  const updatePlan = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("subscription_plans")
        .update({
          code: editPlan.code.trim(),
          name: editPlan.name.trim(),
          price_cents: Number(editPlan.price_cents) || 0,
          billing_interval: editPlan.billing_interval,
          is_active: editPlan.is_active,
        })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidatePlans();
      setEditingPlanId(null);
    },
    onError: capture,
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      clear();
      if (!confirm("Delete this plan? Brands must not reference it.")) return;
      const { error: mErr } = await getSupabase().from("subscription_plans").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidatePlans,
    onError: capture,
  });

  const createSub = useMutation({
    mutationFn: async () => {
      clear();
      const { error: mErr } = await getSupabase().from("brand_subscriptions").insert({
        brand_id: subForm.brand_id,
        plan_id: subForm.plan_id,
        status: subForm.status,
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidateSubs();
      setSubForm({ brand_id: "", plan_id: "", status: "active" });
      subCloser.closeAddForm();
    },
    onError: capture,
  });

  const updateSub = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("brand_subscriptions")
        .update({
          brand_id: editSub.brand_id,
          plan_id: editSub.plan_id,
          status: editSub.status,
        })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidateSubs();
      setEditingSubId(null);
    },
    onError: capture,
  });

  const deleteSub = useMutation({
    mutationFn: async (id: string) => {
      clear();
      if (!confirm("Remove this brand subscription?")) return;
      const { error: mErr } = await getSupabase().from("brand_subscriptions").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidateSubs,
    onError: capture,
  });

  const formatPrice = (cents: number) => `₹${(cents / 100).toLocaleString()}`;

  return (
    <>
      <PageTitle>Subscriptions & Billing</PageTitle>
      <MutationError message={error} />

      <AddFormSection buttonLabel="Create plan" panelTitle="Create plan">
        {({ close }) => {
          planCloser.bindClose(close);
          return (
            <>
              <Input label="Code" value={planForm.code} onChange={(v) => setPlanForm((f) => ({ ...f, code: v }))} placeholder="growth" />
              <Input label="Name" value={planForm.name} onChange={(v) => setPlanForm((f) => ({ ...f, name: v }))} placeholder="Growth" />
              <Input
                label="Price (paise)"
                value={planForm.price_cents}
                onChange={(v) => setPlanForm((f) => ({ ...f, price_cents: v }))}
                type="number"
                placeholder="2499900"
              />
              <Input
                label="Billing interval"
                value={planForm.billing_interval}
                onChange={(v) => setPlanForm((f) => ({ ...f, billing_interval: v }))}
                placeholder="month"
              />
              <Button
                onClick={() => createPlan.mutate()}
                disabled={!planForm.code.trim() || !planForm.name.trim() || createPlan.isPending}
              >
                Create plan
              </Button>
            </>
          );
        }}
      </AddFormSection>

      <Card title="Plans">
        <DataList
          items={plans.data ?? []}
          empty="No plans yet."
          render={(p) => {
            const editing = editingPlanId === p.id;
            return (
              <ListRow
                aside={
                  <CrudRowActions
                    editing={editing}
                    onEdit={() => {
                      clear();
                      setEditingPlanId(p.id);
                      setEditPlan({
                        code: p.code,
                        name: p.name,
                        price_cents: String(p.price_cents),
                        billing_interval: p.billing_interval,
                        is_active: p.is_active,
                      });
                    }}
                    onSave={() => updatePlan.mutate(p.id)}
                    onCancel={() => setEditingPlanId(null)}
                    onDelete={() => deletePlan.mutate(p.id)}
                    saveDisabled={!editPlan.code.trim() || !editPlan.name.trim()}
                  />
                }
              >
                {editing ? (
                  <div className="ed-form-section">
                    <Input label="Code" value={editPlan.code} onChange={(v) => setEditPlan((f) => ({ ...f, code: v }))} />
                    <Input label="Name" value={editPlan.name} onChange={(v) => setEditPlan((f) => ({ ...f, name: v }))} />
                    <Input
                      label="Price (paise)"
                      value={editPlan.price_cents}
                      onChange={(v) => setEditPlan((f) => ({ ...f, price_cents: v }))}
                      type="number"
                    />
                    <Input
                      label="Billing interval"
                      value={editPlan.billing_interval}
                      onChange={(v) => setEditPlan((f) => ({ ...f, billing_interval: v }))}
                    />
                  </div>
                ) : (
                  <span>
                    {p.name} — {formatPrice(p.price_cents)}/{p.billing_interval}
                    {!p.is_active && (
                      <>
                        {" "}
                        <Badge tone="warning">inactive</Badge>
                      </>
                    )}
                  </span>
                )}
              </ListRow>
            );
          }}
        />
      </Card>

      <AddFormSection buttonLabel="Assign subscription" panelTitle="Assign subscription">
        {({ close }) => {
          subCloser.bindClose(close);
          return (
            <>
              <Select
                label="Brand"
                value={subForm.brand_id}
                onChange={(v) => setSubForm((f) => ({ ...f, brand_id: v }))}
                options={brandOptions}
                placeholder="Select brand"
              />
              <Select
                label="Plan"
                value={subForm.plan_id}
                onChange={(v) => setSubForm((f) => ({ ...f, plan_id: v }))}
                options={planOptions}
                placeholder="Select plan"
              />
              <Select label="Status" value={subForm.status} onChange={(v) => setSubForm((f) => ({ ...f, status: v }))} options={SUB_STATUS_OPTIONS} />
              <Button
                onClick={() => createSub.mutate()}
                disabled={!subForm.brand_id || !subForm.plan_id || createSub.isPending}
              >
                Assign plan
              </Button>
            </>
          );
        }}
      </AddFormSection>

      <Card title="Brand subscriptions">
        <DataList
          items={subs.data ?? []}
          empty="No brand subscriptions."
          render={(s) => {
            const editing = editingSubId === s.id;
            return (
              <ListRow
                aside={
                  <CrudRowActions
                    editing={editing}
                    onEdit={() => {
                      clear();
                      setEditingSubId(s.id);
                      setEditSub({ brand_id: s.brand_id, plan_id: s.plan_id, status: s.status as SubStatus });
                    }}
                    onSave={() => updateSub.mutate(s.id)}
                    onCancel={() => setEditingSubId(null)}
                    onDelete={() => deleteSub.mutate(s.id)}
                    saveDisabled={!editSub.brand_id || !editSub.plan_id}
                  />
                }
              >
                {editing ? (
                  <div className="ed-form-section">
                    <Select label="Brand" value={editSub.brand_id} onChange={(v) => setEditSub((f) => ({ ...f, brand_id: v }))} options={brandOptions} />
                    <Select label="Plan" value={editSub.plan_id} onChange={(v) => setEditSub((f) => ({ ...f, plan_id: v }))} options={planOptions} />
                    <Select
                      label="Status"
                      value={editSub.status}
                      onChange={(v) => setEditSub((f) => ({ ...f, status: v }))}
                      options={SUB_STATUS_OPTIONS}
                    />
                  </div>
                ) : (
                  <span>
                    {s.brands?.name ?? "Brand"} — {s.subscription_plans?.name ?? "Plan"}{" "}
                    <Badge tone={s.status === "active" ? "success" : "default"}>{s.status}</Badge>
                  </span>
                )}
              </ListRow>
            );
          }}
        />
      </Card>
    </>
  );
}
