import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CurriculumProgramOutlineRow,
  CurriculumSectionCard,
  FormActions,
  OpsSectionCard,
  SaveButton,
} from "@edunudg/ui";
import type { CurriculumLevel } from "@/lib/curriculumApi";
import { topicsToString } from "@/lib/curriculumHelpers";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { DeleteConfirmButton } from "@/features/shared/DeleteConfirmButton";
import {
  LevelMarketingFields,
  type LevelForm,
} from "@/features/brand/curriculum/curriculumForms";
import { CurriculumUnitsPanel } from "@/features/brand/curriculum/CurriculumUnitsPanel";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";

type Props = {
  brandId: string;
  levels: CurriculumLevel[];
  unitCounts: Record<string, number>;
  canEdit: boolean;
  selectedLevelId: string | null;
  onSelectLevel: (id: string | null) => void;
  addLevel: LevelForm;
  onAddLevelChange: (v: LevelForm) => void;
  editLevel: LevelForm;
  onEditLevelChange: (v: LevelForm) => void;
  onCreateLevel: () => void;
  createPending: boolean;
  onUpdateLevel: (id: string) => void;
  updatePending: boolean;
  onDeleteLevel: (id: string) => void;
  onReorderLevels: (ordered: CurriculumLevel[]) => void;
  reorderPending: boolean;
  onError: (err: unknown) => void;
  levelCloser: ReturnType<typeof useAddFormCloser>;
  requestAddProgram?: boolean;
  layout?: "ops" | "card" | "builder";
};

function levelToForm(level: CurriculumLevel): LevelForm {
  return {
    name: level.name,
    code: level.abacus_level_code ?? "",
    topics: topicsToString(level.topics_covered),
    whyTake: level.why_take ?? "",
    whatYouLearn: level.what_you_learn ?? "",
    videoUrl: level.marketing_video_url ?? "",
  };
}

function ProgramReadOnlySummary({ level }: { level: CurriculumLevel }) {
  const topics = topicsToString(level.topics_covered);
  return (
    <dl className="ed-curriculum-preview-fields">
      {level.abacus_level_code ? (
        <>
          <dt>Program code</dt>
          <dd>{level.abacus_level_code}</dd>
        </>
      ) : null}
      {topics ? (
        <>
          <dt>Topics covered</dt>
          <dd>{topics}</dd>
        </>
      ) : null}
      {level.why_take ? (
        <>
          <dt>Why this program</dt>
          <dd>{level.why_take}</dd>
        </>
      ) : null}
      {level.what_you_learn ? (
        <>
          <dt>Skills and outcomes</dt>
          <dd>{level.what_you_learn}</dd>
        </>
      ) : null}
    </dl>
  );
}

