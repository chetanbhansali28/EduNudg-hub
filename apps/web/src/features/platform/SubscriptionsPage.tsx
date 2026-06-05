import { useState, type Dispatch, type SetStateAction } from "react";
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
  ToggleField,
  ToggleGrid,
} from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { formatInrFromPaise, paiseToRupeesInput, rupeesToPaise } from "@/lib/inrCurrency";
import {
  emptyPlanFeaturesForm,
  parsePlanFeatures,
  planFeaturesFromForm,
  planFeaturesToForm,
  pricingFeatureBullets,
  type SubscriptionPlanFeatures,
} from "@/lib/subscriptionPlanFeatures";
import { CrudRowActions } from "./components/CrudRowActions";
import { useMutationError } from "./hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import { PlanFeaturesEditor } from "./subscriptions/PlanFeaturesEditor";

interface Plan {
  id: string;
  code: string;
  name: string;
  price_cents: number;
  currency: string;
  billing_interval: string;
  is_active: boolean;
  is_default: boolean;
  features: SubscriptionPlanFeatures;
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

type PlanForm = {
  code: string;
  name: string;
  priceRupees: string;
  billing_interval: string;
  is_active: string;
  is_default: string;
  features: Record<keyof SubscriptionPlanFeatures, string>;
};

function emptyPlanForm(): PlanForm {
  return {
    code: "",
    name: "",
    priceRupees: "",
    billing_interval: "month",
    is_active: "true",
    is_default: "false",
    features: emptyPlanFeaturesForm(),
  };
}

function planToForm(p: Plan): PlanForm {
  return {
    code: p.code,
    name: p.name,
    priceRupees: paiseToRupeesInput(p.price_cents),
    billing_interval: p.billing_interval,
    is_active: String(p.is_active),
    is_default: String(p.is_default),
    features: planFeaturesToForm(p.features),
  };
}

function formToPayload(form: PlanForm) {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    price_cents: rupeesToPaise(form.priceRupees),
    currency: "INR",
    billing_interval: form.billing_interval,
    is_active: form.is_active === "true",
    is_default: form.is_default === "true",
    features: planFeaturesFromForm(form.features),
  };
}

export function SubscriptionsPage() {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [planForm, setPlanForm] = useState<PlanForm>(emptyPlanForm());
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<PlanForm>(emptyPlanForm());

  const [subForm, setSubForm] = useState({ brand_id: "", plan_id: "", status: "active" as SubStatus });
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSub, setEditSub] = useState({ brand_id: "", plan_id: "", status: "active" as SubStatus });
  const planCloser = useAddFormCloser();
  const subCloser = useAddFormCloser();

  const plans = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase().from("subscription_plans").select("*").order("price_cents");
      const rows = supabaseList(data, qErr) as (Omit<Plan, "features"> & { features?: unknown })[];
      return rows.map((row) => ({ ...row, features: parsePlanFeatures(row.features) }));
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
    qc.invalidateQueries({ queryKey: ["public-subscription-plans"] });
    qc.invalidateQueries({ queryKey: ["platform-stats"] });
  };
  const invalidateSubs = () => qc.invalidateQueries({ queryKey: ["brand-subscriptions"] });

  const createPlan = useMutation({
    mutationFn: async () => {
      clear();
      const { error: mErr } = await getSupabase().from("subscription_plans").insert(formToPayload(planForm));
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidatePlans();
      setPlanForm(emptyPlanForm());
      planCloser.closeAddForm();
    },
    onError: capture,
  });

  const updatePlan = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase().from("subscription_plans").update(formToPayload(editPlan)).eq("id", id);
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
      const { error: mErr } = await getSupabase().from("brand_subscriptions").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidateSubs,
    onError: capture,
  });

  const renderPlanFields = (
    form: PlanForm,
    setForm: Dispatch<SetStateAction<PlanForm>>
  ) => (
    <>
      <FormGrid>
        <Input label="Code" value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v }))} placeholder="growth" />
        <Input label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Growth" />
        <Input
          label="Price (₹ / month)"
          value={form.priceRupees}
          onChange={(v) => setForm((f) => ({ ...f, priceRupees: v }))}
          type="number"
          step="0.01"
          placeholder="9999.00"
        />
        <Input
          label="Billing interval"
          value={form.billing_interval}
          onChange={(v) => setForm((f) => ({ ...f, billing_interval: v }))}
          placeholder="month"
        />
      </FormGrid>
      <ToggleGrid>
        <ToggleField
          label="Active"
          checked={form.is_active === "true"}
          onChange={(checked) => setForm((f) => ({ ...f, is_active: String(checked) }))}
        />
        <ToggleField
          label="Default plan for new brands"
          checked={form.is_default === "true"}
          onChange={(checked) => setForm((f) => ({ ...f, is_default: String(checked) }))}
        />
      </ToggleGrid>
      <PlanFeaturesEditor
        values={form.features}
        onChange={(key, value) => setForm((f) => ({ ...f, features: { ...f.features, [key]: value } }))}
      />
    </>
  );

  return (
    <>
      <PageTitle>Subscriptions & Billing</PageTitle>
      <MutationError message={error} />
      <p className="ed-text-sm ed-muted">
        Prices are in Indian Rupees (INR). The default plan is assigned automatically when a brand signup is approved.
      </p>

      <AddFormSection buttonLabel="Create plan" panelTitle="Create plan">
        {({ close }) => {
          planCloser.bindClose(close);
          return (
            <>
              {renderPlanFields(planForm, setPlanForm)}
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
        {(plans.data ?? []).length === 0 ? (
          <p className="ed-empty">No plans yet.</p>
        ) : (
          <div className="ed-plan-cards">
            {(plans.data ?? []).map((p) => {
              const editing = editingPlanId === p.id;
              const bullets = pricingFeatureBullets(p.features);
              return (
                <article
                  key={p.id}
                  className={`ed-plan-card${p.is_default ? " ed-plan-card--highlight" : ""}${editing ? " ed-plan-card--editing" : ""}`}
                >
                  {editing ? (
                    <>
                      <div className="ed-form-section">{renderPlanFields(editPlan, setEditPlan)}</div>
                      <div className="ed-plan-card__actions">
                        <CrudRowActions
                          editing
                          onEdit={() => undefined}
                          onSave={() => updatePlan.mutate(p.id)}
                          onCancel={() => setEditingPlanId(null)}
                          onDelete={() => deletePlan.mutate(p.id)}
                          deleteDescription="Brands must not reference this plan."
                          saveDisabled={!editPlan.code.trim() || !editPlan.name.trim() || updatePlan.isPending}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="ed-plan-card__header">
                        <h3 className="ed-plan-card__name">{p.name}</h3>
                        {!p.is_active && <Badge tone="warning">inactive</Badge>}
                        {p.is_default && <Badge tone="success">default plan</Badge>}
                      </div>
                      <p className="ed-plan-card__price">
                        {formatInrFromPaise(p.price_cents, p.currency)}
                        <span className="ed-plan-card__interval">/{p.billing_interval}</span>
                      </p>
                      <ul className="ed-plan-card__features">
                        {bullets.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <div className="ed-plan-card__actions">
                        <CrudRowActions
                          editing={false}
                          onEdit={() => {
                            clear();
                            setEditingPlanId(p.id);
                            setEditPlan(planToForm(p));
                          }}
                          onSave={() => undefined}
                          onCancel={() => undefined}
                          onDelete={() => deletePlan.mutate(p.id)}
                          deleteDescription="Brands must not reference this plan."
                        />
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
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
                    deleteDescription="This removes the brand's platform subscription assignment."
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
