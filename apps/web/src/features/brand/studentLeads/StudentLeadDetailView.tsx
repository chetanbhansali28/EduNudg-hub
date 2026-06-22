import {
  Button,
  LeadApplicantCard,
  LeadAssignmentPanel,
  LeadDetailHeader,
  LeadStatusBadge,
  LeadSuggestionCard,
  Select,
} from "@edunudg/ui";
import type { LeadRow, SuggestedCenter } from "@/lib/leadsApi";
import {
  childAgeFromDob,
  formatLeadSubmittedWhen,
  leadListTitle,
  leadSourcePresentation,
  leadStatusPresentation,
} from "@/features/brand/studentLeads/studentLeadsHelpers";
import { PhoneLink } from "@edunudg/ui";

type CenterOption = {
  id: string;
  name: string;
  display_name: string | null;
  city: string | null;
  address_line1: string | null;
  pincode: string | null;
};

type Props = {
  lead: LeadRow;
  isMobile: boolean;
  assignedCenterName?: string;
  stale: boolean;
  unassigned: boolean;
  assignMode: boolean;
  isReallocate: boolean;
  assignCenterId: string;
  onAssignCenterIdChange: (id: string) => void;
  exactSuggestions: SuggestedCenter[];
  nearSuggestions: SuggestedCenter[];
  centers: CenterOption[];
  assignPending: boolean;
  reopenPending: boolean;
  onBack?: () => void;
  onStartAssign: (reallocate: boolean) => void;
  onCancelAssign: () => void;
  onConfirmAssign: () => void;
  onReopen: () => void;
};

