import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  DirectoryListToolbar,
  DirectoryPagination,
  FormGrid,
  MutationError,
  Select,
  SubscriptionAccordion,
  SubscriptionBillingToggle,
  SubscriptionBrandCard,
  SubscriptionBrandCell,
  SubscriptionDataTable,
  SubscriptionEditorPanel,
  SubscriptionIconMenuButton,
  SubscriptionLinkButton,
  SubscriptionPageHeader,
  SubscriptionPlanBadge,
  SubscriptionPlanCard,
  SubscriptionPlanCarousel,
  SubscriptionPlanGrid,
  SubscriptionPrimaryButton,
  SubscriptionSectionHeader,
  SubscriptionShell,
  SubscriptionStatusBadge,
  SubscriptionTableActions,
  SubscriptionVisibility,
} from "@edunudg/ui";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { ConfirmDeleteDialog } from "@/features/shared/ConfirmDeleteDialog";
import {
  brandInitials,
  BRAND_SUBSCRIPTION_SORT_OPTIONS,
  brandSubscriptionsPaginationSummary,
  formatBillingDate,
  formatPlanPriceLabel,
  isAlternatingFeaturedPlanCard,
  planCardFeatures,
  planToneFromCode,
  resolveBrandSubscriptionsList,
  shouldShowBrandSubscriptionListControls,
  subscriptionStatusLabel,
  subscriptionStatusTone,
  type BrandSubscriptionSortKey,
} from "@/lib/subscriptionPlanDisplay";
import type { SubscriptionPlanFeatures } from "@/lib/subscriptionPlanFeatures";
import { SubscriptionPlanEditorFields, type PlanForm } from "./subscriptions/SubscriptionPlanEditorFields";
import "./subscriptionsPage.css";

export type SubscriptionPlan = {
  id: string;
  code: string;
  name: string;
  price_cents: number;
  currency: string;
  billing_interval: string;
  is_active: boolean;
  is_default: boolean;
  features: SubscriptionPlanFeatures;
};

export type BrandSubscription = {
  id: string;
  brand_id: string;
  plan_id: string;
  status: string;
  current_period_end?: string | null;
  updated_at?: string | null;
  brands?: { name: string } | null;
  subscription_plans?: { name: string } | null;
};

export type SubStatus = "active" | "past_due" | "cancelled" | "trialing";

export const SUB_STATUS_OPTIONS: { value: SubStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "trialing", label: "Trialing" },
  { value: "past_due", label: "Past due" },
  { value: "cancelled", label: "Cancelled" },
];

function PlanCards({
  plans,
  billingPeriod,
  editingPlanId,
  onEditPlan,
}: {
  plans: SubscriptionPlan[];
  billingPeriod: "monthly" | "yearly";
  editingPlanId: string | null;
  onEditPlan: (plan: SubscriptionPlan) => void;
}) {
  return (
    <>
      {plans.map((plan, index) => {
        const tone = planToneFromCode(plan.code);
        const pricing = formatPlanPriceLabel(plan.price_cents, plan.currency, billingPeriod);
        const featured = isAlternatingFeaturedPlanCard(index);

        return (
          <SubscriptionPlanCard
            key={plan.id}
            tierLabel={plan.name.toUpperCase()}
            priceLabel={pricing.priceLabel}
            intervalLabel={pricing.intervalLabel}
            features={planCardFeatures(plan.features)}
            tone={tone}
            featured={featured}
            selected={editingPlanId === plan.id}
            onAction={() => onEditPlan(plan)}
          />
        );
      })}
    </>
  );
}

