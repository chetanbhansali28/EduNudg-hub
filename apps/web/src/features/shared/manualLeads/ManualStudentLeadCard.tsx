import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, FormGrid, Input, MutationError, Textarea } from "@edunudg/ui";
import { createBrandStudentLeadStaff, createCenterStudentLeadStaff } from "@/lib/manualLeadsApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

type Props =
  | { scope: "brand"; brandId: string; invalidateKey: unknown[] }
  | { scope: "center"; centerId: string; invalidateKey: unknown[] };

export function ManualStudentLeadCard(props: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [parentName, setParentName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [childName, setChildName] = useState("");
  const [notes, setNotes] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      clear();
      const payload = {
        parentName,
        whatsappE164: whatsapp,
        email,
        city,
        pincode,
        childName,
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
      setNotes("");
    },
    onError: capture,
  });

  return (
    <Card title="Add student lead manually">
      <p className="ed-text-sm ed-muted">Walk-in or phone enquiry — merges on duplicate WhatsApp per brand.</p>
      <MutationError message={error} />
      <FormGrid>
        <Input label="Parent name" value={parentName} onChange={setParentName} />
        <Input label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="+91…" />
        <Input label="Email" value={email} onChange={setEmail} type="email" />
        <Input label="City" value={city} onChange={setCity} />
        {props.scope === "brand" && <Input label="Pincode" value={pincode} onChange={setPincode} />}
        <Input label="Child name" value={childName} onChange={setChildName} />
      </FormGrid>
      <Textarea label="Notes" value={notes} onChange={setNotes} rows={2} />
      <Button
        onClick={() => save.mutate()}
        disabled={save.isPending || !parentName.trim() || !whatsapp.trim()}
      >
        Create lead
      </Button>
    </Card>
  );
}