export function StudentLeadDetailView({
  lead,
  isMobile,
  assignedCenterName,
  stale,
  unassigned,
  assignMode,
  isReallocate,
  assignCenterId,
  onAssignCenterIdChange,
  exactSuggestions,
  nearSuggestions,
  centers,
  assignPending,
  reopenPending,
  onBack,
  onStartAssign,
  onCancelAssign,
  onConfirmAssign,
  onReopen,
}: Props) {
  const title = leadListTitle(lead);
  const status = leadStatusPresentation(lead);
  const source = leadSourcePresentation(lead.lead_source);
  const noSuggestions = exactSuggestions.length === 0 && nearSuggestions.length === 0;

  const applicantCard = (
    <LeadApplicantCard
      badge={<LeadStatusBadge tone={status.tone}>{status.label}</LeadStatusBadge>}
      fields={[
        { key: "parent", label: "Parent Name", value: lead.parent_name ?? lead.full_name },
        { key: "email", label: "Email", value: lead.email ?? "—" },
        {
          key: "whatsapp",
          label: "WhatsApp",
          value: <PhoneLink phone={lead.whatsapp_e164} className="ed-lead-link" />,
        },
        { key: "dob", label: "Child DOB", value: childAgeFromDob(lead.child_dob) ?? "—" },
        { key: "city", label: "City", value: lead.city ?? "—" },
        { key: "pincode", label: "Pincode", value: lead.pincode ?? "—" },
        {
          key: "source",
          label: "Lead Source",
          value: <LeadStatusBadge tone={source.tone}>{source.label}</LeadStatusBadge>,
        },
      ]}
      footer={
        assignedCenterName ? (
          <p className="ed-text-sm ed-muted">Assigned center: {assignedCenterName}</p>
        ) : lead.pincode ? (
          <p className="ed-text-sm ed-muted">
            Pincode matches territory verification for {lead.pincode}.
          </p>
        ) : null
      }
    />
  );

  const suggestionCards = (
    <>
      {noSuggestions ? (
        <p className="ed-text-sm ed-muted">
          No centers found for this pincode — assign manually below.
        </p>
      ) : (
        <>
          {exactSuggestions.map((center) => (
            <LeadSuggestionCard
              key={center.center_id}
              title={center.name}
              subtitle={center.address_line1 ?? center.city ?? undefined}
              pincode={center.pincode}
              tag="Exact Match"
              tone="primary"
              selected={assignCenterId === center.center_id}
              onSelect={() => onAssignCenterIdChange(center.center_id)}
            />
          ))}
          {nearSuggestions.map((center) => (
            <LeadSuggestionCard
              key={center.center_id}
              title={center.name}
              subtitle={center.address_line1 ?? center.city ?? undefined}
              pincode={center.pincode}
              tag="Nearby"
              tone="secondary"
              selected={assignCenterId === center.center_id}
              onSelect={() => onAssignCenterIdChange(center.center_id)}
            />
          ))}
        </>
      )}
    </>
  );

  const manualSelect = (
    <>
      <p className="ed-lead-assignment-panel__manual-label">Or choose any center in brand</p>
      <Select
        label="Center"
        value={assignCenterId}
        onChange={onAssignCenterIdChange}
        options={centers.map((center) => ({
          value: center.id,
          label: `${center.display_name ?? center.name}${center.city ? ` · ${center.city}` : ""}`,
        }))}
        placeholder="Select center"
      />
    </>
  );

  const assignActions = (
    <div className="ed-lead-detail-actions">
      {assignMode ? (
        <>
          <Button onClick={onConfirmAssign} disabled={!assignCenterId || assignPending}>
            {isReallocate ? "Confirm & Reallocate Lead" : "Confirm & Assign Lead"}
          </Button>
          <Button variant="ghost" onClick={onCancelAssign}>
            Cancel
          </Button>
        </>
      ) : lead.status === "lost" ? (
        <Button onClick={onReopen} disabled={reopenPending}>
          Reopen
        </Button>
      ) : lead.status !== "converted" ? (
        <Button onClick={() => onStartAssign(stale && !unassigned)}>
          {!lead.center_id ? "Assign Lead" : stale ? "Reallocate" : "Reassign"}
        </Button>
      ) : null}
    </div>
  );

  const assignmentPanel = (
    <LeadAssignmentPanel
      pincode={lead.pincode ?? undefined}
      suggestions={
        <>
          {isReallocate ? (
            <p className="ed-text-sm ed-muted">
              Reallocation resets the SLA clock for the new center.
            </p>
          ) : null}
          {suggestionCards}
        </>
      }
      manualSelect={lead.status !== "converted" && lead.status !== "lost" ? manualSelect : undefined}
      footer={assignActions}
    />
  );

  if (isMobile) {
    return (
      <div className="ed-student-leads__detail">
        <LeadDetailHeader
          title={title}
          status={<LeadStatusBadge tone={status.tone}>{status.label}</LeadStatusBadge>}
          submittedAt={formatLeadSubmittedWhen(lead.created_at)}
          onBack={onBack}
        />
        {applicantCard}
        {assignmentPanel}
      </div>
    );
  }

  return (
    <div className="ed-student-leads__detail ed-student-leads__detail--desktop">
      <div className="ed-student-leads__detail-toolbar">
        {onBack ? (
          <Button variant="ghost" onClick={onBack}>
            ← Back to leads
          </Button>
        ) : null}
      </div>
      <div className="ed-student-leads__detail-grid">
        <div>
          <LeadDetailHeader
            title={title}
            status={<LeadStatusBadge tone={status.tone}>{status.label} LEAD</LeadStatusBadge>}
            submittedAt={formatLeadSubmittedWhen(lead.created_at)}
          />
          {applicantCard}
          <section className="ed-lead-activity-card">
            <h3 className="ed-lead-activity-card__title">Recent Activity</h3>
            <ul className="ed-lead-activity-card__list">
              <li>Lead created via {lead.lead_source ?? "brand"} channel</li>
              {lead.assigned_at ? <li>Assigned to center</li> : null}
              {stale ? <li>SLA follow-up required</li> : null}
            </ul>
          </section>
        </div>
        <div>{assignmentPanel}</div>
      </div>
    </div>
  );
}
