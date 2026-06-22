import type { ReactNode } from "react";
import { Badge, Button, Card } from "@edunudg/ui";
import { RecordDetailField, formatRecordWhen } from "@/features/shared/recordDetail";
import type { LeadRow } from "@/lib/leadsApi";

type Props = {
  lead: LeadRow;
  assignedCenterName?: string;
  stale?: boolean;
  unassigned?: boolean;
  ageDays?: number;
  onClose: () => void;
  actions?: ReactNode;
};

export function StudentLeadDetailCard({
  lead,
  assignedCenterName,
  stale,
  unassigned,
  ageDays,
  onClose,
  actions,
}: Props) {
  const title = lead.parent_name ?? lead.full_name;

  return (
    <Card title="Lead detail">
      <div className="ed-inquiry-detail">
        <div className="ed-inquiry-detail__header">
          <div>
            <h3 className="ed-inquiry-detail__title">{title}</h3>
            <p className="ed-text-sm ed-muted">Submitted {formatRecordWhen(lead.created_at)}</p>
          </div>
          <Badge tone={lead.status === "lost" ? "default" : lead.status === "converted" ? "success" : "warning"}>
            {lead.status}
          </Badge>
        </div>

        <dl className="ed-inquiry-detail__grid">
          <RecordDetailField label="Parent name" value={lead.parent_name ?? lead.full_name} />
          <RecordDetailField label="Email" value={lead.email} />
          <RecordDetailField label="WhatsApp" value={lead.whatsapp_e164} linkKind="phone" />
          <RecordDetailField label="Child name" value={lead.child_name} />
          <RecordDetailField label="Child date of birth" value={lead.child_dob} />
          <RecordDetailField label="School" value={lead.school_name} />
          <RecordDetailField label="City" value={lead.city} />
          <RecordDetailField label="Pincode" value={lead.pincode} />
          <RecordDetailField label="Lead source" value={lead.lead_source} />
        </dl>

        {assignedCenterName && (
          <p className="ed-text-sm ed-muted">Assigned center: {assignedCenterName}</p>
        )}

        <div className="ed-form-section">
          <Badge>{lead.lead_source ?? "—"}</Badge>
          {unassigned && ageDays != null && <Badge tone="warning">{ageDays}d unassigned</Badge>}
          {unassigned && ageDays == null && <Badge tone="warning">Unassigned</Badge>}
          {stale && <Badge tone="warning">Needs attention</Badge>}
        </div>

        {lead.lost_reason?.trim() && (
          <div className="ed-inquiry-detail__block">
            <p className="ed-text-sm ed-muted">Lost reason</p>
            <p className="ed-text-sm">{lead.lost_reason}</p>
          </div>
        )}

        {lead.assigned_at && (
          <RecordDetailField label="Assigned at" value={formatRecordWhen(lead.assigned_at)} />
        )}

        {actions ? <div className="ed-inquiry-detail__actions">{actions}</div> : null}

        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </Card>
  );
}

export function leadListTitle(lead: LeadRow): string {
  return lead.parent_name ?? lead.full_name;
}
