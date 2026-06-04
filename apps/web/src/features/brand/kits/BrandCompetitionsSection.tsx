import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, DataList, FormGrid, Input, ListRow, MutationError, Select } from "@edunudg/ui";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import { listBrandCompetitions, upsertBrandCompetition } from "@/lib/brandCompetitionsApi";

type Props = { brandId: string };

export function BrandCompetitionsSection({ brandId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const { bindClose, closeAddForm } = useAddFormCloser();

  const competitions = useQuery({
    queryKey: ["brand-competitions", brandId],
    enabled: !!brandId,
    queryFn: () => listBrandCompetitions(brandId),
  });

  const create = useMutation({
    mutationFn: async () => {
      clear();
      await upsertBrandCompetition(brandId, { name, eventDate, location, isActive: true });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["brand-competitions", brandId] });
      setName("");
      setEventDate("");
      setLocation("");
      closeAddForm();
    },
    onError: capture,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive, row }: { id: string; isActive: boolean; row: { name: string; event_date: string | null; location: string | null } }) => {
      clear();
      await upsertBrandCompetition(brandId, {
        id,
        name: row.name,
        eventDate: row.event_date ?? undefined,
        location: row.location ?? undefined,
        isActive,
      });
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["brand-competitions", brandId] }),
    onError: capture,
  });

  return (
    <Card title="Competitions">
      <p className="ed-text-sm ed-muted">Upcoming competitions appear on the student learn dashboard for linked parents.</p>
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
              </div>
              <Select
                label="Status"
                value={c.is_active ? "active" : "inactive"}
                onChange={(v) =>
                  toggleActive.mutate({
                    id: c.id,
                    isActive: v === "active",
                    row: { name: c.name, event_date: c.event_date, location: c.location },
                  })
                }
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
            </div>
          </ListRow>
        )}
      />
    </Card>
  );
}
