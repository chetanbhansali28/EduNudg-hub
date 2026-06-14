import {
  Badge,
  Button,
  Card,
  FormActions,
  PipelineDetailPlaceholder,
  SaveButton,
} from "@edunudg/ui";
import type { CurriculumProgram, ProgramMarketingInput } from "@/lib/curriculumApi";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { CourseFields } from "@/features/brand/curriculum/curriculumForms";
import { CurriculumLevelPanel } from "@/features/brand/curriculum/CurriculumLevelPanel";
import type { LevelForm } from "@/features/brand/curriculum/curriculumForms";
import type { CurriculumLevel, CourseImpactStats } from "@/lib/curriculumApi";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";

type Props = {
  brandId: string;
  course: CurriculumProgram;
  impact?: CourseImpactStats;
  levels: CurriculumLevel[];
  unitCounts: Record<string, number>;
  editingCourse: boolean;
  editCourse: ProgramMarketingInput;
  onEditCourseChange: (v: ProgramMarketingInput) => void;
  onStartEditCourse: () => void;
  onCancelEditCourse: () => void;
  onSaveCourse: () => void;
  saveCoursePending: boolean;
  onArchiveCourse: () => void;
  archiveBlockedReason?: string | null;
  selectedLevelId: string | null;
  onSelectLevel: (id: string | null) => void;
  addLevel: LevelForm;
  onAddLevelChange: (v: LevelForm) => void;
  editLevel: LevelForm;
  onEditLevelChange: (v: LevelForm) => void;
  onCreateLevel: () => void;
  createLevelPending: boolean;
  onUpdateLevel: (id: string) => void;
  updateLevelPending: boolean;
  onDeleteLevel: (id: string) => void;
  onReorderLevels: (ordered: CurriculumLevel[]) => void;
  reorderPending: boolean;
  onError: (err: unknown) => void;
  levelCloser: ReturnType<typeof useAddFormCloser>;
  readOnly?: boolean;
};

export function CurriculumCourseDetail({
  brandId,
  course,
  impact,
  levels,
  unitCounts,
  editingCourse,
  editCourse,
  onEditCourseChange,
  onStartEditCourse,
  onCancelEditCourse,
  onSaveCourse,
  saveCoursePending,
  onArchiveCourse,
  archiveBlockedReason,
  selectedLevelId,
  onSelectLevel,
  addLevel,
  onAddLevelChange,
  editLevel,
  onEditLevelChange,
  onCreateLevel,
  createLevelPending,
  onUpdateLevel,
  updateLevelPending,
  onDeleteLevel,
  onReorderLevels,
  reorderPending,
  onError,
  levelCloser,
  readOnly = false,
}: Props) {
  return (
    <div className="ed-ops-detail-enter">
      <Card title={course.name}>
        <div className="ed-curriculum-program-summary">
          <div>
            <Badge tone={course.is_active ? "success" : "default"}>
              {course.is_active ? "Active" : "Inactive"}
            </Badge>
            {course.age_label && (
              <span className="ed-text-sm ed-muted" style={{ marginLeft: "0.5rem" }}>
                {course.age_label}
              </span>
            )}
          </div>
          {!readOnly && !editingCourse && (
            <CrudRowActions
              editing={false}
              onEdit={onStartEditCourse}
              onSave={onSaveCourse}
              onCancel={onCancelEditCourse}
              onDelete={archiveBlockedReason ? undefined : onArchiveCourse}
              deleteTitle="Archive this course?"
              deleteDescription={
                archiveBlockedReason ??
                "The course will be archived and hidden from your website and center authorization."
              }
              saveDisabled
            />
          )}
        </div>

        {impact && (impact.authorizedCenters > 0 || impact.activeBatches > 0) && (
          <div className="ed-curriculum-impact-row">
            {impact.authorizedCenters > 0 && (
              <span className="ed-curriculum-impact-chip">
                {impact.authorizedCenters} center{impact.authorizedCenters === 1 ? "" : "s"} authorized
              </span>
            )}
            {impact.activeBatches > 0 && (
              <span className="ed-curriculum-impact-chip">
                {impact.activeBatches} active batch{impact.activeBatches === 1 ? "" : "es"}
              </span>
            )}
          </div>
        )}

        {archiveBlockedReason && (
          <p className="ed-text-sm ed-muted" role="status">
            {archiveBlockedReason}
          </p>
        )}

        {readOnly && (
          <p className="ed-curriculum-live-banner" role="status">
            Read-only — contact your brand admin to change curriculum.
          </p>
        )}

        {editingCourse ? (
          <div className="ed-editable-form">
            <CourseFields brandId={brandId} value={editCourse} onChange={onEditCourseChange} />
            <FormActions>
              <SaveButton
                onClick={onSaveCourse}
                pending={saveCoursePending}
                disabled={!editCourse.name.trim()}
              />
              <Button variant="ghost" onClick={onCancelEditCourse}>
                Cancel
              </Button>
            </FormActions>
          </div>
        ) : (
          course.description && <p className="ed-text-sm ed-muted">{course.description}</p>
        )}
      </Card>

      <CurriculumLevelPanel
        brandId={brandId}
        levels={levels}
        unitCounts={unitCounts}
        canEdit={!readOnly}
        selectedLevelId={selectedLevelId}
        onSelectLevel={onSelectLevel}
        addLevel={addLevel}
        onAddLevelChange={onAddLevelChange}
        editLevel={editLevel}
        onEditLevelChange={onEditLevelChange}
        onCreateLevel={onCreateLevel}
        createPending={createLevelPending}
        onUpdateLevel={onUpdateLevel}
        updatePending={updateLevelPending}
        onDeleteLevel={onDeleteLevel}
        onReorderLevels={onReorderLevels}
        reorderPending={reorderPending}
        onError={onError}
        levelCloser={levelCloser}
      />
    </div>
  );
}

export function CurriculumCourseDetailPlaceholder() {
  return (
    <Card title="Course detail">
      <PipelineDetailPlaceholder message="Select a course to manage programs and chapters." />
    </Card>
  );
}
