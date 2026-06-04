import { Badge, Button, Card, Input } from "@edunudg/ui";
import { RecordDetailField, formatRecordWhen } from "@/features/shared/recordDetail";

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
  rejectMode: boolean;
  rejectReason: string;
  onRejectReasonChange: (v: string) => void;
  onConfirmReject: () => void;
  onCancelAction: () => void;
  approvePending: boolean;
  rejectPending: boolean;
};

export function FranchiseInquiryDetailCard({
  inquiry,
  pending,
  onClose,
  onApprove,
  onReject,
  rejectMode,
  rejectReason,
  onRejectReasonChange,
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
              Submitted {formatRecordWhen(inquiry.created_at)}
              {inquiry.updated_at !== inquiry.created_at && ` · Updated ${formatRecordWhen(inquiry.updated_at)}`}
            </p>
          </div>
          <Badge tone={pending ? "warning" : inquiry.status === "lost" ? "default" : "success"}>
            {inquiry.status}
          </Badge>
        </div>

        <dl className="ed-inquiry-detail__grid">
          <RecordDetailField label="Applicant name" value={inquiry.full_name} />
          <RecordDetailField label="Email" value={inquiry.email} />
          <RecordDetailField label="Phone / WhatsApp" value={inquiry.phone_e164} />
          <RecordDetailField label="Proposed franchise name" value={inquiry.proposed_franchise_name} />
          <RecordDetailField label="Preferred city" value={inquiry.city} />
          <RecordDetailField label="State" value={inquiry.state} />
          <RecordDetailField label="Pincode" value={inquiry.pincode} />
          <RecordDetailField label="Address" value={inquiry.address_line} />
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

        {!rejectMode && (
          <div className="ed-form-section">
            {pending && (
              <>
                <p className="ed-text-sm ed-muted">
                  Approving creates a franchise center and <code>{`{center}.{brand}`}</code> domain mapping. The center
                  slug is generated automatically from the franchise name and city.
                </p>
                <Button onClick={onApprove} disabled={approvePending}>
                  {approvePending ? "Provisioning…" : "Approve & create center"}
                </Button>
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
