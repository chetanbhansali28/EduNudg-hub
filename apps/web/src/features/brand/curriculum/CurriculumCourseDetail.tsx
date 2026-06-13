import {
  Badge,
  Button,
  Card,
  DraftPublishedToggle,
  FormActions,
  PipelineDetailPlaceholder,
  SaveButton,
} from "@edunudg/ui";
import type { CurriculumProgram, ProgramMarketingInput } from "@/lib/curriculumApi";
import {
  getPublishLabel,
  publishLabelText,
  type CurriculumVersion,
} from "@/lib/curriculumHelpers";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { CourseFields } from "@/features/brand/curriculum/curriculumForms";
import { CurriculumLevelPanel } from "@/features/brand/curriculum/CurriculumLevelPanel";
import type { LevelForm } from "@/features/brand/curriculum/curriculumForms";
import type { CurriculumLevel, CourseImpactStats } from "@/lib/curriculumApi";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";

type Props = {
  brandId: string;
  course: CurriculumProgram;
  workingVersion: CurriculumVersion | null;
  publishedVersion: CurriculumVersion | null;
  impact?: CourseImpactStats;
  levels: CurriculumLevel[];
  unitCounts: Record<string, number>;
  canEditStructure: boolean;
  isLiveOnly: boolean;
  editingCourse: boolean;
  editCourse: ProgramMarketingInput;
  onEditCourseChange: (v: ProgramMarketingInput) => void;
  onStartEditCourse: () => void;
  onCancelEditCourse: () => void;
  onSaveCourse: () => void;
  saveCoursePending: boolean;
  onArchiveCourse: () => void;
  archiveBlockedReason?: string | null;
  onPublish: () => void;
  onUnpublish: () => void;
  publishPending: boolean;
  onCreateDraft: () => void;
  createDraftPending: boolean;
  selectedLevelId: string | null;
  onSelectLevel: (id: string) => void;
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
  publishMessage: string | null;
};

export function CurriculumCourseDetail({
  brandId,
  course,
  workingVersion,
  publishedVersion,
  impact,
  levels,
  unitCounts,
  canEditStructure,
  isLiveOnly,
  editingCourse,
  editCourse,
  onEditCourseChange,
  onStartEditCourse,
  onCancelEditCourse,
  onSaveCourse,
  saveCoursePending,
  onArchiveCourse,
  archiveBlockedReason,
  onPublish,
  onUnpublish,
  publishPending,
  onCreateDraft,
  createDraftPending,
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
  publishMessage,
}: Props) {
  const publishLabel = getPublishLabel(workingVersion, publishedVersion);
  const toggleValue = workingVersion?.status === "published" ? "published" : "draft";

  return (
    <div className="ed-ops-detail-enter">
      <Card title={course.name}>
        <div className="ed-curriculum-program-summary">
          <div>
            <Badge tone={publishLabel === "live" ? "success" : publishLabel === "draft_with_live" ? "warning" : "default"}>
              {publishLabelText(publishLabel)}
            </Badge>
            {course.age_label && (
              <span className="ed-text-sm ed-muted" style={{ marginLeft: "0.5rem" }}>
                {course.age_label}
              </span>
            )}
            {workingVersion && (
              <span className="ed-text-sm ed-muted" style={{ marginLeft: "0.5rem" }}>
                v{workingVersion.version_number}
              </span>
            )}
          </div>
          {!editingCourse && (
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

        {workingVersion && (
          <div className="ed-curriculum-toolbar" style={{ marginTop: "1rem" }}>
            <DraftPublishedToggle
              value={toggleValue}
              onChange={(v) => {
                if (v === "published") onPublish();
                else onUnpublish();
              }}
              disabled={publishPending || (toggleValue === "draft" && levels.length === 0)}
              aria-label="Publication status"
            />
            {toggleValue === "draft" && levels.length === 0 && (
              <p className="ed-text-sm ed-muted">Add at least one level before publishing.</p>
            )}
          </div>
        )}

        {publishMessage && (
          <p className="ed-text-sm" role="status" aria-live="polite">
            {publishMessage}
          </p>
        )}

        {isLiveOnly && (
          <div className="ed-curriculum-live-banner" role="status">
            <p className="ed-text-sm">
              You are viewing the <strong>live</strong> version. Create a draft to edit levels and units without
              affecting centers and students immediately.
            </p>
            <Button onClick={onCreateDraft} disabled={createDraftPending}>
              {createDraftPending ? "Creating draft…" : "Create draft to edit"}
            </Button>
          </div>
        )}
      </Card>

      {workingVersion ? (
        <CurriculumLevelPanel
          brandId={brandId}
          levels={levels}
          unitCounts={unitCounts}
          canEdit={canEditStructure}
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
      ) : (
        <Card title="Levels">
          <PipelineDetailPlaceholder message="No curriculum version found for this course." />
        </Card>
      )}
    </div>
  );
}

export function CurriculumCourseDetailPlaceholder() {
  return (
    <Card title="Course detail">
      <PipelineDetailPlaceholder message="Select a course to manage levels, units, and publish settings." />
    </Card>
  );
}
