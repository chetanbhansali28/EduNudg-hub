import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, MutationError, Select } from "@edunudg/ui";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import {
  addRandomCompetitionQuestions,
  listBrandCompetitionQuestions,
  listCompetitionBankQuestions,
  setBrandCompetitionQuestions,
} from "@/lib/competitionQuestionBankApi";
import { fetchLevels, fetchPrograms } from "@/lib/curriculumApi";

type Props = { brandId: string; competitionId: string; canEdit: boolean };

export function BrandCompetitionQuestionsPanel({ brandId, competitionId, canEdit }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [programId, setProgramId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [randomCount, setRandomCount] = useState("5");

  const programs = useQuery({
    queryKey: ["curriculum-programs", brandId],
    queryFn: () => fetchPrograms(brandId),
  });
  const levels = useQuery({
    queryKey: ["curriculum-levels", programId],
    enabled: !!programId,
    queryFn: () => fetchLevels(programId),
  });
  const bank = useQuery({
    queryKey: ["competition-bank", brandId, programId, levelId],
    enabled: !!programId && !!levelId,
    queryFn: () => listCompetitionBankQuestions(brandId, programId, levelId),
  });
  const attached = useQuery({
    queryKey: ["competition-attached", brandId, competitionId],
    queryFn: () => listBrandCompetitionQuestions(brandId, competitionId),
  });

  const attachedIds = useMemo(
    () => new Set((attached.data ?? []).map((q) => q.bank_question_id).filter(Boolean) as string[]),
    [attached.data]
  );
  const available = (bank.data ?? []).filter((q) => q.is_active && !attachedIds.has(q.id));

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["competition-attached", brandId, competitionId] });
    void qc.invalidateQueries({ queryKey: ["competition-bank", brandId] });
  };

  const attachSelected = useMutation({
    mutationFn: async () => {
      clear();
      const picked = Object.entries(selected)
        .filter(([, on]) => on)
        .map(([id]) => id);
      const current = (attached.data ?? []).map((q) => q.bank_question_id).filter(Boolean) as string[];
      await setBrandCompetitionQuestions(brandId, competitionId, [...current, ...picked]);
    },
    onSuccess: () => {
      setSelected({});
      invalidate();
    },
    onError: capture,
  });

  const addRandom = useMutation({
    mutationFn: async () => {
      clear();
      const n = Number(randomCount);
      await addRandomCompetitionQuestions(brandId, competitionId, programId, levelId, n);
    },
    onSuccess: invalidate,
    onError: capture,
  });

  const removeOne = useMutation({
    mutationFn: async (bankQuestionId: string) => {
      clear();
      const remaining = (attached.data ?? [])
        .map((q) => q.bank_question_id)
        .filter((id): id is string => !!id && id !== bankQuestionId);
      await setBrandCompetitionQuestions(brandId, competitionId, remaining);
    },
    onSuccess: invalidate,
    onError: capture,
  });

  const locked = String(error ?? "").includes("QUESTIONS_LOCKED");

  return (
    <div className="ed-comp-questions">
      <h4 className="ed-brand-merch-item__title">Quiz questions</h4>
      <p className="ed-brand-merch-section__subtitle">
        Pick from the question bank or add a random set for a course and level. Snapshots stay frozen after
        the first student attempt.
      </p>
      <MutationError message={error} />
      {locked ? <p className="ed-text-sm ed-muted">This paper is locked because a student has started the quiz.</p> : null}

      <p className="ed-text-sm">
        Attached: <strong>{attached.data?.length ?? 0}</strong>
      </p>
      <ol className="ed-comp-questions__attached">
        {(attached.data ?? []).map((q, i) => (
          <li key={q.id}>
            <span>
              {i + 1}. {q.prompt}
            </span>
            {canEdit && q.bank_question_id ? (
              <Button variant="ghost" onClick={() => removeOne.mutate(q.bank_question_id!)} disabled={removeOne.isPending}>
                Remove
              </Button>
            ) : null}
          </li>
        ))}
      </ol>

      {canEdit ? (
        <>
          <Select
            label="Course"
            value={programId}
            onChange={(v) => {
              setProgramId(v);
              setLevelId("");
            }}
            options={[
              { value: "", label: "Select course" },
              ...(programs.data ?? []).map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          <Select
            label="Level"
            value={levelId}
            onChange={setLevelId}
            options={[
              { value: "", label: "Select level" },
              ...(levels.data ?? []).map((l) => ({ value: l.id, label: l.name })),
            ]}
          />

          {available.length > 0 ? (
            <ul className="ed-comp-questions__bank">
              {available.map((q) => (
                <li key={q.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(selected[q.id])}
                      onChange={(e) => setSelected((prev) => ({ ...prev, [q.id]: e.target.checked }))}
                    />{" "}
                    {q.prompt}
                  </label>
                </li>
              ))}
            </ul>
          ) : programId && levelId ? (
            <p className="ed-muted ed-text-sm">No unused bank questions for this level.</p>
          ) : null}

          <div className="ed-comp-questions__actions">
            <Button
              onClick={() => attachSelected.mutate()}
              disabled={attachSelected.isPending || !Object.values(selected).some(Boolean)}
            >
              Add selected
            </Button>
            <Input label="Random count" value={randomCount} onChange={setRandomCount} type="number" />
            <Button
              onClick={() => addRandom.mutate()}
              disabled={addRandom.isPending || !programId || !levelId}
            >
              Add random
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
