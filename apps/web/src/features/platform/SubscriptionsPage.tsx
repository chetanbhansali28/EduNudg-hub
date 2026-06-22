import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { paiseToRupeesInput, rupeesToPaise } from "@/lib/inrCurrency";
import {
  emptyPlanFeaturesForm,
  parsePlanFeatures,
  planFeaturesFromForm,
  planFeaturesToForm,
} from "@/lib/subscriptionPlanFeatures";
import { useMutationError } from "./hooks/useMutationError";
import { logPlatformAudit } from "@/lib/platformAuditApi";
import {
  SubscriptionsPageView,
  type BrandSubscription,
  type SubStatus,
  type SubscriptionPlan,
} from "./SubscriptionsPageView";
import type { PlanForm } from "./subscriptions/SubscriptionPlanEditorFields";

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

function planToForm(plan: SubscriptionPlan): PlanForm {
  return {
    code: plan.code,
    name: plan.name,
    priceRupees: paiseToRupeesInput(plan.price_cents),
    billing_interval: plan.billing_interval,
    is_active: String(plan.is_active),
    is_default: String(plan.is_default),
    features: planFeaturesToForm(plan.features),
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
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<PlanForm>(emptyPlanForm());

  const [subForm, setSubForm] = useState({ brand_id: "", plan_id: "", status: "active" as SubStatus });
  const [assignOpen, setAssignOpen] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSub, setEditSub] = useState({ brand_id: "", plan_id: "", status: "active" as SubStatus });

  const plans = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase().from("subscription_plans").select("*").order("price_cents");
      const rows = supabaseList(data, qErr) as (Omit<SubscriptionPlan, "features"> & { features?: unknown })[];
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
      return supabaseList(data, qErr) as { id: string; name: string }[];
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

  const brandOptions = (brands.data ?? []).map((brand) => ({ value: brand.id, label: brand.name }));

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
      const code = planForm.code.trim();
      invalidatePlans();
      setPlanForm(emptyPlanForm());
      setCreatePlanOpen(false);
      void logPlatformAudit({ action: "create", resource_type: "subscription_plan", payload: { code } });
    },
    onError: capture,
  });

  const updatePlan = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase().from("subscription_plans").update(formToPayload(editPlan)).eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: (_data, id) => {
      invalidatePlans();
      setEditingPlanId(null);
      void logPlatformAudit({ action: "update", resource_type: "subscription_plan", resource_id: id });
    },
    onError: capture,
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase().from("subscription_plans").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: (_data, id) => {
      invalidatePlans();
      setEditingPlanId(null);
      void logPlatformAudit({ action: "delete", resource_type: "subscription_plan", resource_id: id });
    },
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
      const { brand_id, plan_id, status } = subForm;
      invalidateSubs();
      setSubForm({ brand_id: "", plan_id: "", status: "active" });
      setAssignOpen(false);
      void logPlatformAudit({
        action: "assign",
        resource_type: "brand_subscription",
        brand_id,
        payload: { plan_id, status },
      });
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
    onSuccess: (_data, id) => {
      invalidateSubs();
      setEditingSubId(null);
      void logPlatformAudit({
        action: "update",
        resource_type: "brand_subscription",
        resource_id: id,
        brand_id: editSub.brand_id,
        payload: { plan_id: editSub.plan_id, status: editSub.status },
      });
    },
    onError: capture,
  });

  const deleteSub = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase().from("brand_subscriptions").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: (_data, id) => {
      invalidateSubs();
      void logPlatformAudit({ action: "delete", resource_type: "brand_subscription", resource_id: id });
    },
    onError: capture,
  });

  return (
    <SubscriptionsPageView
      plans={plans.data ?? []}
      brandOptions={brandOptions}
      subscriptions={subs.data ?? []}
      error={error}
      editingPlanId={editingPlanId}
      editPlan={editPlan}
      onEditPlan={(plan) => {
        clear();
        setEditingPlanId(plan.id);
        setEditPlan(planToForm(plan));
      }}
      onEditPlanChange={setEditPlan}
      onDiscardPlanEdit={() => setEditingPlanId(null)}
      onSavePlan={() => {
        if (editingPlanId) updatePlan.mutate(editingPlanId);
      }}
      savePlanPending={updatePlan.isPending}
      createPlanForm={planForm}
      onCreatePlanFormChange={setPlanForm}
      onCreatePlan={() => createPlan.mutate()}
      createPlanPending={createPlan.isPending}
      createPlanOpen={createPlanOpen}
      onCreatePlanOpenChange={setCreatePlanOpen}
      assignForm={subForm}
      onAssignFormChange={setSubForm}
      onAssign={() => createSub.mutate()}
      assignPending={createSub.isPending}
      assignOpen={assignOpen}
      onAssignOpenChange={setAssignOpen}
      editingSubId={editingSubId}
      editSub={editSub}
      onEditSub={(sub) => {
        clear();
        setEditingSubId(sub.id);
        setEditSub({ brand_id: sub.brand_id, plan_id: sub.plan_id, status: sub.status as SubStatus });
      }}
      onEditSubChange={setEditSub}
      onCancelSubEdit={() => setEditingSubId(null)}
      onSaveSub={() => {
        if (editingSubId) updateSub.mutate(editingSubId);
      }}
      onDeletePlan={(planId) => deletePlan.mutate(planId)}
      onDeleteSub={(subId) => deleteSub.mutate(subId)}
      deletePlanPending={deletePlan.isPending}
      deleteSubPending={deleteSub.isPending}
    />
  );
}
