import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  FormGrid,
  Input,
  ListRow,
  MutationError,
  Select,
  ToggleField,
} from "@edunudg/ui";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import { listBrandCompetitions, upsertBrandCompetition, type BrandCompetition } from "@/lib/brandCompetitionsApi";

type Props = { brandId: string };

export function BrandCompetitionsSection({ brandId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [feeType, setFeeType] = useState<"free" | "paid">("free");
  const [registrationClosesAt, setRegistrationClosesAt] = useState("");
  const { bindClose, closeAddForm } = useAddFormCloser();

  const competitions = useQuery({
    queryKey: ["brand-competitions", brandId],
    enabled: !!brandId,
    queryFn: () => listBrandCompetitions(brandId),
  });

  const create = useMutation({
    mutationFn: async () => {
      clear();
      await upsertBrandCompetition(brandId, {
        name,
        eventDate,
        location,
        isActive: true,
        feeType,
        registrationClosesAt: registrationClosesAt || undefined,
        registrationMode: "open",
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["brand-competitions", brandId] });
      setName("");
      setEventDate("");
      setLocation("");
      setFeeType("free");
      setRegistrationClosesAt("");
      closeAddForm();
    },
    onError: capture,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive, row }: { id: string; isActive: boolean; row: BrandCompetition }) => {
      clear();
      await upsertBrandCompetition(brandId, {
        id,
        name: row.name,
        eventDate: row.event_date ?? undefined,
        location: row.location ?? undefined,
        isActive,
        feeType: row.fee_type,
        feeAmount: row.fee_amount,
        registrationOpensAt: row.registration_opens_at ?? undefined,
        registrationClosesAt: row.registration_closes_at ?? undefined,
        registrationMode: row.registration_mode,
        maxParticipants: row.max_participants,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["brand-competitions", brandId] }),
    onError: capture,
  });

  return (
    <Card title="Competitions">
      <p className="ed-text-sm ed-muted">
        Competitions appear on the student learn portal. Free events allow self-enrollment; paid events show
        Coming soon.
      </p>
      <MutationError message={error} />
      <AddFormSection buttonLabel="Add competition" panelTitle="Add competition">
        {({ close }) => {
          bindClose(close);
          return (
            <>
              <FormGrid>
                <Input label="Name" value={name} onChange={setName} />
                <Input label="Event date" value={eventDate} onChange={setEventDate} type="date" />
                <Input label="Location" value={location} onChange={setLocation} />
                <Select
                  label="Fee type"
                  value={feeType}
                  onChange={(v) => setFeeType(v as "free" | "paid")}
                  options={[
                    { value: "free", label: "Free — student can enroll" },
                    { value: "paid", label: "Paid — Coming soon on portal" },
                  ]}
                />
                <Input
                  label="Registration closes"
                  value={registrationClosesAt}
                  onChange={setRegistrationClosesAt}
                  type="datetime-local"
                />
              </FormGrid>
              <Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}>
                Add competition
              </Button>
            </>
          );
        }}
      </AddFormSection>
      <DataList
        items={competitions.data ?? []}
        empty="No competitions scheduled."
        render={(c) => (
          <ListRow>
            <div>
              <strong>{c.name}</strong>
              <div className="ed-text-sm ed-muted">
                {c.event_date ?? "Date TBD"}
                {c.location ? ` · ${c.location}` : ""}
                {c.fee_type === "paid" && <Badge>Paid</Badge>}
              </div>
              <ToggleField
                label="Active"
                description="Visible on student learn dashboard"
                checked={c.is_active}
                onChange={(checked) => toggleActive.mutate({ id: c.id, isActive: checked, row: c })}
              />
            </div>
          </ListRow>
        )}
      />
    </Card>
  );
}
