import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormGrid, Input, MutationError, Textarea } from "@edunudg/ui";
import { createFranchiseInquiryStaff } from "@/lib/manualLeadsApi";
import { PHONE_INPUT_PLACEHOLDER } from "@/lib/phoneInput";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";

type Props = { brandId: string };

export function ManualFranchiseInquiryCard({ brandId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const { bindClose, closeAddForm } = useAddFormCloser();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [proposedName, setProposedName] = useState("");
  const [pincode, setPincode] = useState("");
  const [state, setState] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [priorExperience, setPriorExperience] = useState("");
  const [message, setMessage] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      clear();
      const { error: err } = await createFranchiseInquiryStaff(brandId, {
        fullName,
        email,
        phoneE164: phone,
        city,
        proposedFranchiseName: proposedName,
        pincode,
        state,
        addressLine,
        priorExperience,
        message,
      });
      if (err) throw new Error(err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["franchise-inquiries", brandId] });
      setFullName("");
      setEmail("");
      setPhone("");
      setCity("");
      setProposedName("");
      setPincode("");
      setState("");
      setAddressLine("");
      setPriorExperience("");
      setMessage("");
      closeAddForm();
    },
    onError: capture,
  });

  const canSubmit = fullName.trim() && email.trim();

  return (
    <AddFormSection
      buttonLabel="Add franchise application"
      panelTitle="Add franchise application manually"
      primaryAction={{
        label: "Create application",
        onClick: () => save.mutate(),
        pending: save.isPending,
        disabled: !canSubmit,
      }}
    >
      {({ close }) => {
        bindClose(close);
        return (
          <>
            <p className="ed-text-sm ed-muted">Same fields as the public franchise application form on your brand site.</p>
            <MutationError message={error} />
            <FormGrid>
              <Input label="Full name" value={fullName} onChange={setFullName} autoComplete="name" />
              <Input label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
              <Input
                label="Phone"
                value={phone}
                onChange={setPhone}
                placeholder={PHONE_INPUT_PLACEHOLDER}
                autoComplete="tel"
              />
              <Input label="Preferred city" value={city} onChange={setCity} autoComplete="address-level2" />
              <Input label="Proposed franchise name" value={proposedName} onChange={setProposedName} />
              <Input label="Pincode" value={pincode} onChange={setPincode} />
              <Input label="State" value={state} onChange={setState} />
            </FormGrid>
            <Input label="Address" value={addressLine} onChange={setAddressLine} />
            <Textarea label="Prior experience" value={priorExperience} onChange={setPriorExperience} rows={3} />
            <Textarea label="Message (optional)" value={message} onChange={setMessage} rows={4} />
          </>
        );
      }}
    </AddFormSection>
  );
}
