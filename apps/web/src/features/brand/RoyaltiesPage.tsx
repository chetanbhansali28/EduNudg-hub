import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Card,
  DataList,
  FormGrid,
  Input,
  ListRow,
  MutationError,
  PageTitle,
  Select,
  ToggleField,
} from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { formatInrFromPaise, paiseToRupeesInput, rupeesToPaise } from "@/lib/inrCurrency";
import { supabaseList } from "@/lib/supabaseResult";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import { useBrandScope } from "./hooks/useBrandScope";

type RoyaltyType = "fixed" | "percentage" | "per_student" | "per_level" | "hybrid";

interface RoyaltyRule {
  id: string;
  name: string;
  rule_type: RoyaltyType;
  is_active: boolean;
}

interface Settlement {
  id: string;
  center_id: string | null;
  period_start: string;
  period_end: string;
  amount_cents: number;
  currency: string;
  status: string;
}

const RULE_TYPES: { value: RoyaltyType; label: string }[] = [
  { value: "fixed", label: "Fixed fee" },
  { value: "percentage", label: "Percentage" },
  { value: "per_student", label: "Per student" },
  { value: "per_level", label: "Per level" },
  { value: "hybrid", label: "Hybrid" },
];

const emptyRule = { name: "", rule_type: "percentage" as RoyaltyType, is_active: true };
const emptySettlement = {
  center_id: "",
  period_start: "",
  period_end: "",
  amount_inr: "",
  status: "pending",
};

