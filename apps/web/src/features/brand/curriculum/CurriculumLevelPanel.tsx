import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  FormActions,
  PipelineListItem,
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
  onSelectLevel: (id: string) => void;
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
}: Props) {
  const [editingLevel, setEditingLevel] = useState(false);
  const selected = levels.find((l) => l.id === selectedLevelId) ?? null;

  const shift = (index: number, direction: -1 | 1) => {
    const next = [...levels];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onReorderLevels(next);
  };

  return (
    <Card title="Levels">
      <p className="ed-text-sm ed-muted">
        Each level has marketing copy, topics, and units shown on your public website and used in center batches.
      </p>

      {!canEdit && (
        <p className="ed-curriculum-live-banner" role="status">
          This version is live. Create a draft to edit levels and units.
        </p>
      )}

      {canEdit && (
        <AddFormSection
          buttonLabel="Add level"
          panelTitle="Add level"
          actionsPlacement="footer"
          primaryAction={{
            label: "Add level",
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

      <div className="ed-curriculum-stagger">
        {levels.map((level, index) => (
          <div key={level.id} className="ed-curriculum-level-row-wrap">
            <PipelineListItem
              title={level.name}
              meta={level.abacus_level_code ?? undefined}
              lines={[
                `${unitCounts[level.id] ?? 0} unit${(unitCounts[level.id] ?? 0) === 1 ? "" : "s"}`,
              ]}
              selected={level.id === selectedLevelId}
              onSelect={() => {
                onSelectLevel(level.id);
                onEditLevelChange(levelToForm(level));
                setEditingLevel(false);
              }}
            />
            {canEdit && (
              <FormActions>
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
              </FormActions>
            )}
          </div>
        ))}
      </div>

      {levels.length === 0 && (
        <p className="ed-text-sm ed-muted">No levels yet — add your first level (e.g. Level 1 · L1).</p>
      )}

      {selected && (
        <div className="ed-curriculum-level-nested ed-ops-animate-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 className="ed-curriculum-section-title">{selected.name}</h4>
            {selected.abacus_level_code && <Badge>{selected.abacus_level_code}</Badge>}
          </div>

          {canEdit && !editingLevel && (
            <FormActions>
              <Button variant="ghost" onClick={() => setEditingLevel(true)}>
                Edit level
              </Button>
              <DeleteConfirmButton
                onConfirm={() => onDeleteLevel(selected.id)}
                description="Removes the level and all units. Blocked if students or batches use this level."
              />
            </FormActions>
          )}

          {canEdit && editingLevel && (
            <div className="ed-editable-form">
              <LevelMarketingFields value={editLevel} onChange={onEditLevelChange} />
              <FormActions>
                <SaveButton
                  onClick={() => {
                    onUpdateLevel(selected.id);
                    setEditingLevel(false);
                  }}
                  pending={updatePending}
                  disabled={!editLevel.name.trim()}
                />
                <Button variant="ghost" onClick={() => setEditingLevel(false)}>
                  Cancel
                </Button>
              </FormActions>
            </div>
          )}

          <CurriculumUnitsPanel
            brandId={brandId}
            levelId={selected.id}
            canEdit={canEdit}
            onError={onError}
          />
        </div>
      )}
    </Card>
  );
}
