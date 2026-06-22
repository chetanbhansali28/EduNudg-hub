import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  FormActions,
  FormGrid,
  Input,
  MutationError,
  OpsSectionCard,
  SaveButton,
  Select,
  Textarea,
} from "@edunudg/ui";
import { levelStatusLabel } from "@/features/learn/studentFormatters";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { listStudentAssessments, recordStudentAssessment } from "@/lib/centerAssessmentsApi";
import {
  latestAssessmentForLevel,
  programLevelsForAssessment,
} from "@/lib/centerAssessmentsHelpers";
import { fetchCenterStudentProgramContext } from "@/lib/centerStudentProgramApi";
import type { CenterStudentRow } from "@/lib/centerStudentsApi";
import { initialsFromName } from "@/lib/welcomeMessage";

type Props = {
  student: CenterStudentRow;
  centerId: string;
  onSaved?: () => void;
  /** When true, omits hero header (used inside Students detail). */
  embedded?: boolean;
};

function formatJoined(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(iso));
}

function levelBadgeTone(
  status: string,
  isCurrent: boolean
): "success" | "warning" | "default" {
  if (status === "failed") return "warning";
  if (isCurrent) return "default";
  if (status === "completed" || status === "passed") return "success";
  if (status === "in_progress") return "warning";
  return "default";
}

const ICON_GRAD = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5" />
  </svg>
);

