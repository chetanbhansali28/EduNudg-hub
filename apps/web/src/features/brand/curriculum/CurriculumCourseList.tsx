import {
  CourseListItem,
  CurriculumBuilderHeader,
  CurriculumFilterTabs,
  CurriculumMobileCourseCard,
  CurriculumSearchField,
  CurriculumSidebarCard,
  CurriculumTipCard,
} from "@edunudg/ui";
import type { CurriculumLevel, CurriculumProgram } from "@/lib/curriculumApi";
import {
  courseAvatarTone,
  courseExcerpt,
  courseInitials,
  courseMetaLine,
  courseStatus,
  curriculumTabCounts,
  filterCoursesByTab,
  type CurriculumTabFilter,
} from "@/features/brand/curriculum/curriculumBrandHelpers";

type Props = {
  brandId: string;
  courses: CurriculumProgram[];
  allCourses: CurriculumProgram[];
  levelsByProgram: Record<string, CurriculumLevel[]>;
  levelCounts: Record<string, number>;
  selectedId: string | null;
  mobileTab: CurriculumTabFilter;
  onMobileTabChange: (tab: CurriculumTabFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onOpenCourse: (id: string) => void;
  onEditProgram: (courseId: string, programId: string) => void;
  onAddProgram: (courseId: string) => void;
  onOpenAddCourse?: () => void;
  readOnly?: boolean;
  isMobile: boolean;
};

export function CurriculumCourseList({
  brandId,
  courses,
  allCourses,
  levelsByProgram,
  levelCounts,
  selectedId,
  mobileTab,
  onMobileTabChange,
  search,
  onSearchChange,
  onSelect,
  onOpenCourse,
  onEditProgram,
  onAddProgram,
  onOpenAddCourse,
  readOnly = false,
  isMobile,
}: Props) {
  const counts = curriculumTabCounts(allCourses);
  const tabOptions = [
    { value: "active" as const, label: "Active", count: counts.active },
    { value: "drafts" as const, label: "Drafts", count: counts.drafts },
    { value: "archived" as const, label: "Archived", count: counts.archived },
  ];

  if (isMobile) {
    const mobileCourses = filterCoursesByTab(courses, mobileTab);

    return (
      <div className="ed-curriculum-brand__mobile-list">
        <CurriculumBuilderHeader
          eyebrow="Build & Manage"
          title="Your Curriculum"
          subtitle="Structure courses, programs, and chapters for your franchise network."
        />
        <CurriculumSearchField value={search} onChange={onSearchChange} />
        <CurriculumFilterTabs options={tabOptions} value={mobileTab} onChange={onMobileTabChange} />

        {mobileCourses.length === 0 ? (
          <p className="ed-text-sm ed-muted">No courses in this tab yet.</p>
        ) : (
          mobileCourses.map((course, index) => {
            const status = courseStatus(course);
            const programs = (levelsByProgram[course.id] ?? []).map((level) => ({
              id: level.id,
              title: level.name,
              code: level.abacus_level_code ?? undefined,
            }));

            return (
              <CurriculumMobileCourseCard
                key={course.id}
                initials={courseInitials(course.name)}
                tone={courseAvatarTone(index)}
                title={course.name}
                meta={courseMetaLine(course, levelCounts[course.id] ?? 0)}
                excerpt={courseExcerpt(course.description)}
                status={status}
                programs={programs}
                readOnly={readOnly}
                onContinueSetup={() => onOpenCourse(course.id)}
                onAddProgram={() => onAddProgram(course.id)}
                onEditProgram={(programId) => onEditProgram(course.id, programId)}
              />
            );
          })
        )}

        <CurriculumTipCard body="Ensure each Program has at least 3 chapters for better student engagement analytics." />
      </div>
    );
  }

  const activeCourses = allCourses.filter((course) => course.is_active && courses.some((item) => item.id === course.id));

  return (
    <CurriculumSidebarCard
      title={`Active Courses (${activeCourses.length})`}
      actions={
        !readOnly ? (
          <button
            type="button"
            className="ed-curriculum-brand__add-btn"
            onClick={() => onOpenAddCourse?.()}
            aria-label="Add course"
          >
            +
          </button>
        ) : null
      }
    >
      {activeCourses.length === 0 ? (
        <p className="ed-text-sm ed-muted">No active courses yet — create your first course.</p>
      ) : (
        activeCourses.map((course, index) => (
          <CourseListItem
            key={course.id}
            initials={courseInitials(course.name)}
            tone={courseAvatarTone(index)}
            title={course.name}
            meta={courseMetaLine(course, levelCounts[course.id] ?? 0)}
            excerpt={courseExcerpt(course.description)}
            selected={course.id === selectedId}
            status={courseStatus(course)}
            onSelect={() => onSelect(course.id)}
          />
        ))
      )}
    </CurriculumSidebarCard>
  );
}