export function RoyaltiesPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [ruleForm, setRuleForm] = useState(emptyRule);
  const [settlementForm, setSettlementForm] = useState(emptySettlement);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editRule, setEditRule] = useState(emptyRule);
  const [editingSettlementId, setEditingSettlementId] = useState<string | null>(null);
  const [editSettlement, setEditSettlement] = useState(emptySettlement);
  const ruleCloser = useAddFormCloser();
  const settlementCloser = useAddFormCloser();

  const rules = useQuery({
    queryKey: ["royalty-rules", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("royalty_rules")
        .select("id, name, rule_type, is_active")
        .eq("brand_id", brandId!)
        .order("name");
      return supabaseList(data, qErr) as RoyaltyRule[];
    },
  });

  const settlements = useQuery({
    queryKey: ["royalty-settlements", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("royalty_settlements")
        .select("id, center_id, period_start, period_end, amount_cents, currency, status")
        .eq("brand_id", brandId!)
        .order("period_end", { ascending: false })
        .limit(50);
      return supabaseList(data, qErr) as Settlement[];
    },
  });

  const centers = useQuery({
    queryKey: ["centers", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("franchise_centers")
        .select("id, name")
        .eq("brand_id", brandId!)
        .is("deleted_at", null);
      return supabaseList(data, qErr) as { id: string; name: string }[];
    },
  });

  const invalidateRules = () => qc.invalidateQueries({ queryKey: ["royalty-rules", brandId] });
  const invalidateSettlements = () => qc.invalidateQueries({ queryKey: ["royalty-settlements", brandId] });

  const createRule = useMutation({
    mutationFn: async () => {
      if (!brandId) throw new Error("Brand required");
      clear();
      const { error: mErr } = await getSupabase().from("royalty_rules").insert({
        brand_id: brandId,
        name: ruleForm.name.trim(),
        rule_type: ruleForm.rule_type,
        is_active: ruleForm.is_active,
        config: {},
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidateRules();
      setRuleForm(emptyRule);
      ruleCloser.closeAddForm();
    },
    onError: capture,
  });

  const updateRule = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("royalty_rules")
        .update({
          name: editRule.name.trim(),
          rule_type: editRule.rule_type,
          is_active: editRule.is_active,
        })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidateRules();
      setEditingRuleId(null);
    },
    onError: capture,
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase().from("royalty_rules").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidateRules,
    onError: capture,
  });

  const createSettlement = useMutation({
    mutationFn: async () => {
      if (!brandId) throw new Error("Brand required");
      clear();
      const amount = rupeesToPaise(settlementForm.amount_inr);
      if (Number.isNaN(amount)) throw new Error("Enter a valid amount");
      const { error: mErr } = await getSupabase().from("royalty_settlements").insert({
        brand_id: brandId,
        center_id: settlementForm.center_id || null,
        period_start: settlementForm.period_start,
        period_end: settlementForm.period_end,
        amount_cents: amount,
        status: settlementForm.status,
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidateSettlements();
      setSettlementForm(emptySettlement);
      settlementCloser.closeAddForm();
    },
    onError: capture,
  });

  const updateSettlement = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const amount = rupeesToPaise(editSettlement.amount_inr);
      if (Number.isNaN(amount)) throw new Error("Enter a valid amount");
      const { error: mErr } = await getSupabase()
        .from("royalty_settlements")
        .update({
          center_id: editSettlement.center_id || null,
          period_start: editSettlement.period_start,
          period_end: editSettlement.period_end,
          amount_cents: amount,
          status: editSettlement.status,
        })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidateSettlements();
      setEditingSettlementId(null);
    },
    onError: capture,
  });

  const deleteSettlement = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase().from("royalty_settlements").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidateSettlements,
    onError: capture,
  });

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  const centerOptions = (centers.data ?? []).map((c) => ({ value: c.id, label: c.name }));

  return (
    <>
      <PageTitle>Royalties & Finance</PageTitle>
      <MutationError message={error} />

      <AddFormSection
        buttonLabel="Add royalty rule"
        panelTitle="Add royalty rule"
        primaryAction={{
          label: "Create rule",
          onClick: () => createRule.mutate(),
          pending: createRule.isPending,
          disabled: !ruleForm.name.trim(),
        }}
      >
        {({ close }) => {
          ruleCloser.bindClose(close);
          return (
            <div className="ed-editable-form">
              <FormGrid columns={3}>
                <Input
                  label="Name"
                  value={ruleForm.name}
                  onChange={(v) => setRuleForm((f) => ({ ...f, name: v }))}
                  editable
                />
                <Select
                  label="Type"
                  value={ruleForm.rule_type}
                  onChange={(v) => setRuleForm((f) => ({ ...f, rule_type: v }))}
                  options={RULE_TYPES}
                  editable
                />
                <ToggleField
                  label="Active"
                  checked={ruleForm.is_active}
                  onChange={(checked) => setRuleForm((f) => ({ ...f, is_active: checked }))}
                />
              </FormGrid>
            </div>
          );
        }}
      </AddFormSection>

      <Card title="Royalty rules">
        <DataList
          items={rules.data ?? []}
          empty="No rules yet."
          render={(r) => {
            const editing = editingRuleId === r.id;
            return (
              <ListRow
                aside={
                  <CrudRowActions
                    editing={editing}
                    onEdit={() => {
                      setEditingRuleId(r.id);
                      setEditRule({ name: r.name, rule_type: r.rule_type, is_active: r.is_active });
                    }}
                    onSave={() => updateRule.mutate(r.id)}
                    onCancel={() => setEditingRuleId(null)}
                    onDelete={() => deleteRule.mutate(r.id)}
                    saveDisabled={!editRule.name.trim() || updateRule.isPending}
                  />
                }
              >
                {editing ? (
                  <div className="ed-editable-form">
                    <FormGrid columns={3}>
                      <Input
                        label="Name"
                        value={editRule.name}
                        onChange={(v) => setEditRule((f) => ({ ...f, name: v }))}
                        editable
                      />
                      <Select
                        label="Type"
                        value={editRule.rule_type}
                        onChange={(v) => setEditRule((f) => ({ ...f, rule_type: v }))}
                        options={RULE_TYPES}
                        editable
                      />
                      <ToggleField
                        label="Active"
                        checked={editRule.is_active}
                        onChange={(checked) => setEditRule((f) => ({ ...f, is_active: checked }))}
                      />
                    </FormGrid>
                  </div>
                ) : (
                  <span>
                    {r.name} — {r.rule_type}{" "}
                    <Badge tone={r.is_active ? "success" : "default"}>{r.is_active ? "Active" : "Inactive"}</Badge>
                  </span>
                )}
              </ListRow>
            );
          }}
        />
      </Card>

      <AddFormSection
        buttonLabel="Record settlement"
        panelTitle="Record settlement"
        primaryAction={{
          label: "Add settlement",
          onClick: () => createSettlement.mutate(),
          pending: createSettlement.isPending,
          disabled:
            !settlementForm.period_start || !settlementForm.period_end || !settlementForm.amount_inr,
        }}
      >
        {({ close }) => {
          settlementCloser.bindClose(close);
          return (
            <div className="ed-editable-form">
              <FormGrid columns={3}>
                <Select
                  label="Center (optional)"
                  value={settlementForm.center_id}
                  onChange={(v) => setSettlementForm((f) => ({ ...f, center_id: v }))}
                  options={centerOptions}
                  placeholder="Brand-wide"
                  editable
                />
                <Input
                  label="Period start"
                  value={settlementForm.period_start}
                  onChange={(v) => setSettlementForm((f) => ({ ...f, period_start: v }))}
                  placeholder="YYYY-MM-DD"
                  editable
                />
                <Input
                  label="Period end"
                  value={settlementForm.period_end}
                  onChange={(v) => setSettlementForm((f) => ({ ...f, period_end: v }))}
                  placeholder="YYYY-MM-DD"
                  editable
                />
                <Input
                  label="Amount (INR)"
                  value={settlementForm.amount_inr}
                  onChange={(v) => setSettlementForm((f) => ({ ...f, amount_inr: v }))}
                  editable
                />
                <Input
                  label="Status"
                  value={settlementForm.status}
                  onChange={(v) => setSettlementForm((f) => ({ ...f, status: v }))}
                  editable
                />
              </FormGrid>
            </div>
          );
        }}
      </AddFormSection>

      <Card title="Settlements">
        <DataList
          items={settlements.data ?? []}
          empty="No settlements yet."
          render={(s) => {
            const editing = editingSettlementId === s.id;
            return (
              <ListRow
                aside={
                  <CrudRowActions
                    editing={editing}
                    onEdit={() => {
                      setEditingSettlementId(s.id);
                      setEditSettlement({
                        center_id: s.center_id ?? "",
                        period_start: s.period_start,
                        period_end: s.period_end,
                        amount_inr: paiseToRupeesInput(s.amount_cents),
                        status: s.status,
                      });
                    }}
                    onSave={() => updateSettlement.mutate(s.id)}
                    onCancel={() => setEditingSettlementId(null)}
                    onDelete={() => deleteSettlement.mutate(s.id)}
                    saveDisabled={updateSettlement.isPending}
                  />
                }
              >
                {editing ? (
                  <div className="ed-editable-form">
                    <FormGrid columns={3}>
                      <Select
                        label="Center"
                        value={editSettlement.center_id}
                        onChange={(v) => setEditSettlement((f) => ({ ...f, center_id: v }))}
                        options={centerOptions}
                        placeholder="Brand-wide"
                        editable
                      />
                      <Input
                        label="Period start"
                        value={editSettlement.period_start}
                        onChange={(v) => setEditSettlement((f) => ({ ...f, period_start: v }))}
                        editable
                      />
                      <Input
                        label="Period end"
                        value={editSettlement.period_end}
                        onChange={(v) => setEditSettlement((f) => ({ ...f, period_end: v }))}
                        editable
                      />
                      <Input
                        label="Amount (INR)"
                        value={editSettlement.amount_inr}
                        onChange={(v) => setEditSettlement((f) => ({ ...f, amount_inr: v }))}
                        editable
                      />
                      <Input
                        label="Status"
                        value={editSettlement.status}
                        onChange={(v) => setEditSettlement((f) => ({ ...f, status: v }))}
                        editable
                      />
                    </FormGrid>
                  </div>
                ) : (
                  <span>
                    {formatInrFromPaise(s.amount_cents)} — {s.period_start} → {s.period_end}{" "}
                    <Badge>{s.status}</Badge>
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