const ICON_EDIT = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export function CenterStudentAssessmentPanel({ student, centerId, onSaved, embedded = false }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [passed, setPassed] = useState("");
  const [notes, setNotes] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const programContext = useQuery({
    queryKey: ["center-student-program", centerId, student.id],
    queryFn: () => fetchCenterStudentProgramContext(centerId, student.id),
  });

  const assessments = useQuery({
    queryKey: ["center-assessments", centerId, student.id],
    enabled: !!centerId && !!student.id,
    queryFn: () => listStudentAssessments(centerId, student.id),
  });

  const ctx = programContext.data;
  const currentLevelId = ctx?.current_level_id ?? null;
  const programLevels = useMemo(
    () => (ctx?.program_id ? programLevelsForAssessment(ctx) : []),
    [ctx]
  );

  const populateFromLevel = (levelId: string, rows: Awaited<ReturnType<typeof listStudentAssessments>>) => {
    const existing = latestAssessmentForLevel(rows, levelId);
    if (!existing) {
      setScore("");
      setMaxScore("");
      setPassed("");
      setNotes("");
      return;
    }
    setScore(existing.score != null ? String(existing.score) : "");
    setMaxScore(existing.max_score != null ? String(existing.max_score) : "");
    setPassed(existing.passed === true ? "pass" : existing.passed === false ? "fail" : "");
    setNotes(existing.notes ?? "");
  };

  useEffect(() => {
    setSelectedLevelId("");
    setScore("");
    setMaxScore("");
    setPassed("");
    setNotes("");
    setSaveMessage(null);
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when switching students
  }, [student.id]);

  useEffect(() => {
    if (programLevels.length === 0) {
      setSelectedLevelId("");
      return;
    }
    setSelectedLevelId((current) => {
      const next =
        current && programLevels.some((level) => level.level_id === current)
          ? current
          : programLevels[0]!.level_id;
      if (assessments.data) {
        populateFromLevel(next, assessments.data);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- level list drives default selection
  }, [programLevels, assessments.data]);

  const handleLevelChange = (levelId: string) => {
    setSelectedLevelId(levelId);
    if (levelId && assessments.data) {
      populateFromLevel(levelId, assessments.data);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!ctx?.program_id) {
        throw new Error("Assign a course / program before recording assessments.");
      }
      if (!selectedLevelId) {
        throw new Error("Select a course / program level to assess.");
      }
      if (passed !== "pass" && passed !== "fail") {
        throw new Error("Select Pass or Fail");
      }
      const selectedLevel = ctx.levels.find((level) => level.level_id === selectedLevelId);
      clear();
      await recordStudentAssessment(centerId, {
        studentId: student.id,
        assessmentType: selectedLevel?.name ?? "level_check",
        score: score ? parseFloat(score) : undefined,
        maxScore: maxScore ? parseFloat(maxScore) : undefined,
        notes,
        levelId: selectedLevelId,
        passed: passed === "pass",
      });
    },
    onSuccess: () => {
      setSaveMessage("Assessment saved.");
      void qc.invalidateQueries({ queryKey: ["center-assessments", centerId, student.id] });
      void qc.invalidateQueries({ queryKey: ["center-student-program", centerId, student.id] });
      void qc.invalidateQueries({ queryKey: ["center-students", centerId] });
      onSaved?.();
    },
    onError: capture,
  });

  const selectedLevelLabel =
    programLevels.find((level) => level.level_id === selectedLevelId)?.label ?? null;

  return (
    <div className={embedded ? "ed-ops-assessment-embedded" : "ed-ops-detail-enter"}>
      <MutationError message={error} />
      {saveMessage ? (
        <p className="ed-text-sm ed-success" role="status" aria-live="polite">
          {saveMessage}
        </p>
      ) : null}

      {!embedded ? (
        <header className="ed-ops-detail-hero">
          <div className="ed-ops-detail-hero__main">
            <span className="ed-ops-detail-hero__avatar" aria-hidden>
              {initialsFromName(student.full_name)}
            </span>
            <div>
              <h2 className="ed-ops-detail-hero__name">{student.full_name}</h2>
              <p className="ed-ops-detail-hero__status">
                <span className="ed-ops-detail-hero__status-dot" aria-hidden />
                {ctx?.program_name ? `On ${ctx.program_name}` : "No program assigned"}
              </p>
              <p className="ed-ops-detail-hero__meta">
                ID: {student.student_code ?? student.id.slice(0, 8).toUpperCase()} · Joined:{" "}
                {formatJoined(student.enrollment_created_at)}
              </p>
            </div>
          </div>
        </header>
      ) : null}

      <OpsSectionCard
        icon={ICON_GRAD}
        title="Level progress"
        description="Current enrollment, starting level, and level-by-level progress."
        footer={
          ctx?.program_id
            ? `Starting: ${ctx.starting_level_name ?? "—"} · Current: ${ctx.current_level_name ?? "All levels complete"}`
            : embedded
              ? "Assign a program on the Enrollment tab to enable assessments."
              : "Assign a program on the Students page to enable assessments."
        }
      >
        {programContext.isLoading ? (
          <p className="ed-text-sm ed-muted">Loading program context…</p>
        ) : ctx?.program_id ? (
          <ul className="ed-ops-level-list">
            {(ctx.levels ?? []).map((level) => {
              const isCurrent = level.level_id === currentLevelId;
              return (
                <li key={level.level_id} className="ed-ops-batch-row">
                  <div>
                    <p className="ed-ops-batch-row__name">
                      {level.name}
                      {level.abacus_level_code ? ` (${level.abacus_level_code})` : ""}
                      {isCurrent ? " · current" : ""}
                    </p>
                    <p className="ed-ops-batch-row__meta">Level {level.sort_order}</p>
                  </div>
                  <Badge tone={levelBadgeTone(level.status, isCurrent)}>
                    {isCurrent ? "Current" : levelStatusLabel(level.status)}
                  </Badge>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="ed-text-sm ed-muted">No course assigned yet.</p>
        )}
      </OpsSectionCard>

      <OpsSectionCard
        icon={ICON_EDIT}
        title="Record assessment"
        description="Choose a course level, enter scores, and mark pass or fail. Previously recorded levels pre-fill their last result."
      >
        {!programContext.isLoading && !ctx?.program_id ? (
          <p className="ed-text-sm ed-muted">
            {embedded ? "Assign a program on the Enrollment tab before recording." : "Assign a course on the Students page before recording."}
          </p>
        ) : null}

        {programLevels.length === 0 && ctx?.program_id ? (
          <p className="ed-text-sm ed-muted">No levels published for this course yet.</p>
        ) : null}

        {selectedLevelLabel ? (
          <div className="ed-ops-linked-banner" style={{ marginBottom: "0.75rem" }}>
            <strong>Recording for:</strong> {selectedLevelLabel}
          </div>
        ) : null}

        <FormGrid columns={2}>
          <Select
            label="Type"
            value={selectedLevelId}
            onChange={handleLevelChange}
            options={[
              { value: "", label: programLevels.length ? "Select level…" : "No levels available" },
              ...programLevels.map((level) => ({ value: level.level_id, label: level.label })),
            ]}
            editable
          />
          <Select
            label="Result"
            value={passed}
            onChange={setPassed}
            options={[
              { value: "", label: "Pass or fail…" },
              { value: "pass", label: "Pass — advance to next level" },
              { value: "fail", label: "Fail — stay on current level" },
            ]}
            editable
          />
          <Input
            label="Score"
            value={score}
            onChange={setScore}
            type="number"
            step="any"
            editable
          />
          <Input
            label="Max score"
            value={maxScore}
            onChange={setMaxScore}
            type="number"
            step="any"
            editable
          />
        </FormGrid>
        <Textarea label="Notes" value={notes} onChange={setNotes} rows={2} editable />
        <FormActions>
          <SaveButton
            onClick={() => save.mutate()}
            pending={save.isPending}
            label="Save assessment"
            disabled={!selectedLevelId || !passed}
          />
        </FormActions>
      </OpsSectionCard>
    </div>
  );
}
