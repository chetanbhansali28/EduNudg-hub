import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, FormGrid, Input, MutationError, Textarea } from "@edunudg/ui";
import { createFranchiseInquiryStaff } from "@/lib/manualLeadsApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

type Props = { brandId: string };

export function ManualFranchiseInquiryCard({ brandId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [proposedName, setProposedName] = useState("");
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
      setMessage("");
    },
    onError: capture,
  });

  return (
    <Card title="Add franchise application manually">
      <MutationError message={error} />
      <FormGrid>
        <Input label="Full name" value={fullName} onChange={setFullName} />
        <Input label="Email" value={email} onChange={setEmail} type="email" />
        <Input label="Phone" value={phone} onChange={setPhone} />
        <Input label="City" value={city} onChange={setCity} />
        <Input label="Proposed franchise name" value={proposedName} onChange={setProposedName} />
      </FormGrid>
      <Textarea label="Notes" value={message} onChange={setMessage} rows={2} />
      <Button onClick={() => save.mutate()} disabled={save.isPending || !fullName.trim() || !email.trim()}>
        Create application
      </Button>
    </Card>
  );
}
