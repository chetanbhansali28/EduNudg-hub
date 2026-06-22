import { Button, Input, PipelineDetailPanel } from "@edunudg/ui";
import { mapsSearchUrl } from "./franchiseApplicationsHelpers";

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
  onBack?: () => void;
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

const ICON_STORE = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9z" />
  </svg>
);

const ICON_MAIL = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M4 6h16v12H4z" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

const ICON_PHONE = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L17 13l4 1.5v3A2 2 0 0 1 18.2 19 16 16 0 0 1 5 5.8 2 2 0 0 1 6.5 4z" />
  </svg>
);

const ICON_PIN = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

function DetailField({
  label,
  value,
  contactIcon,
  italic,
}: {
  label: string;
  value: string | null | undefined;
  contactIcon?: "mail" | "phone";
  italic?: boolean;
}) {
  const display = value?.trim() || "—";
  return (
    <div>
      <span className="ed-franchise-app-detail__field-label">{label}</span>
      <p
        className={[
          "ed-franchise-app-detail__field-value",
          contactIcon ? "ed-franchise-app-detail__field-value--contact" : "",
          italic ? "ed-franchise-app-detail__field-value--italic" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {contactIcon === "mail" ? ICON_MAIL : null}
        {contactIcon === "phone" ? ICON_PHONE : null}
        {display}
      </p>
    </div>
  );
}

function ActionButtons({
  pending,
  rejectMode,
  approvePending,
  rejectPending,
  onApprove,
  onReject,
}: Pick<Props, "pending" | "rejectMode" | "approvePending" | "rejectPending" | "onApprove" | "onReject">) {
  if (!pending || rejectMode) return null;

  return (
    <>
      <button type="button" className="ed-btn ed-btn--ghost ed-franchise-app-detail__reject" onClick={onReject}>
        Reject
      </button>
      <Button onClick={onApprove} disabled={approvePending}>
        {approvePending ? "Provisioning…" : "Approve & create center"}
      </Button>
    </>
  );
}

export function FranchiseInquiryDetailCard({
  inquiry,
  pending,
  onBack,
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
  const mapUrl = mapsSearchUrl(inquiry);
  const locationLabel = [inquiry.city, inquiry.state].filter(Boolean).join(", ") || "View on map";

  return (
    <PipelineDetailPanel title={title} onBack={onBack}>
      <div className="ed-franchise-app-detail">
        <header className="ed-franchise-app-detail__hero">
          <div className="ed-franchise-app-detail__hero-icon">{ICON_STORE}</div>
          <div className="ed-franchise-app-detail__hero-copy">
            <h2 className="ed-franchise-app-detail__hero-title">{title}</h2>
            <p className="ed-franchise-app-detail__hero-subtitle">Proposed Center Details</p>
          </div>
        </header>

        <div className="ed-franchise-app-detail__grid">
          <section className="ed-franchise-app-detail__card">
            <h3 className="ed-franchise-app-detail__card-title">Applicant Information</h3>
            <div className="ed-franchise-app-detail__fields ed-franchise-app-detail__fields--split">
              <DetailField label="Applicant name" value={inquiry.full_name} />
              <DetailField label="Proposed name" value={inquiry.proposed_franchise_name} />
              <DetailField label="Email address" value={inquiry.email} contactIcon="mail" />
              <DetailField label="Phone / WhatsApp" value={inquiry.phone_e164} contactIcon="phone" />
            </div>
          </section>

          <section className="ed-franchise-app-detail__card">
            <h3 className="ed-franchise-app-detail__card-title">Proposed Location</h3>
            <div className="ed-franchise-app-detail__fields ed-franchise-app-detail__fields--split">
              <DetailField label="City" value={inquiry.city} />
              <DetailField label="State" value={inquiry.state} />
              <DetailField label="Pincode" value={inquiry.pincode} />
              <DetailField label="Address" value={inquiry.address_line} />
            </div>
            {mapUrl ? (
              <a className="ed-franchise-app-detail__map" href={mapUrl} target="_blank" rel="noreferrer">
                <span className="ed-franchise-app-detail__map-label">
                  {ICON_PIN}
                  {locationLabel}
                </span>
              </a>
            ) : null}
          </section>

          <section className="ed-franchise-app-detail__card ed-franchise-app-detail__card--wide">
            <h3 className="ed-franchise-app-detail__card-title">Background &amp; Experience</h3>
            <DetailField
              label="Prior experience"
              value={inquiry.prior_experience?.trim() || "Not provided"}
              italic
            />
          </section>

          {inquiry.message?.trim() ? (
            <section className="ed-franchise-app-detail__card ed-franchise-app-detail__card--wide">
              <h3 className="ed-franchise-app-detail__card-title">Additional notes</h3>
              <p className="ed-franchise-app-detail__message">{inquiry.message}</p>
            </section>
          ) : null}

          {inquiry.rejected_reason ? (
            <section className="ed-franchise-app-detail__card ed-franchise-app-detail__card--wide">
              <h3 className="ed-franchise-app-detail__card-title">Rejection reason</h3>
              <p className="ed-franchise-app-detail__message">{inquiry.rejected_reason}</p>
            </section>
          ) : null}

          {inquiry.converted_center_id ? (
            <p className="ed-franchise-app-detail__meta">
              Center provisioned (ID {inquiry.converted_center_id.slice(0, 8)}…)
            </p>
          ) : null}
        </div>

        {rejectMode ? (
          <div className="ed-franchise-app-detail__reject-panel">
            <Input label="Rejection reason (required)" value={rejectReason} onChange={onRejectReasonChange} />
            <div className="ed-franchise-app-detail__reject-actions">
              <Button variant="danger" onClick={onConfirmReject} disabled={!rejectReason.trim() || rejectPending}>
                {rejectPending ? "Rejecting…" : "Confirm reject"}
              </Button>
              <Button variant="ghost" onClick={onCancelAction}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {!rejectMode && pending ? (
          <p className="ed-franchise-app-detail__meta">
            Approving creates a franchise center and <code>{`{center}.{brand}`}</code> domain mapping. The center slug
            is generated automatically from the franchise name and city.
          </p>
        ) : null}

        <div className="ed-franchise-app-detail__actions">
          <ActionButtons
            pending={pending}
            rejectMode={rejectMode}
            approvePending={approvePending}
            rejectPending={rejectPending}
            onApprove={onApprove}
            onReject={onReject}
          />
        </div>
      </div>
    </PipelineDetailPanel>
  );
}