function useBrandSubscriptionsListState(subscriptions: BrandSubscription[]) {
  const showListControls = shouldShowBrandSubscriptionListControls(subscriptions.length);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<BrandSubscriptionSortKey>("brand-asc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, sort]);

  const list = useMemo(
    () => resolveBrandSubscriptionsList(subscriptions, { showControls: showListControls, search, sort, page }),
    [subscriptions, showListControls, search, sort, page]
  );

  return { showListControls, search, setSearch, sort, setSort, page, setPage, list };
}

export function SubscriptionsPageView({
  plans,
  brandOptions,
  subscriptions,
  error,
  editingPlanId,
  editPlan,
  onEditPlan,
  onEditPlanChange,
  onDiscardPlanEdit,
  onSavePlan,
  savePlanPending,
  createPlanForm,
  onCreatePlanFormChange,
  onCreatePlan,
  createPlanPending,
  createPlanOpen,
  onCreatePlanOpenChange,
  assignForm,
  onAssignFormChange,
  onAssign,
  assignPending,
  assignOpen,
  onAssignOpenChange,
  editingSubId,
  editSub,
  onEditSub,
  onEditSubChange,
  onCancelSubEdit,
  onSaveSub,
  onDeletePlan,
  onDeleteSub,
  deletePlanPending,
  deleteSubPending,
}: {
  plans: SubscriptionPlan[];
  brandOptions: { value: string; label: string }[];
  subscriptions: BrandSubscription[];
  error: string | null;
  editingPlanId: string | null;
  editPlan: PlanForm;
  onEditPlan: (plan: SubscriptionPlan) => void;
  onEditPlanChange: (form: PlanForm) => void;
  onDiscardPlanEdit: () => void;
  onSavePlan: () => void;
  savePlanPending: boolean;
  createPlanForm: PlanForm;
  onCreatePlanFormChange: (form: PlanForm) => void;
  onCreatePlan: () => void;
  createPlanPending: boolean;
  createPlanOpen: boolean;
  onCreatePlanOpenChange: (open: boolean) => void;
  assignForm: { brand_id: string; plan_id: string; status: SubStatus };
  onAssignFormChange: (form: { brand_id: string; plan_id: string; status: SubStatus }) => void;
  onAssign: () => void;
  assignPending: boolean;
  assignOpen: boolean;
  onAssignOpenChange: (open: boolean) => void;
  editingSubId: string | null;
  editSub: { brand_id: string; plan_id: string; status: SubStatus };
  onEditSub: (sub: BrandSubscription) => void;
  onEditSubChange: (form: { brand_id: string; plan_id: string; status: SubStatus }) => void;
  onCancelSubEdit: () => void;
  onSaveSub: () => void;
  onDeletePlan: (planId: string) => void;
  onDeleteSub: (subId: string) => void;
  deletePlanPending: boolean;
  deleteSubPending: boolean;
}) {
  const assignSectionRef = useRef<HTMLDivElement>(null);
  const createPlanSectionRef = useRef<HTMLDivElement>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [deletePlanTarget, setDeletePlanTarget] = useState<string | null>(null);
  const [deleteSubTarget, setDeleteSubTarget] = useState<string | null>(null);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const { showListControls, search, setSearch, sort, setSort, page, setPage, list } =
    useBrandSubscriptionsListState(subscriptions);

  const planOptions = plans.map((plan) => ({ value: plan.id, label: plan.name }));
  const editingPlan = plans.find((plan) => plan.id === editingPlanId) ?? null;

  const openAssignSubscription = () => onAssignOpenChange(true);
  const openCreatePlan = () => onCreatePlanOpenChange(true);

  useEffect(() => {
    if (!createPlanOpen) return;
    const frame = window.requestAnimationFrame(() => {
      createPlanSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [createPlanOpen]);

  useEffect(() => {
    if (!assignOpen) return;
    const frame = window.requestAnimationFrame(() => {
      assignSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [assignOpen]);

  const listToolbar = showListControls ? (
    <DirectoryListToolbar
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search brands…"
      sortValue={sort}
      onSortChange={(value) => setSort(value as BrandSubscriptionSortKey)}
      sortOptions={BRAND_SUBSCRIPTION_SORT_OPTIONS}
    />
  ) : null;

  const listPagination = showListControls ? (
    <DirectoryPagination
      summary={brandSubscriptionsPaginationSummary(list)}
      onPrevious={() => setPage((current) => Math.max(1, current - 1))}
      onNext={() => setPage((current) => Math.min(list.pageCount, current + 1))}
      disablePrevious={list.page <= 1}
      disableNext={list.page >= list.pageCount}
    />
  ) : null;

  const openPlanEditor = (plan: SubscriptionPlan) => {
    onEditPlan(plan);
    setMobileEditorOpen(true);
  };

  return (
    <SubscriptionShell>
      <MutationError message={error} />

      <SubscriptionVisibility
        mobile={
          <>
            <SubscriptionPageHeader
              title="Subscriptions"
              subtitle="Manage franchise pricing and feature limits."
            />

            <SubscriptionSectionHeader
              title="Available Plans"
              action={<SubscriptionLinkButton onClick={() => undefined}>View All</SubscriptionLinkButton>}
            />

            <SubscriptionPlanCarousel>
              <PlanCards
                plans={plans}
                billingPeriod={billingPeriod}
                editingPlanId={editingPlanId}
                onEditPlan={openPlanEditor}
              />
            </SubscriptionPlanCarousel>

            {editingPlan ? (
              <SubscriptionAccordion
                title={`Edit ${editingPlan.name} Plan`}
                open={mobileEditorOpen}
                onToggle={() => setMobileEditorOpen((open) => !open)}
              >
                <SubscriptionPlanEditorFields
                  form={editPlan}
                  onChange={onEditPlanChange}
                  variant="mobile"
                />
                <div className="ed-sub-mobile-editor-actions">
                  <Button variant="ghost" onClick={onDiscardPlanEdit}>
                    Discard
                  </Button>
                  <Button onClick={onSavePlan} disabled={savePlanPending}>
                    Save Changes
                  </Button>
                </div>
              </SubscriptionAccordion>
            ) : null}

            <SubscriptionSectionHeader
              title="Brand Subscriptions"
              action={
                <SubscriptionPrimaryButton onClick={openAssignSubscription}>
                  Assign New
                </SubscriptionPrimaryButton>
              }
            />

            {listToolbar}

            {list.items.length === 0 ? (
              <p className="ed-sub-table__empty">
                {showListControls && search ? "No subscriptions match your search." : "No brand subscriptions."}
              </p>
            ) : (
              list.items.map((sub) => (
                <SubscriptionBrandCard
                  key={sub.id}
                  name={sub.brands?.name ?? "Brand"}
                  planLabel={`${sub.subscription_plans?.name ?? "Plan"} Plan`}
                  status={
                    <SubscriptionStatusBadge
                      label={subscriptionStatusLabel(sub.status)}
                      tone={subscriptionStatusTone(sub.status)}
                    />
                  }
                  menu={
                    <SubscriptionIconMenuButton
                      label={`Actions for ${sub.brands?.name ?? "brand"}`}
                      onClick={() => onEditSub(sub)}
                    />
                  }
                />
              ))
            )}

            {listPagination}

            {editingSubId ? (
              <Card title="Edit subscription">
                <FormGrid columns={1}>
                  <Select
                    label="Brand"
                    value={editSub.brand_id}
                    onChange={(value) => onEditSubChange({ ...editSub, brand_id: value })}
                    options={brandOptions}
                  />
                  <Select
                    label="Plan"
                    value={editSub.plan_id}
                    onChange={(value) => onEditSubChange({ ...editSub, plan_id: value })}
                    options={planOptions}
                  />
                  <Select
                    label="Status"
                    value={editSub.status}
                    onChange={(value) => onEditSubChange({ ...editSub, status: value })}
                    options={SUB_STATUS_OPTIONS}
                  />
                </FormGrid>
                <div className="ed-sub-mobile-editor-actions">
                  <Button variant="ghost" onClick={onCancelSubEdit}>
                    Cancel
                  </Button>
                  <Button onClick={onSaveSub}>Save Changes</Button>
                </div>
              </Card>
            ) : null}
          </>
        }
        desktop={
          <>
            <SubscriptionPageHeader
              title="Subscriptions & Billing"
              subtitle="Prices are in Indian Rupees (₹). The default plan is assigned automatically when a brand signup is approved."
            />

            <section className="ed-sub-plans-section">
              <SubscriptionSectionHeader
                title="Available Plans"
                action={
                  <div className="ed-sub-plans-section__actions">
                    <SubscriptionPrimaryButton onClick={openCreatePlan}>
                      Create plan
                    </SubscriptionPrimaryButton>
                    <SubscriptionBillingToggle value={billingPeriod} onChange={setBillingPeriod} />
                  </div>
                }
              />
              <SubscriptionPlanGrid>
                <PlanCards
                  plans={plans}
                  billingPeriod={billingPeriod}
                  editingPlanId={editingPlanId}
                  onEditPlan={onEditPlan}
                />
              </SubscriptionPlanGrid>
            </section>

            {editingPlan ? (
              <SubscriptionEditorPanel
                title="Plan Editor"
                subtitle={`Configuring ${editingPlan.name} Plan`}
                onDiscard={onDiscardPlanEdit}
                onSave={onSavePlan}
                savePending={savePlanPending}
                saveDisabled={!editPlan.code.trim() || !editPlan.name.trim()}
              >
                <SubscriptionPlanEditorFields
                  form={editPlan}
                  onChange={onEditPlanChange}
                  variant="desktop"
                />
                <div className="ed-sub-editor__danger">
                  <Button variant="danger" onClick={() => setDeletePlanTarget(editingPlan.id)}>
                    Delete plan
                  </Button>
                </div>
              </SubscriptionEditorPanel>
            ) : null}

            <section className="ed-sub-subs-section">
              <SubscriptionSectionHeader
                title="Active Brand Subscriptions"
                action={
                  <SubscriptionPrimaryButton onClick={openAssignSubscription}>
                    Assign subscription
                  </SubscriptionPrimaryButton>
                }
              />

              {listToolbar}

              <Card>
                <SubscriptionDataTable
                  columns={[
                    { key: "brand", label: "Brand" },
                    { key: "plan", label: "Current plan" },
                    { key: "status", label: "Status" },
                    { key: "billing", label: "Billing date" },
                    { key: "actions", label: "Actions", align: "right" },
                  ]}
                  rows={list.items.map((sub) => {
                    const planName = sub.subscription_plans?.name ?? "Plan";
                    const tone = planToneFromCode(planName.toLowerCase());
                    return {
                      key: sub.id,
                      cells: {
                        brand: (
                          <SubscriptionBrandCell
                            initials={brandInitials(sub.brands?.name ?? "Brand")}
                            name={sub.brands?.name ?? "Brand"}
                          />
                        ),
                        plan: <SubscriptionPlanBadge label={planName} tone={tone} />,
                        status: (
                          <SubscriptionStatusBadge
                            label={subscriptionStatusLabel(sub.status)}
                            tone={subscriptionStatusTone(sub.status)}
                          />
                        ),
                        billing: formatBillingDate(sub.current_period_end ?? sub.updated_at),
                        actions: (
                          <SubscriptionTableActions
                            onEdit={() => onEditSub(sub)}
                            onDelete={() => setDeleteSubTarget(sub.id)}
                          />
                        ),
                      },
                    };
                  })}
                  emptyMessage={
                    showListControls && search ? "No subscriptions match your search." : "No brand subscriptions."
                  }
                />
              </Card>

              {listPagination}

              {editingSubId ? (
                <Card title="Edit subscription">
                  <FormGrid columns={3}>
                    <Select
                      label="Brand"
                      value={editSub.brand_id}
                      onChange={(value) => onEditSubChange({ ...editSub, brand_id: value })}
                      options={brandOptions}
                    />
                    <Select
                      label="Plan"
                      value={editSub.plan_id}
                      onChange={(value) => onEditSubChange({ ...editSub, plan_id: value })}
                      options={planOptions}
                    />
                    <Select
                      label="Status"
                      value={editSub.status}
                      onChange={(value) => onEditSubChange({ ...editSub, status: value })}
                      options={SUB_STATUS_OPTIONS}
                    />
                  </FormGrid>
                  <div className="ed-sub-mobile-editor-actions">
                    <Button variant="ghost" onClick={onCancelSubEdit}>
                      Cancel
                    </Button>
                    <Button onClick={onSaveSub}>Save Changes</Button>
                  </div>
                </Card>
              ) : null}
            </section>
          </>
        }
      />

      <div ref={createPlanSectionRef}>
        <AddFormSection
          buttonLabel="Create plan"
          panelTitle="Create plan"
          open={createPlanOpen}
          onOpenChange={onCreatePlanOpenChange}
          hideTrigger
          actionsPlacement="footer"
          primaryAction={{
            label: "Create plan",
            onClick: onCreatePlan,
            pending: createPlanPending,
            disabled: !createPlanForm.code.trim() || !createPlanForm.name.trim(),
          }}
        >
          {() => <SubscriptionPlanEditorFields form={createPlanForm} onChange={onCreatePlanFormChange} />}
        </AddFormSection>
      </div>

      <div ref={assignSectionRef}>
        <AddFormSection
          buttonLabel="Assign subscription"
          panelTitle="Assign subscription"
          open={assignOpen}
          onOpenChange={onAssignOpenChange}
          hideTrigger
          actionsPlacement="footer"
          primaryAction={{
            label: "Assign plan",
            onClick: onAssign,
            pending: assignPending,
            disabled: !assignForm.brand_id || !assignForm.plan_id,
          }}
        >
          {() => (
            <FormGrid columns={3}>
              <Select
                label="Brand"
                value={assignForm.brand_id}
                onChange={(value) => onAssignFormChange({ ...assignForm, brand_id: value })}
                options={brandOptions}
                placeholder="Select brand"
              />
              <Select
                label="Plan"
                value={assignForm.plan_id}
                onChange={(value) => onAssignFormChange({ ...assignForm, plan_id: value })}
                options={planOptions}
                placeholder="Select plan"
              />
              <Select
                label="Status"
                value={assignForm.status}
                onChange={(value) => onAssignFormChange({ ...assignForm, status: value })}
                options={SUB_STATUS_OPTIONS}
              />
            </FormGrid>
          )}
        </AddFormSection>
      </div>

      <ConfirmDeleteDialog
        open={deletePlanTarget != null}
        onClose={() => setDeletePlanTarget(null)}
        onConfirm={() => {
          if (deletePlanTarget) onDeletePlan(deletePlanTarget);
          setDeletePlanTarget(null);
        }}
        title="Delete this plan?"
        description="Brands must not reference this plan."
        confirmPending={deletePlanPending}
      />

      <ConfirmDeleteDialog
        open={deleteSubTarget != null}
        onClose={() => setDeleteSubTarget(null)}
        onConfirm={() => {
          if (deleteSubTarget) onDeleteSub(deleteSubTarget);
          setDeleteSubTarget(null);
        }}
        title="Remove subscription?"
        description="This removes the brand's platform subscription assignment."
        confirmPending={deleteSubPending}
      />
    </SubscriptionShell>
  );
}
