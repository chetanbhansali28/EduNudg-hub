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

type ChapterDraft = {
  title: string;
  duration: string;
};

function unitToDraft(unit: CurriculumUnit): ChapterDraft {
  return {
    title: unit.title,
    duration: unit.duration_minutes?.toString() ?? "",
  };
}

export function CurriculumUnitsPanel({ brandId, levelId, canEdit, onError }: Props) {
  const qc = useQueryClient();
  const chapterCloser = useAddFormCloser();
  const [addTitle, setAddTitle] = useState("");
  const [addDuration, setAddDuration] = useState("");
  const [drafts, setDrafts] = useState<Record<string, ChapterDraft>>({});

  const chapters = useQuery({
    queryKey: ["level-units", levelId],
    queryFn: () => fetchLevelUnits(levelId),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["level-units", levelId] });
    void qc.invalidateQueries({ queryKey: ["level-unit-counts"] });
  };

  const add = useMutation({
    mutationFn: async () => {
      const order = (chapters.data?.length ?? 0) + 1;
      const duration = addDuration.trim() ? Number(addDuration) : null;
      await createUnit(brandId, levelId, { title: addTitle, durationMinutes: duration }, order);
    },
    onSuccess: () => {
      invalidate();
      setAddTitle("");
      setAddDuration("");
      chapterCloser.closeAddForm();
    },
    onError,
  });

  const save = useMutation({
    mutationFn: async (unit: CurriculumUnit) => {
      const draft = drafts[unit.id] ?? unitToDraft(unit);
      const duration = draft.duration.trim() ? Number(draft.duration) : null;
      await updateUnit(unit.id, { title: draft.title, durationMinutes: duration });
    },
    onSuccess: (_, unit) => {
      invalidate();
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[unit.id];
        return next;
      });
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

  const list = chapters.data ?? [];

  const shift = (index: number, direction: -1 | 1) => {
    const next = [...list];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    move.mutate(next);
  };

  const draftFor = (unit: CurriculumUnit) => drafts[unit.id] ?? unitToDraft(unit);

  const setDraft = (unitId: string, patch: Partial<ChapterDraft>, fallback: CurriculumUnit) => {
    setDrafts((prev) => ({
      ...prev,
      [unitId]: { ...draftFor(fallback), ...patch },
    }));
  };

  if (!canEdit && list.length === 0) {
    return <p className="ed-text-sm ed-muted">No chapters in this program yet.</p>;
  }

  return (
    <div className="ed-curriculum-level-nested">
      <h4 className="ed-curriculum-section-title">Chapters</h4>
      <p className="ed-text-sm ed-muted">
        What students learn in this program — shown on your website and used by centers when teaching.
      </p>

      {canEdit && (
        <AddFormSection
          buttonLabel="Add chapter"
          panelTitle="Add chapter"
          actionsPlacement="footer"
          primaryAction={{
            label: "Add chapter",
            onClick: () => add.mutate(),
            pending: add.isPending,
            disabled: !addTitle.trim(),
          }}
        >
          {({ close }) => {
            chapterCloser.bindClose(close);
            return (
              <>
                <Input
                  label="Chapter title"
                  value={addTitle}
                  onChange={setAddTitle}
                  placeholder="Numbers 1–100 on abacus"
                  editable
                />
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

      {list.length === 0 && <p className="ed-text-sm ed-muted">No chapters yet.</p>}

      <div className="ed-curriculum-stagger">
        {list.map((chapter, index) => {
          const draft = draftFor(chapter);
          return (
            <div key={chapter.id} className="ed-curriculum-chapter-row">
              {canEdit ? (
                <div className="ed-editable-form ed-curriculum-chapter-row__form">
                  <Input
                    label="Chapter title"
                    value={draft.title}
                    onChange={(title) => setDraft(chapter.id, { title }, chapter)}
                    editable
                  />
                  <Input
                    label="Duration (minutes, optional)"
                    value={draft.duration}
                    onChange={(duration) => setDraft(chapter.id, { duration }, chapter)}
                    editable
                  />
                  <FormActions>
                    <SaveButton
                      onClick={() => save.mutate(chapter)}
                      pending={save.isPending && save.variables?.id === chapter.id}
                      disabled={!draft.title.trim()}
                      label="Save chapter"
                    />
                    <Button
                      variant="ghost"
                      aria-label={`Move ${chapter.title} up`}
                      disabled={index === 0 || move.isPending}
                      onClick={() => shift(index, -1)}
                    >
                      Move up
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label={`Move ${chapter.title} down`}
                      disabled={index === list.length - 1 || move.isPending}
                      onClick={() => shift(index, 1)}
                    >
                      Move down
                    </Button>
                    <DeleteConfirmButton
                      onConfirm={() => remove.mutate(chapter.id)}
                      description="Remove this chapter from the program."
                    >
                      Delete
                    </DeleteConfirmButton>
                  </FormActions>
                </div>
              ) : (
                <>
                  <div>
                    <strong>{chapter.title}</strong>
                    {chapter.duration_minutes != null && (
                      <span className="ed-text-sm ed-muted"> · {chapter.duration_minutes} min</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
