import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormGrid, Input, MutationError, Select, Textarea, ToggleField } from "@edunudg/ui";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import {
  deleteCompetitionBankQuestion,
  listCompetitionBankQuestions,
  upsertCompetitionBankQuestion,
  type BankQuestion,
} from "@/lib/competitionQuestionBankApi";
import { fetchLevels, fetchPrograms } from "@/lib/curriculumApi";
import "@/features/brand/merchandise/brandMerchandiseCatalog.css";

type Props = { brandId: string; canEdit: boolean };

type OptionForm = { text: string; is_correct: boolean };

type QuestionForm = {
  programId: string;
  levelId: string;
  prompt: string;
  explanation: string;
  isActive: boolean;
  options: OptionForm[];
};

const emptyOptions: OptionForm[] = [
  { text: "", is_correct: true },
  { text: "", is_correct: false },
];

const emptyForm: QuestionForm = {
  programId: "",
  levelId: "",
  prompt: "",
  explanation: "",
  isActive: true,
  options: emptyOptions,
};

function rowToForm(row: BankQuestion): QuestionForm {
  return {
    programId: row.program_id,
    levelId: row.level_id,
    prompt: row.prompt,
    explanation: row.explanation ?? "",
    isActive: row.is_active,
    options: (row.options ?? []).map((o) => ({ text: o.text, is_correct: o.is_correct })),
  };
}

function validForm(f: QuestionForm): boolean {
  const filled = f.options.filter((o) => o.text.trim());
  return (
    !!f.programId &&
    !!f.levelId &&
    f.prompt.trim().length > 0 &&
    filled.length >= 2 &&
    filled.length <= 6 &&
    filled.some((o) => o.is_correct)
  );
}

