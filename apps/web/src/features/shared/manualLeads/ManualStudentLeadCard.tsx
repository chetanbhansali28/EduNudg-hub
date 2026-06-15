import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormGrid, Input, MutationError, Textarea } from "@edunudg/ui";
import { createBrandStudentLeadStaff, createCenterStudentLeadStaff } from "@/lib/manualLeadsApi";
import { PHONE_INPUT_PLACEHOLDER } from "@/lib/phoneInput";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { isIndiaPincode } from "@/lib/leadSla";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";

type Props =
  | { scope: "brand"; brandId: string; invalidateKey: unknown[]; formOpen?: boolean; onFormOpenChange?: (open: boolean) => void; hideTrigger?: boolean }
  | { scope: "center"; centerId: string; invalidateKey: unknown[]; formOpen?: boolean; onFormOpenChange?: (open: boolean) => void; hideTrigger?: boolean };

export function ManualStudentLeadCard(props: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const { bindClose, closeAddForm } = useAddFormCloser();
  const [parentName, setParentName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [childName, setChildName] = useState("");
  const [childDob, setChildDob] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [notes, setNotes] = useState("");

  const isBrand = props.scope === "brand";
  const pincodeRequired = isBrand;
  const pincodeValid = pincodeRequired ? isIndiaPincode(pincode) : !pincode.trim() || isIndiaPincode(pincode);
  const pincodeHint =
    pincode.trim() && !pincodeValid
      ? isBrand
        ? "Enter a valid 6-digit India pincode"
        : "Use a 6-digit India pincode or leave blank"
      : undefined;

  const save = useMutation({
    mutationFn: async () => {
      if (!pincodeValid) {
        throw new Error(
          isBrand ? "Enter a valid 6-digit India pincode." : "Enter a valid 6-digit India pincode or leave blank."
        );
      }
      clear();
      const payload = {
        parentName,
        whatsappE164: whatsapp,
        email,
        city,
        pincode: pincode || undefined,
        childName,
        childDob: childDob || undefined,
        schoolName: schoolName || undefined,
        notes,
      };
      if (props.scope === "brand") {
        const { error: err } = await createBrandStudentLeadStaff(props.brandId, payload);
        if (err) throw new Error(err);
      } else {
        const { error: err } = await createCenterStudentLeadStaff(props.centerId, payload);
        if (err) throw new Error(err);
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: props.invalidateKey });
      setParentName("");
      setWhatsapp("");
      setEmail("");
      setCity("");
      setPincode("");
      setChildName("");
      setChildDob("");
      setSchoolName("");
      setNotes("");
      closeAddForm();
    },
    onError: capture,
  });

  const brandCanSubmit =
    parentName.trim() &&
    whatsapp.trim() &&
    email.trim() &&
    city.trim() &&
    pincode.trim() &&
    pincodeValid;

  const centerCanSubmit = parentName.trim() && whatsapp.trim() && email.trim() && pincodeValid;

  return (
    <AddFormSection
      buttonLabel="Add lead"
      panelTitle="Add student lead manually"
      open={props.formOpen}
      onOpenChange={props.onFormOpenChange}
      hideTrigger={props.hideTrigger}
      primaryAction={{
        label: "Create lead",
        onClick: () => save.mutate(),
        pending: save.isPending,
        disabled: !(isBrand ? brandCanSubmit : centerCanSubmit),
      }}
    >
      {({ close }) => {
        bindClose(close);
        return (
          <>
            <p className="ed-text-sm ed-muted">
              Walk-in or phone enquiry — same fields as the public {isBrand ? "student application" : "center registration"}{" "}
              form. Duplicate WhatsApp merges per brand.
            </p>
            <MutationError message={error} />
            <FormGrid>
              <Input label="Parent name" value={parentName} onChange={setParentName} />
              <Input
                label="WhatsApp number"
                value={whatsapp}
                onChange={setWhatsapp}
                placeholder={PHONE_INPUT_PLACEHOLDER}
              />
              <Input label="Email" value={email} onChange={setEmail} type="email" />
              {isBrand ? (
                <>
                  <Input label="City" value={city} onChange={setCity} />
                  <Input label="Pincode" value={pincode} onChange={setPincode} placeholder="6 digits" />
                </>
              ) : (
                <>
                  <Input label="Child name" value={childName} onChange={setChildName} />
                  <Input label="City (optional)" value={city} onChange={setCity} />
                  <Input label="Pincode (optional)" value={pincode} onChange={setPincode} placeholder="6 digits" />
                </>
              )}
              {isBrand && <Input label="Child name" value={childName} onChange={setChildName} />}
            </FormGrid>
            {pincodeHint && <p className="ed-text-sm ed-muted">{pincodeHint}</p>}
            <Input label="Child date of birth" value={childDob} onChange={setChildDob} type="date" />
            {isBrand && <Input label="School name (optional)" value={schoolName} onChange={setSchoolName} />}
            <Textarea label="Notes (optional)" value={notes} onChange={setNotes} rows={2} />
          </>
        );
      }}
    </AddFormSection>
  );
}
