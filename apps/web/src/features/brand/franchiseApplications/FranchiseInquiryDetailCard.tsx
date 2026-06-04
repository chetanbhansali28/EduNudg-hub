import { Badge, Button, Card, Input } from "@edunudg/ui";

export interface FranchiseInquiry {
  id: string;
  full_name: string;
  email: string;
  phone_e164: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  address_line: string | null;
  proposed_franchise_name: string | null;
  prior_experience: string | null;
  message: string | null;
  status: string;
  rejected_reason: string | null;
  converted_center_id: string | null;
  created_at: string;
  updated_at: string;
}

type Props = {
  inquiry: FranchiseInquiry;
  pending: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  approveMode: boolean;
  rejectMode: boolean;
  centerSlug: string;
  centerName: string;
  onCenterSlugChange: (v: string) => void;
  onCenterNameChange: (v: string) => void;
  rejectReason: string;
  onRejectReasonChange: (v: string) => void;
  onConfirmApprove: () => void;
  onConfirmReject: () => void;
  onCancelAction: () => void;
  approvePending: boolean;
  rejectPending: boolean;
};

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null;
  return (
    <div className="ed-inquiry-detail__field">
      <dt className="ed-text-sm ed-muted">{label}</dt>
      <dd className="ed-text-sm">{value}</dd>
    </div>
  );
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString();
}

export function FranchiseInquiryDetailCard({
  inquiry,
  pending,
  onClose,
  onApprove,
  onReject,
  approveMode,
  rejectMode,
  centerSlug,
  centerName,
  onCenterSlugChange,
  onCenterNameChange,
  rejectReason,
  onRejectReasonChange,
  onConfirmApprove,
  onConfirmReject,
  onCancelAction,
  approvePending,
  rejectPending,
}: Props) {
  const title = inquiry.proposed_franchise_name ?? inquiry.full_name;

  return (
    <Card title="Application detail">
      <div className="ed-inquiry-detail">
        <div className="ed-inquiry-detail__header">
          <div>
            <h3 className="ed-inquiry-detail__title">{title}</h3>
            <p className="ed-text-sm ed-muted">
              Submitted {formatWhen(inquiry.created_at)}
              {inquiry.updated_at !== inquiry.created_at && ` · Updated ${formatWhen(inquiry.updated_at)}`}
            </p>
          </div>
          <Badge tone={pending ? "warning" : inquiry.status === "lost" ? "default" : "success"}>
            {inquiry.status}
          </Badge>
        </div>

        <dl className="ed-inquiry-detail__grid">
          <DetailField label="Applicant name" value={inquiry.full_name} />
          <DetailField label="Email" value={inquiry.email} />
          <DetailField label="Phone / WhatsApp" value={inquiry.phone_e164} />
          <DetailField label="Proposed franchise name" value={inquiry.proposed_franchise_name} />
          <DetailField label="Preferred city" value={inquiry.city} />
          <DetailField label="State" value={inquiry.state} />
          <DetailField label="Pincode" value={inquiry.pincode} />
          <DetailField label="Address" value={inquiry.address_line} />
        </dl>

        {inquiry.prior_experience?.trim() && (
          <div className="ed-inquiry-detail__block">
            <p className="ed-text-sm ed-muted">Prior experience</p>
            <p className="ed-text-sm">{inquiry.prior_experience}</p>
          </div>
        )}

        {inquiry.message?.trim() && (
          <div className="ed-inquiry-detail__block">
            <p className="ed-text-sm ed-muted">Message</p>
            <p className="ed-text-sm">{inquiry.message}</p>
          </div>
        )}

        {inquiry.rejected_reason && (
          <div className="ed-inquiry-detail__block">
            <p className="ed-text-sm ed-muted">Rejection reason</p>
            <p className="ed-text-sm">{inquiry.rejected_reason}</p>
          </div>
        )}

        {inquiry.converted_center_id && (
          <p className="ed-text-sm ed-muted">Center provisioned (ID {inquiry.converted_center_id.slice(0, 8)}…)</p>
        )}

        {approveMode && (
          <div className="ed-inquiry-detail__actions">
            <p className="ed-text-sm ed-muted">
              Approving creates a franchise center and <code>{`{center}.{brand}`}</code> domain mapping.
            </p>
            <Input label="Center slug (optional)" value={centerSlug} onChange={onCenterSlugChange} placeholder="koramangala" />
            <Input label="Display name (optional)" value={centerName} onChange={onCenterNameChange} />
            <div className="ed-form-section">
              <Button onClick={onConfirmApprove} disabled={approvePending}>
                {approvePending ? "Provisioning…" : "Confirm approve & create center"}
              </Button>
              <Button variant="ghost" onClick={onCancelAction}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {rejectMode && (
          <div className="ed-inquiry-detail__actions">
            <Input label="Rejection reason (required)" value={rejectReason} onChange={onRejectReasonChange} />
            <div className="ed-form-section">
              <Button onClick={onConfirmReject} disabled={!rejectReason.trim() || rejectPending}>
                {rejectPending ? "Rejecting…" : "Confirm reject"}
              </Button>
              <Button variant="ghost" onClick={onCancelAction}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!approveMode && !rejectMode && (
          <div className="ed-form-section">
            {pending && (
              <>
                <Button onClick={onApprove}>Approve</Button>
                <Button variant="ghost" onClick={onReject}>
                  Reject
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export function inquiryListTitle(row: FranchiseInquiry): string {
  return row.proposed_franchise_name?.trim() || row.full_name;
}
