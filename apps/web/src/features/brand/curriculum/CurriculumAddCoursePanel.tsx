import { Button, CurriculumSectionCard, SaveButton } from "@edunudg/ui";
import type { ProgramMarketingInput } from "@/lib/curriculumApi";
import { CourseFields } from "@/features/brand/curriculum/curriculumForms";

type Props = {
  brandId: string;
  value: ProgramMarketingInput;
  onChange: (value: ProgramMarketingInput) => void;
  onCancel: () => void;
  onCreate: () => void;
  pending: boolean;
  isMobile: boolean;
};

export function CurriculumAddCoursePanel({
  brandId,
  value,
  onChange,
  onCancel,
  onCreate,
  pending,
  isMobile,
}: Props) {
  return (
    <div className={`ed-curriculum-add-course${isMobile ? " ed-curriculum-add-course--mobile" : ""}`}>
      <header className="ed-curriculum-add-course__head">
        {isMobile ? (
          <button type="button" className="ed-ops-mobile-detail__back" onClick={onCancel}>
            ← Back
          </button>
        ) : (
          <>
            <div>
              <h2 className="ed-curriculum-add-course__title">Add course</h2>
              <p className="ed-curriculum-add-course__subtitle">
                Create a new course for your franchise curriculum catalog.
              </p>
            </div>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </>
        )}
      </header>

      <CurriculumSectionCard title="Course details">
        <CourseFields brandId={brandId} value={value} onChange={onChange} />
        <div className="ed-curriculum-add-course__actions">
          <SaveButton
            onClick={onCreate}
            pending={pending}
            disabled={!value.name.trim()}
            label="Create course"
          />
          {!isMobile ? (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </CurriculumSectionCard>
    </div>
  );
}
