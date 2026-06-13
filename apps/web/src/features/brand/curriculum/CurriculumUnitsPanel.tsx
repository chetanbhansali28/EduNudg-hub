import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, FormActions, Input, SaveButton } from "@edunudg/ui";
import {
  createUnit,
  deleteUnit,
  fetchLevelUnits,
  reorderUnits,
  updateUnit,
  type CurriculumUnit,
} from "@/lib/curriculumApi";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { DeleteConfirmButton } from "@/features/shared/DeleteConfirmButton";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";

type Props = {
  brandId: string;
  levelId: string;
  canEdit: boolean;
  onError: (err: unknown) => void;
};

export function CurriculumUnitsPanel({ brandId, levelId, canEdit, onError }: Props) {
  const qc = useQueryClient();
  const unitCloser = useAddFormCloser();
  const [addTitle, setAddTitle] = useState("");
  const [addDuration, setAddDuration] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDuration, setEditDuration] = useState("");

  const units = useQuery({
    queryKey: ["level-units", levelId],
    queryFn: () => fetchLevelUnits(levelId),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["level-units", levelId] });
    void qc.invalidateQueries({ queryKey: ["level-unit-counts"] });
  };

  const add = useMutation({
    mutationFn: async () => {
      const order = (units.data?.length ?? 0) + 1;
      const duration = addDuration.trim() ? Number(addDuration) : null;
      await createUnit(brandId, levelId, { title: addTitle, durationMinutes: duration }, order);
    },
    onSuccess: () => {
      invalidate();
      setAddTitle("");
      setAddDuration("");
      unitCloser.closeAddForm();
    },
    onError,
  });

  const save = useMutation({
    mutationFn: async (unit: CurriculumUnit) => {
      const duration = editDuration.trim() ? Number(editDuration) : null;
      await updateUnit(unit.id, { title: editTitle, durationMinutes: duration });
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: deleteUnit,
    onSuccess: invalidate,
    onError,
  });

  const move = useMutation({
    mutationFn: async (ordered: CurriculumUnit[]) => {
      await reorderUnits(ordered.map((u) => u.id));
    },
    onSuccess: invalidate,
    onError,
  });

  const list = units.data ?? [];

  const shift = (index: number, direction: -1 | 1) => {
    const next = [...list];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    move.mutate(next);
  };

  if (!canEdit && list.length === 0) {
    return <p className="ed-text-sm ed-muted">No units in this level yet.</p>;
  }

  return (
    <div className="ed-curriculum-level-nested">
      <h4 className="ed-curriculum-section-title">Units</h4>
      <p className="ed-text-sm ed-muted">Lessons parents see when expanding a level on your website.</p>

      {canEdit && (
        <AddFormSection
          buttonLabel="Add unit"
          panelTitle="Add unit"
          actionsPlacement="footer"
          primaryAction={{
            label: "Add unit",
            onClick: () => add.mutate(),
            pending: add.isPending,
            disabled: !addTitle.trim(),
          }}
        >
          {({ close }) => {
            unitCloser.bindClose(close);
            return (
              <>
                <Input label="Unit title" value={addTitle} onChange={setAddTitle} editable />
                <Input
                  label="Duration (minutes, optional)"
                  value={addDuration}
                  onChange={setAddDuration}
                  editable
                />
              </>
            );
          }}
        </AddFormSection>
      )}

      {list.length === 0 && <p className="ed-text-sm ed-muted">No units yet.</p>}

      <div className="ed-curriculum-stagger">
        {list.map((unit, index) => {
          const editing = editingId === unit.id;
          return (
            <div key={unit.id} className="ed-curriculum-unit-row">
              {editing ? (
                <div className="ed-editable-form" style={{ flex: 1 }}>
                  <Input label="Title" value={editTitle} onChange={setEditTitle} editable />
                  <Input
                    label="Duration (minutes)"
                    value={editDuration}
                    onChange={setEditDuration}
                    editable
                  />
                  <FormActions>
                    <SaveButton
                      onClick={() => save.mutate(unit)}
                      pending={save.isPending}
                      disabled={!editTitle.trim()}
                    />
                    <Button variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </FormActions>
                </div>
              ) : (
                <>
                  <div>
                    <strong>{unit.title}</strong>
                    {unit.duration_minutes != null && (
                      <span className="ed-text-sm ed-muted"> · {unit.duration_minutes} min</span>
                    )}
                  </div>
                  {canEdit && (
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      <Button
                        variant="ghost"
                        aria-label={`Move ${unit.title} up`}
                        disabled={index === 0 || move.isPending}
                        onClick={() => shift(index, -1)}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label={`Move ${unit.title} down`}
                        disabled={index === list.length - 1 || move.isPending}
                        onClick={() => shift(index, 1)}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingId(unit.id);
                          setEditTitle(unit.title);
                          setEditDuration(unit.duration_minutes?.toString() ?? "");
                        }}
                      >
                        Edit
                      </Button>
                      <DeleteConfirmButton
                        onConfirm={() => remove.mutate(unit.id)}
                        description="Remove this unit from the level."
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
