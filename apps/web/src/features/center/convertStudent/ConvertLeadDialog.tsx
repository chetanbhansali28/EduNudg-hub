import { useState } from "react";
import { Button, Input } from "@edunudg/ui";
import type { LeadRow } from "@/lib/leadsApi";

export type ConvertLeadOverrides = {
  parentName: string;
  childName: string;
  childDob: string;
  schoolName: string;
  city: string;
  pincode: string;
};

export type ConvertLeadDialogProps = {
  lead: LeadRow;
  onConfirm: (overrides: ConvertLeadOverrides) => void;
  onCancel: () => void;
  pending?: boolean;
  /** Inline in lead detail — quick confirm by default, optional field edits. */
  variant?: "dialog" | "inline";
};

function overridesFromLead(lead: LeadRow, state: ConvertLeadOverrides): ConvertLeadOverrides {
  return {
    parentName: state.parentName.trim(),
    childName: state.childName.trim(),
    childDob: state.childDob.trim(),
    schoolName: state.schoolName.trim(),
    city: state.city.trim(),
    pincode: state.pincode.trim(),
  };
}

function initialState(lead: LeadRow): ConvertLeadOverrides {
  return {
    parentName: lead.parent_name ?? lead.full_name ?? "",
    childName: lead.child_name ?? "",
    childDob: lead.child_dob ?? "",
    schoolName: lead.school_name ?? "",
    city: lead.city ?? "",
    pincode: lead.pincode ?? "",
  };
}

export function ConvertLeadDialog({
  lead,
  onConfirm,
  onCancel,
  pending,
  variant = "dialog",
}: ConvertLeadDialogProps) {
  const [fields, setFields] = useState(() => initialState(lead));
  const [editMode, setEditMode] = useState(variant === "dialog");

  const canSubmit = Boolean(fields.parentName.trim() && fields.childName.trim());

  if (variant === "inline" && !editMode) {
    const parentName = lead.parent_name ?? lead.full_name ?? "—";
    const childName = lead.child_name ?? "—";
    return (
      <div className="ed-convert-lead-inline">
        <p className="ed-text-sm ed-muted">
          Create a student enrollment using the lead details already shown above. Edit only if the parent confirmed
          different information on your call.
        </p>
        <ul className="ed-text-sm ed-convert-lead-inline__summary">
          <li>
            <strong>Parent:</strong> {parentName}
          </li>
          <li>
            <strong>Child:</strong> {childName}
            {lead.child_dob ? ` · DOB ${lead.child_dob}` : ""}
          </li>
          <li>
            <strong>WhatsApp:</strong> {lead.whatsapp_e164 ?? "—"}
          </li>
        </ul>
        <div className="ed-form-section">
          <Button
            onClick={() => onConfirm(overridesFromLead(lead, fields))}
            disabled={!canSubmit || pending}
          >
            {pending ? "Converting…" : "Create student enrollment"}
          </Button>
          <Button variant="ghost" onClick={() => setEditMode(true)}>
            Edit details
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="ed-convert-lead-form">
      {variant === "inline" ? (
        <p className="ed-text-sm ed-muted">Update fields if needed, then create the enrollment.</p>
      ) : (
        <p className="ed-text-sm ed-muted">
          Review prefilled fields from the lead. Edit if the parent confirmed different details on the call.
        </p>
      )}
      <Input
        label="Parent name"
        value={fields.parentName}
        onChange={(v) => setFields((prev) => ({ ...prev, parentName: v }))}
      />
      <p className="ed-text-sm">
        <strong>WhatsApp:</strong> {lead.whatsapp_e164 ?? "—"}
      </p>
      <Input label="Child name" value={fields.childName} onChange={(v) => setFields((prev) => ({ ...prev, childName: v }))} />
      <Input
        label="Child date of birth"
        value={fields.childDob}
        onChange={(v) => setFields((prev) => ({ ...prev, childDob: v }))}
        placeholder="YYYY-MM-DD"
      />
      <Input label="School" value={fields.schoolName} onChange={(v) => setFields((prev) => ({ ...prev, schoolName: v }))} />
      <Input label="City" value={fields.city} onChange={(v) => setFields((prev) => ({ ...prev, city: v }))} />
      <Input label="Pincode" value={fields.pincode} onChange={(v) => setFields((prev) => ({ ...prev, pincode: v }))} />
      <div className="ed-form-section">
        <Button
          onClick={() => onConfirm(overridesFromLead(lead, fields))}
          disabled={!canSubmit || pending}
        >
          {pending ? "Converting…" : "Create student enrollment"}
        </Button>
        {variant === "inline" ? (
          <Button variant="ghost" onClick={() => setEditMode(false)}>
            Back to quick confirm
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
