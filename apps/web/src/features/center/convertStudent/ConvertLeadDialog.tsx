import { useState } from "react";
import { Button, Card, Input } from "@edunudg/ui";
import type { LeadRow } from "@/lib/leadsApi";

export type ConvertLeadDialogProps = {
  lead: LeadRow;
  onConfirm: (overrides: {
    parentName: string;
    childName: string;
    childDob: string;
    schoolName: string;
    city: string;
    pincode: string;
  }) => void;
  onCancel: () => void;
  pending?: boolean;
};

export function ConvertLeadDialog({ lead, onConfirm, onCancel, pending }: ConvertLeadDialogProps) {
  const [parentName, setParentName] = useState(lead.parent_name ?? lead.full_name);
  const [childName, setChildName] = useState(lead.child_name ?? "");
  const [childDob, setChildDob] = useState(lead.child_dob ?? "");
  const [schoolName, setSchoolName] = useState(lead.school_name ?? "");
  const [city, setCity] = useState(lead.city ?? "");
  const [pincode, setPincode] = useState(lead.pincode ?? "");

  return (
    <Card title="Convert to student">
      <p className="ed-text-sm ed-muted">
        Review prefilled fields from the lead. Edit if the parent confirmed different details on the call.
      </p>
      <Input label="Parent name" value={parentName} onChange={setParentName} />
      <p className="ed-text-sm">
        <strong>WhatsApp:</strong> {lead.whatsapp_e164 ?? "—"}
      </p>
      <Input label="Child name" value={childName} onChange={setChildName} />
      <Input label="Child date of birth" value={childDob} onChange={setChildDob} placeholder="YYYY-MM-DD" />
      <Input label="School" value={schoolName} onChange={setSchoolName} />
      <Input label="City" value={city} onChange={setCity} />
      <Input label="Pincode" value={pincode} onChange={setPincode} />
      <Button
        onClick={() =>
          onConfirm({
            parentName: parentName.trim(),
            childName: childName.trim(),
            childDob: childDob.trim(),
            schoolName: schoolName.trim(),
            city: city.trim(),
            pincode: pincode.trim(),
          })
        }
        disabled={!parentName.trim() || !childName.trim() || pending}
      >
        {pending ? "Converting…" : "Create student enrollment"}
      </Button>
      <Button variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </Card>
  );
}