export function BrandCompetitionQuestionBankSection({ brandId, canEdit }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [filterProgram, setFilterProgram] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const { bindClose, closeAddForm } = useAddFormCloser();

  const programs = useQuery({
    queryKey: ["curriculum-programs", brandId],
    queryFn: () => fetchPrograms(brandId),
  });
  const filterLevels = useQuery({
    queryKey: ["curriculum-levels", filterProgram],
    enabled: !!filterProgram,
    queryFn: () => fetchLevels(filterProgram),
  });
  const formLevels = useQuery({
    queryKey: ["curriculum-levels", form.programId],
    enabled: !!form.programId,
    queryFn: () => fetchLevels(form.programId),
  });
  const editLevels = useQuery({
    queryKey: ["curriculum-levels", editForm.programId],
    enabled: !!editForm.programId,
    queryFn: () => fetchLevels(editForm.programId),
  });
  const questions = useQuery({
    queryKey: ["competition-bank", brandId, filterProgram || null, filterLevel || null],
    queryFn: () =>
      listCompetitionBankQuestions(brandId, filterProgram || undefined, filterLevel || undefined),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["competition-bank", brandId] });

  const toPayload = (f: QuestionForm, id?: string) => ({
    id,
    programId: f.programId,
    levelId: f.levelId,
    prompt: f.prompt,
    explanation: f.explanation,
    isActive: f.isActive,
    options: f.options.filter((o) => o.text.trim()).map((o) => ({ text: o.text.trim(), is_correct: o.is_correct })),
  });

  const create = useMutation({
    mutationFn: async () => {
      clear();
      await upsertCompetitionBankQuestion(brandId, toPayload(form));
    },
    onSuccess: () => {
      invalidate();
      setForm(emptyForm);
      closeAddForm();
    },
    onError: capture,
  });

  const update = useMutation({
    mutationFn: async (id: string) => {
      clear();
      await upsertCompetitionBankQuestion(brandId, toPayload(editForm, id));
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
    onError: capture,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      clear();
      await deleteCompetitionBankQuestion(brandId, id);
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
    onError: capture,
  });

  const renderOptions = (
    f: QuestionForm,
    setF: (value: QuestionForm | ((prev: QuestionForm) => QuestionForm)) => void
  ) => (
    <div className="ed-comp-options">
      {f.options.map((opt, i) => (
        <div key={i} className="ed-comp-options__row">
          <Input
            label={`Option ${i + 1}`}
            value={opt.text}
            onChange={(text) =>
              setF((prev) => {
                const options = [...prev.options];
                options[i] = { ...options[i]!, text };
                return { ...prev, options };
              })
            }
          />
          <ToggleField
            label="Correct"
            checked={opt.is_correct}
            onChange={(is_correct) =>
              setF((prev) => {
                const options = [...prev.options];
                options[i] = { ...options[i]!, is_correct };
                return { ...prev, options };
              })
            }
          />
        </div>
      ))}
      {f.options.length < 6 ? (
        <button
          type="button"
          className="ed-link-button ed-text-sm"
          onClick={() => setF((prev) => ({ ...prev, options: [...prev.options, { text: "", is_correct: false }] }))}
        >
          Add option
        </button>
      ) : null}
    </div>
  );

  const renderFields = (
    f: QuestionForm,
    setF: (value: QuestionForm | ((prev: QuestionForm) => QuestionForm)) => void,
    levelOptions: { id: string; name: string }[]
  ) => (
    <FormGrid>
      <Select
        label="Course"
        value={f.programId}
        onChange={(programId) => setF((prev) => ({ ...prev, programId, levelId: "" }))}
        options={[
          { value: "", label: "Select course" },
          ...(programs.data ?? []).map((p) => ({ value: p.id, label: p.name })),
        ]}
      />
      <Select
        label="Level"
        value={f.levelId}
        onChange={(levelId) => setF((prev) => ({ ...prev, levelId }))}
        options={[
          { value: "", label: "Select level" },
          ...levelOptions.map((l) => ({ value: l.id, label: l.name })),
        ]}
      />
      <Textarea label="Question" value={f.prompt} onChange={(prompt) => setF((prev) => ({ ...prev, prompt }))} rows={3} />
      <Textarea
        label="Explanation (optional)"
        value={f.explanation}
        onChange={(explanation) => setF((prev) => ({ ...prev, explanation }))}
        rows={2}
      />
      {renderOptions(f, setF)}
      <ToggleField
        label="Active"
        checked={f.isActive}
        onChange={(isActive) => setF((prev) => ({ ...prev, isActive }))}
      />
    </FormGrid>
  );

  const rows = questions.data ?? [];

  return (
    <div className="ed-brand-merch-section">
      <MutationError message={error} />
      <section className="ed-brand-merch-section__panel">
        <header className="ed-brand-merch-section__head">
          <div>
            <h2 className="ed-brand-merch-section__title">Question bank</h2>
            <p className="ed-brand-merch-section__subtitle">
              Author multiple-choice questions by curriculum course and level. Attach them to events from the
              Events tab.
            </p>
          </div>
        </header>
        <div className="ed-brand-merch-section__body">
          <FormGrid>
            <Select
              label="Filter course"
              value={filterProgram}
              onChange={(v) => {
                setFilterProgram(v);
                setFilterLevel("");
              }}
              options={[
                { value: "", label: "All courses" },
                ...(programs.data ?? []).map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
            <Select
              label="Filter level"
              value={filterLevel}
              onChange={setFilterLevel}
              options={[
                { value: "", label: "All levels" },
                ...(filterLevels.data ?? []).map((l) => ({ value: l.id, label: l.name })),
              ]}
            />
          </FormGrid>

          {canEdit ? (
            <AddFormSection
              buttonLabel="Add question"
              panelTitle="Add question"
              actionsPlacement="footer"
              primaryAction={{
                label: "Add question",
                onClick: () => create.mutate(),
                pending: create.isPending,
                disabled: !validForm(form),
              }}
            >
              {({ close }) => {
                bindClose(close);
                return renderFields(form, setForm, formLevels.data ?? []);
              }}
            </AddFormSection>
          ) : null}

          {rows.length === 0 ? (
            <p className="ed-brand-merch-catalog__empty">No questions in the bank yet.</p>
          ) : (
            <div className="ed-brand-merch-section__list">
              {rows.map((q) => {
                const editing = editingId === q.id;
                return (
                  <article key={q.id} className="ed-brand-merch-item">
                    <div className="ed-brand-merch-item__inner">
                      <div className="ed-brand-merch-item__head">
                        <div>
                          <h3 className="ed-brand-merch-item__title">{q.prompt}</h3>
                          <p className="ed-brand-merch-item__meta">
                            {(q.options ?? []).length} options
                            {q.is_active ? "" : " · Inactive"}
                          </p>
                        </div>
                        {canEdit ? (
                          <CrudRowActions
                            editing={editing}
                            onEdit={() => {
                              setEditingId(q.id);
                              setEditForm(rowToForm(q));
                            }}
                            onSave={() => update.mutate(q.id)}
                            onCancel={() => setEditingId(null)}
                            onDelete={() => remove.mutate(q.id)}
                            deleteTitle="Delete question"
                            deleteDescription="Removes this bank question. Snapshots already attached to competitions stay in place."
                            saveDisabled={!validForm(editForm) || update.isPending}
                          />
                        ) : null}
                      </div>
                      {editing ? renderFields(editForm, setEditForm, editLevels.data ?? []) : (
                        <ul className="ed-comp-options__preview">
                          {(q.options ?? []).map((o, i) => (
                            <li key={o.id ?? i}>
                              {o.text}
                              {o.is_correct ? " (correct)" : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
