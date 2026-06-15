import {
  Badge,
  Card,
  DataList,
  FilterTabs,
  OpsListHeader,
  PipelineEmptyState,
  PipelineListItem,
} from "@edunudg/ui";
import type { CurriculumProgram, ProgramMarketingInput } from "@/lib/curriculumApi";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { CourseFields } from "@/features/brand/curriculum/curriculumForms";

type CourseFilter = "active" | "all";

const FILTER_OPTIONS: { value: CourseFilter; label: string }[] = [
  { value: "active", label: "Active courses" },
  { value: "all", label: "All" },
];

type Props = {
  brandId: string;
  courses: CurriculumProgram[];
  levelCounts: Record<string, number>;
  selectedId: string | null;
  filter: CourseFilter;
  onFilterChange: (f: CourseFilter) => void;
  onSelect: (id: string) => void;
  addCourse: ProgramMarketingInput;
  onAddCourseChange: (v: ProgramMarketingInput) => void;
  onAddCourse: () => void;
  addPending: boolean;
  bindAddClose: (close: () => void) => void;
  readOnly?: boolean;
  layout?: "ops" | "card";
};

export function CurriculumCourseList({
  brandId,
  courses,
  levelCounts,
  selectedId,
  filter,
  onFilterChange,
  onSelect,
  addCourse,
  onAddCourseChange,
  onAddCourse,
  addPending,
  bindAddClose,
  readOnly = false,
  layout = "ops",
}: Props) {
  const filtered =
    filter === "active" ? courses.filter((c) => c.is_active) : courses;

  const filterTabs = FILTER_OPTIONS.map((o) => ({
    ...o,
    count: o.value === "active" ? courses.filter((c) => c.is_active).length : courses.length,
  }));

  const listBody = (
    <>
      <FilterTabs options={filterTabs} value={filter} onChange={onFilterChange} aria-label="Course filter" />
      {!readOnly && (
        <AddFormSection
          buttonLabel="Add course"
          panelTitle="Add course"
          actionsPlacement="footer"
          primaryAction={{
            label: "Create course",
            onClick: onAddCourse,
            pending: addPending,
            disabled: !addCourse.name.trim(),
          }}
        >
          {({ close }) => {
            bindAddClose(close);
            return (
              <CourseFields brandId={brandId} value={addCourse} onChange={onAddCourseChange} />
            );
          }}
        </AddFormSection>
      )}
      <div className={layout === "ops" ? "ed-ops-stagger" : "ed-curriculum-stagger"}>
        <DataList
          variant="pipeline"
          items={filtered}
          empty={
            <PipelineEmptyState message="No courses yet — create your first course (e.g. Abacus Core)." />
          }
          render={(course) => {
            const levelCount = levelCounts[course.id] ?? 0;
            return (
              <PipelineListItem
                title={course.name}
                meta={course.age_label ?? undefined}
                lines={[
                  levelCount > 0
                    ? `${levelCount} program${levelCount === 1 ? "" : "s"}`
                    : "No programs yet",
                  course.description?.slice(0, 60) ?? "Add marketing copy in course detail",
                ]}
                initials={course.name.slice(0, 2).toUpperCase()}
                selected={course.id === selectedId}
                onSelect={() => onSelect(course.id)}
                badges={
                  course.is_active ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>
                }
              />
            );
          }}
        />
      </div>
    </>
  );

  if (layout === "card") {
    return <Card title="Courses">{listBody}</Card>;
  }

  const activeCount = courses.filter((c) => c.is_active).length;

  return (
    <div className="ed-pipeline-list-panel">
      <OpsListHeader title="Courses" badge={`ACTIVE: ${activeCount}`} />
      {listBody}
    </div>
  );
}