export function CurriculumLevelPanel({
  brandId,
  levels,
  unitCounts,
  canEdit,
  selectedLevelId,
  onSelectLevel,
  addLevel,
  onAddLevelChange,
  editLevel,
  onEditLevelChange,
  onCreateLevel,
  createPending,
  onUpdateLevel,
  updatePending,
  onDeleteLevel,
  onReorderLevels,
  reorderPending,
  onError,
  levelCloser,
  requestAddProgram = false,
  layout = "ops",
}: Props) {
  const [addProgramOpen, setAddProgramOpen] = useState(false);

  useEffect(() => {
    if (requestAddProgram) setAddProgramOpen(true);
  }, [requestAddProgram]);

  const shift = (index: number, direction: -1 | 1) => {
    const next = [...levels];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onReorderLevels(next);
  };

  const toggleLevel = (level: CurriculumLevel) => {
    if (selectedLevelId === level.id) {
      onSelectLevel(null);
      return;
    }
    onSelectLevel(level.id);
    onEditLevelChange(levelToForm(level));
  };

  const panelBody = (
    <>
      {layout !== "builder" ? (
        <p className="ed-text-sm ed-muted">
          Structure: <strong>Course → Program → Chapter</strong> — e.g. Abacus course, Level 1 program,
          &quot;Numbers 1–100 on abacus&quot; chapter.
        </p>
      ) : null}

      {!canEdit && (
        <p className="ed-curriculum-live-banner" role="status">
          Editing is disabled.
        </p>
      )}

      {canEdit && (
        <AddFormSection
          buttonLabel="Add program"
          panelTitle="Add program"
          actionsPlacement="footer"
          open={layout === "builder" ? addProgramOpen : undefined}
          onOpenChange={layout === "builder" ? setAddProgramOpen : undefined}
          hideTrigger={layout === "builder"}
          primaryAction={{
            label: "Add program",
            onClick: onCreateLevel,
            pending: createPending,
            disabled: !addLevel.name.trim(),
          }}
        >
          {({ close }) => {
            levelCloser.bindClose(close);
            return <LevelMarketingFields value={addLevel} onChange={onAddLevelChange} />;
          }}
        </AddFormSection>
      )}

      <div className={`ed-curriculum-level-accordion${layout === "ops" ? " ed-ops-stagger" : layout === "builder" ? "" : " ed-curriculum-stagger"}`}>
        {levels.map((level, index) => {
          const isOpen = level.id === selectedLevelId;
          const chapterCount = unitCounts[level.id] ?? 0;
          const panelId = `curriculum-program-panel-${level.id}`;
          const isActiveForm = isOpen && selectedLevelId === level.id;

          if (layout === "builder" && !isOpen) {
            return (
              <CurriculumProgramOutlineRow
                key={level.id}
                title={level.name}
                subtitle={
                  level.abacus_level_code
                    ? `${level.abacus_level_code} · ${chapterCount} chapter${chapterCount === 1 ? "" : "s"}`
                    : `${chapterCount} chapter${chapterCount === 1 ? "" : "s"}`
                }
                selected={isOpen}
                onSelect={() => toggleLevel(level)}
              />
            );
          }

          return (
            <div
              key={level.id}
              className={`ed-curriculum-level-accordion__item${isOpen ? " ed-curriculum-level-accordion__item--open" : ""}`}
            >
              <div className="ed-curriculum-level-accordion__header">
                <button
                  type="button"
                  className="ed-curriculum-level-accordion__trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleLevel(level)}
                >
                  <span className="ed-curriculum-level-accordion__trigger-title">{level.name}</span>
                  {level.abacus_level_code ? <Badge>{level.abacus_level_code}</Badge> : null}
                  <span className="ed-curriculum-level-accordion__meta">
                    {chapterCount} chapter{chapterCount === 1 ? "" : "s"}
                  </span>
                  <span className="ed-curriculum-level-accordion__chevron" aria-hidden>
                    ▾
                  </span>
                </button>

                {canEdit && (
                  <div className="ed-curriculum-level-accordion__actions">
                    <Button
                      variant="ghost"
                      aria-label={`Move ${level.name} up`}
                      disabled={index === 0 || reorderPending}
                      onClick={() => shift(index, -1)}
                    >
                      Move up
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label={`Move ${level.name} down`}
                      disabled={index === levels.length - 1 || reorderPending}
                      onClick={() => shift(index, 1)}
                    >
                      Move down
                    </Button>
                    <DeleteConfirmButton
                      onConfirm={() => onDeleteLevel(level.id)}
                      description="Removes the program and all chapters. Blocked if students or batches use this program."
                    >
                      Delete
                    </DeleteConfirmButton>
                  </div>
                )}
              </div>

              {isOpen && (
                <div id={panelId} className="ed-curriculum-level-accordion__body ed-ops-animate-in">
                  {canEdit && isActiveForm ? (
                    <div className="ed-editable-form">
                      <LevelMarketingFields value={editLevel} onChange={onEditLevelChange} />
                      <FormActions>
                        <SaveButton
                          onClick={() => onUpdateLevel(level.id)}
                          pending={updatePending}
                          disabled={!editLevel.name.trim()}
                          label="Save program"
                        />
                      </FormActions>
                    </div>
                  ) : (
                    <ProgramReadOnlySummary level={level} />
                  )}

                  <CurriculumUnitsPanel
                    brandId={brandId}
                    levelId={level.id}
                    canEdit={canEdit}
                    onError={onError}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {levels.length === 0 && (
        <p className="ed-text-sm ed-muted">
          No programs yet — add your first program (e.g. Level 1 · L1).
        </p>
      )}
    </>
  );

  if (layout === "card") {
    return <Card title="Programs">{panelBody}</Card>;
  }

  if (layout === "builder") {
    return (
      <CurriculumSectionCard
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
          </svg>
        }
        title="Programs Structure"
        actions={
          canEdit ? (
            <Button variant="secondary" onClick={() => setAddProgramOpen(true)}>
              + Add Program
            </Button>
          ) : null
        }
      >
        {panelBody}
      </CurriculumSectionCard>
    );
  }

  return (
    <OpsSectionCard
      icon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
          <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
        </svg>
      }
      title="Programs"
      description="Levels within this course and their chapters."
    >
      {panelBody}
    </OpsSectionCard>
  );
}
