import { Badge, Button, Card, Input } from "@edunudg/ui";
import { RecordDetailField, formatRecordWhen } from "@/features/shared/recordDetail";
import type { PlatformSignupRow } from "@/lib/platformBrandSignupApi";

type Props = {
  signup: PlatformSignupRow;
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

export function PlatformSignupDetailCard({
  signup,
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
  const pending = signup.status === "pending";

  return (
    <Card title="Signup request detail">
      <div className="ed-inquiry-detail">
        <div className="ed-inquiry-detail__header">
          <div>
            <h3 className="ed-inquiry-detail__title">{signup.requested_name}</h3>
            <p className="ed-text-sm ed-muted">Submitted {formatRecordWhen(signup.created_at)}</p>
          </div>
          <Badge tone={pending ? "warning" : signup.status === "rejected" ? "default" : "success"}>
            {signup.status}
          </Badge>
        </div>

        <dl className="ed-inquiry-detail__grid">
          <RecordDetailField label="Brand name" value={signup.requested_name} />
          <RecordDetailField label="Admin name" value={signup.admin_full_name} />
          <RecordDetailField label="Email" value={signup.email} />
          <RecordDetailField label="Phone" value={signup.phone_e164} />
          <RecordDetailField label="City" value={signup.city} />
          <RecordDetailField label="Country" value={signup.country} />
          <RecordDetailField label="Proposed slug" value={signup.proposed_slug} />
        </dl>

        {signup.message?.trim() && (
          <div className="ed-inquiry-detail__block">
            <p className="ed-text-sm ed-muted">Notes</p>
            <p className="ed-text-sm">{signup.message}</p>
          </div>
        )}

        {signup.rejected_reason?.trim() && (
          <div className="ed-inquiry-detail__block">
            <p className="ed-text-sm ed-muted">Rejection reason</p>
            <p className="ed-text-sm">{signup.rejected_reason}</p>
          </div>
        )}

        {rejectMode && (
          <div className="ed-inquiry-detail__actions">
            <Input label="Rejection reason (optional)" value={rejectReason} onChange={onRejectReasonChange} />
            <div className="ed-form-section">
              <Button variant="danger" onClick={onConfirmReject} disabled={rejectPending}>
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
                  Approving creates the brand, default settings, and a <code>{`{slug}.localhost`}</code> domain. The slug
                  is generated automatically from the brand name and city.
                </p>
                <Button onClick={onApprove} disabled={approvePending}>
                  {approvePending ? "Provisioning…" : "Approve & create brand"}
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

export function signupListTitle(row: PlatformSignupRow): string {
  return row.requested_name;
}
