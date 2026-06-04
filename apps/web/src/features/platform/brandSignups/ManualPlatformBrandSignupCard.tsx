import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, FormGrid, Input, MutationError, Textarea } from "@edunudg/ui";
import { createPlatformBrandSignupStaff } from "@/lib/manualLeadsApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

export function ManualPlatformBrandSignupCard() {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [requestedName, setRequestedName] = useState("");
  const [adminFullName, setAdminFullName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      clear();
      const { error: err } = await createPlatformBrandSignupStaff({
        requestedName,
        adminFullName,
        email,
        city,
        phoneE164: phone,
        message,
      });
      if (err) throw new Error(err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["platform-brand-signups"] });
      setRequestedName("");
      setAdminFullName("");
      setEmail("");
      setCity("");
      setPhone("");
      setMessage("");
    },
    onError: capture,
  });

  return (
    <Card title="Add brand signup manually">
      <p className="ed-text-sm ed-muted">Phone or event lead — appears below for approval before the brand goes live.</p>
      <MutationError message={error} />
      <FormGrid>
        <Input label="Brand name" value={requestedName} onChange={setRequestedName} />
        <Input label="Admin name" value={adminFullName} onChange={setAdminFullName} />
        <Input label="Email" value={email} onChange={setEmail} type="email" />
        <Input label="City" value={city} onChange={setCity} />
        <Input label="Phone" value={phone} onChange={setPhone} />
      </FormGrid>
      <Textarea label="Notes" value={message} onChange={setMessage} rows={2} />
      <Button
        onClick={() => save.mutate()}
        disabled={save.isPending || !requestedName.trim() || !adminFullName.trim() || !email.trim() || !city.trim()}
      >
        Create signup request
      </Button>
    </Card>
  );
}
