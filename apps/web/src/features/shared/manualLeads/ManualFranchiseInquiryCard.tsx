import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, FormGrid, Input, MutationError, Textarea } from "@edunudg/ui";
import { createFranchiseInquiryStaff } from "@/lib/manualLeadsApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";

type Props = { brandId: string };

export function ManualFranchiseInquiryCard({ brandId }: Props) {
  return (
    <AddFormSection buttonLabel="Add franchise application" panelTitle="Add franchise application manually">
      {({ close }) => <ManualFranchiseInquiryForm brandId={brandId} onComplete={close} />}
    </AddFormSection>
  );
}

function ManualFranchiseInquiryForm({ brandId, onComplete }: { brandId: string; onComplete: () => void }) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
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
      onComplete();
    },
    onError: capture,
  });

  const canSubmit = fullName.trim() && email.trim();

  return (
    <>
      <p className="ed-text-sm ed-muted">Same fields as the public franchise application form on your brand site.</p>
      <MutationError message={error} />
      <FormGrid>
        <Input label="Full name" value={fullName} onChange={setFullName} autoComplete="name" />
        <Input label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
        <Input label="Phone" value={phone} onChange={setPhone} placeholder="+91…" autoComplete="tel" />
        <Input label="Preferred city" value={city} onChange={setCity} autoComplete="address-level2" />
        <Input label="Proposed franchise name" value={proposedName} onChange={setProposedName} />
        <Input label="Pincode" value={pincode} onChange={setPincode} />
        <Input label="State" value={state} onChange={setState} />
      </FormGrid>
      <Input label="Address" value={addressLine} onChange={setAddressLine} />
      <Textarea label="Prior experience" value={priorExperience} onChange={setPriorExperience} rows={3} />
      <Textarea label="Message (optional)" value={message} onChange={setMessage} rows={4} />
      <Button onClick={() => save.mutate()} disabled={save.isPending || !canSubmit}>
        Create application
      </Button>
    </>
  );
}
