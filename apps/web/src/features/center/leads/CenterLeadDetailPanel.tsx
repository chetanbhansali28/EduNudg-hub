import type { ReactNode } from "react";
import {
  Button,
  Input,
  PipelineDetailPanel,
  PipelineStatusBadge,
  PipelineTimeline,
  Select,
} from "@edunudg/ui";
import { ConvertLeadDialog } from "@/features/center/convertStudent/ConvertLeadDialog";
import {
  buildLeadTimeline,
  leadDisplayName,
  leadStatusPresentation,
  leadStudentInterest,
  LEAD_STATUS_OPTIONS,
  telHref,
  whatsappHref,
} from "@/lib/centerLeadsHelpers";
import type { LeadRow, LeadStatus } from "@/lib/leadsApi";

type Props = {
  lead: LeadRow;
  now: number;
  hint: string | null;
  pipelineOpen: boolean;
  convertMode: boolean;
  lostMode: boolean;
  lostReason: string;
  convertPending: boolean;
  markLostPending: boolean;
  onBack: () => void;
  onConvertMode: () => void;
  onCancelConvert: () => void;
  onConfirmConvert: (overrides: {
    parentName: string;
    childName: string;
    childDob: string;
    schoolName: string;
    city: string;
    pincode: string;
  }) => void;
  onLostMode: () => void;
  onCancelLost: () => void;
  onLostReasonChange: (value: string) => void;
  onConfirmLost: () => void;
  onStatusChange: (status: LeadStatus) => void;
  menu?: ReactNode;
};

const WHATSAPP_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2a10 10 0 0 0-8.66 15l-1.17 4.3 4.42-1.16A10 10 0 1 0 12 2Zm0 2a8 8 0 0 1 6.78 12.35l.3.3-.98 3.6-3.63-.95-.3.18A8 8 0 1 1 12 4Zm-2.2 4.5c-.2 0-.45.07-.65.35-.22.3-.85.83-.85 2.02 0 1.18.86 2.32.98 2.48.12.17 1.67 2.68 4.12 3.65 2.04.8 2.45.64 2.9.6.44-.04 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.2-1.4-1.34-1.64-.14-.24-.02-.36.1-.48.1-.1.22-.26.34-.4.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.46-.4-.4-.54-.4Z" />
  </svg>
);

export function CenterLeadDetailPanel({
  lead,
  now,
  hint,
  pipelineOpen,
  convertMode,
  lostMode,
  lostReason,
  convertPending,
  markLostPending,
  onBack,
  onConvertMode,
  onCancelConvert,
  onConfirmConvert,
  onLostMode,
  onCancelLost,
  onLostReasonChange,
  onConfirmLost,
  onStatusChange,
}: Props) {
  const name = leadDisplayName(lead);
  const status = leadStatusPresentation(lead, now);
  const interest = leadStudentInterest(lead);
  const wa = whatsappHref(lead.whatsapp_e164);
  const tel = telHref(lead.whatsapp_e164);
  const timeline = buildLeadTimeline(lead);

  const footer =
    pipelineOpen && !lostMode && !convertMode ? (
      <div className="ed-pipeline-detail-footer-actions">
        <Button variant="danger" onClick={onLostMode}>
          Mark lost
        </Button>
        <Button onClick={onConvertMode} disabled={convertPending}>
          ★ Convert to Student
        </Button>
      </div>
    ) : null;

  return (
    <PipelineDetailPanel title={name} onBack={onBack} footer={footer}>
      {pipelineOpen ? (
        <>
          <div className="ed-pipeline-detail-actions">
            {wa ? (
              <a className="ed-pipeline-detail-actions__whatsapp" href={wa} target="_blank" rel="noreferrer">
                {WHATSAPP_ICON}
                WhatsApp
              </a>
            ) : (
              <span className="ed-pipeline-detail-actions__whatsapp" style={{ opacity: 0.5 }}>
                WhatsApp unavailable
              </span>
            )}
            {tel ? (
              <a className="ed-pipeline-detail-actions__phone" href={tel} aria-label={`Call ${name}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.86.33 1.7.62 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.19a2 2 0 0 1 2.11-.45c.8.29 1.64.5 2.5.62A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>
            ) : null}
          </div>

          <div className="ed-pipeline-detail-facts">
            <div>
              <p className="ed-pipeline-detail-facts__label">Interest</p>
              <p className="ed-pipeline-detail-facts__value">{interest.title}</p>
            </div>
            <div>
              <p className="ed-pipeline-detail-facts__label">Status</p>
              <p className="ed-pipeline-detail-facts__value ed-pipeline-detail-facts__value--primary">
                <PipelineStatusBadge label={status.label} tone={status.tone} />
              </p>
            </div>
          </div>

          {hint ? <p className="ed-text-sm ed-muted">{hint}</p> : null}

          <div>
            <h3 className="ed-pipeline-timeline__section-title">
              <span aria-hidden>🕐</span> Lead History
            </h3>
            <PipelineTimeline items={timeline} />
          </div>

          {lostMode ? (
            <>
              <p className="ed-text-sm ed-muted">Reason is required and visible to the brand (FR-C11b).</p>
              <Input label="Reason (required)" value={lostReason} onChange={onLostReasonChange} />
              <div className="ed-form-section">
                <Button onClick={onConfirmLost} disabled={!lostReason.trim() || markLostPending}>
                  Confirm lost
                </Button>
                <Button variant="ghost" onClick={onCancelLost}>
                  Cancel
                </Button>
              </div>
            </>
          ) : convertMode ? (
            <ConvertLeadDialog
              lead={lead}
              variant="inline"
              pending={convertPending}
              onCancel={onCancelConvert}
              onConfirm={onConfirmConvert}
            />
          ) : (
            <Select
              label="Status"
              value={lead.status}
              onChange={(v) => onStatusChange(v)}
              options={LEAD_STATUS_OPTIONS}
            />
          )}
        </>
      ) : (
        <p className="ed-text-sm ed-muted">Select a lead to update status, convert, or mark lost.</p>
      )}
    </PipelineDetailPanel>
  );
}
