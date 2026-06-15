import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MutationError, OpsPageHeader, OpsSearchField, PipelineMasterDetail } from "@edunudg/ui";
import {
  archiveProgram,
  createLevel,
  createProgram,
  deleteLevelSafe,
  fetchCourseImpactStats,
  fetchLevelCountsByProgram,
  fetchLevelUnitCounts,
  fetchLevels,
  fetchPrograms,
  reorderLevels,
  updateLevel,
  updateProgram,
  type CurriculumLevel,
  type CurriculumProgram,
} from "@/lib/curriculumApi";
import { parseTopicsComma } from "@/lib/curriculumHelpers";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import { useOpsBreakpoint } from "@/features/center/hooks/useOpsBreakpoint";
import { CurriculumCourseList } from "@/features/brand/curriculum/CurriculumCourseList";
import {
  CurriculumCourseDetail,
  CurriculumCourseDetailPlaceholder,
} from "@/features/brand/curriculum/CurriculumCourseDetail";
import { CurriculumCourseFeaturedCard } from "@/features/brand/curriculum/CurriculumCourseFeaturedCard";
import {
  courseToForm,
  EMPTY_COURSE_FORM,
  EMPTY_LEVEL_FORM,
} from "@/features/brand/curriculum/curriculumForms";
import "@/features/brand/curriculum/curriculumBrand.css";
import "@/features/center/centerOps.css";

type CourseFilter = "active" | "all";

interface CurriculumWorkspaceProps {
  brandId: string;
  readOnly?: boolean;
}

function matchesCourseSearch(course: CurriculumProgram, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [course.name, course.description, course.age_label]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(q));
}

export function CurriculumWorkspace({ brandId, readOnly = false }: CurriculumWorkspaceProps) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const courseCloser = useAddFormCloser();
  const levelCloser = useAddFormCloser();
  const { isMobile } = useOpsBreakpoint();

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("active");
  const [search, setSearch] = useState("");
  const [editingCourse, setEditingCourse] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const [addCourse, setAddCourse] = useState(EMPTY_COURSE_FORM);
  const [editCourse, setEditCourse] = useState(EMPTY_COURSE_FORM);
  const [addLevel, setAddLevel] = useState(EMPTY_LEVEL_FORM);
  const [editLevel, setEditLevel] = useState(EMPTY_LEVEL_FORM);

  const courses = useQuery({
    queryKey: ["programs", brandId],
    queryFn: () => fetchPrograms(brandId),
  });

  const activeCourseId = useMemo(() => {
    const list = courses.data ?? [];
    if (selectedCourseId && list.some((c) => c.id === selectedCourseId)) {
      return selectedCourseId;
    }
    return list[0]?.id ?? "";
  }, [selectedCourseId, courses.data]);

  const filteredCourses = useMemo(() => {
    const list =
      courseFilter === "active"
        ? (courses.data ?? []).filter((course) => course.is_active)
        : (courses.data ?? []);
    return list.filter((course) => matchesCourseSearch(course, search));
  }, [courseFilter, courses.data, search]);

  useEffect(() => {
    if (activeCourseId || filteredCourses.length === 0) return;
    setSelectedCourseId(filteredCourses[0]!.id);
  }, [activeCourseId, filteredCourses]);

  const levels = useQuery({
    queryKey: ["levels", activeCourseId],
    enabled: !!activeCourseId,
    queryFn: () => fetchLevels(activeCourseId),
  });

  const levelCountsByProgram = useQuery({
    queryKey: ["level-counts-by-program", brandId, courses.data?.map((c) => c.id).join(",")],
    enabled: (courses.data?.length ?? 0) > 0,
    queryFn: () => fetchLevelCountsByProgram(brandId, (courses.data ?? []).map((c) => c.id)),
  });

  const unitCounts = useQuery({
    queryKey: ["level-unit-counts", activeCourseId, levels.data?.map((l) => l.id).join(",")],
    enabled: !!levels.data?.length,
    queryFn: () => fetchLevelUnitCounts((levels.data ?? []).map((l) => l.id)),
  });

  const impact = useQuery({
    queryKey: ["course-impact", activeCourseId],
    enabled: !!activeCourseId,
    queryFn: () => fetchCourseImpactStats(brandId, activeCourseId),
  });

  const selectedCourse =
    filteredCourses.find((course) => course.id === activeCourseId) ??
    (courses.data ?? []).find((course) => course.id === activeCourseId) ??
    null;

  useEffect(() => {
    setSelectedLevelId(null);
  }, [activeCourseId]);

  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: ["programs", brandId] });
    if (activeCourseId) {
      void qc.invalidateQueries({ queryKey: ["levels", activeCourseId] });
      void qc.invalidateQueries({ queryKey: ["level-counts-by-program", brandId] });
      void qc.invalidateQueries({ queryKey: ["course-impact", activeCourseId] });
    }
    void qc.invalidateQueries({ queryKey: ["level-unit-counts"] });
  };

  const createCourse = useMutation({
    mutationFn: () => createProgram(brandId, addCourse),
    onSuccess: (id) => {
      clear();
      invalidateAll();
      setAddCourse(EMPTY_COURSE_FORM);
      setSelectedCourseId(id);
      courseCloser.closeAddForm();
    },
    onError: capture,
  });

  const saveCourse = useMutation({
    mutationFn: () => updateProgram(activeCourseId, editCourse),
    onSuccess: () => {
      clear();
      invalidateAll();
      setEditingCourse(false);
    },
    onError: capture,
  });

  const archiveCourse = useMutation({
    mutationFn: () => archiveProgram(activeCourseId),
    onSuccess: () => {
      clear();
      invalidateAll();
      setSelectedCourseId("");
    },
    onError: capture,
  });

  const createLevelMutation = useMutation({
    mutationFn: async () => {
      const order = (levels.data?.length ?? 0) + 1;
      await createLevel(
        brandId,
        activeCourseId,
        {
          name: addLevel.name,
          code: addLevel.code,
          topics: parseTopicsComma(addLevel.topics),
          whyTake: addLevel.whyTake,
          whatYouLearn: addLevel.whatYouLearn,
          videoUrl: addLevel.videoUrl,
        },
        order,
      );
    },
    onSuccess: () => {
      clear();
      invalidateAll();
      setAddLevel(EMPTY_LEVEL_FORM);
      levelCloser.closeAddForm();
    },
    onError: capture,
  });

  const updateLevelMutation = useMutation({
    mutationFn: (id: string) =>
      updateLevel(id, {
        name: editLevel.name,
        code: editLevel.code,
        topics: parseTopicsComma(editLevel.topics),
        whyTake: editLevel.whyTake,
        whatYouLearn: editLevel.whatYouLearn,
        videoUrl: editLevel.videoUrl,
      }),
    onSuccess: invalidateAll,
    onError: capture,
  });

  const deleteLevelMutation = useMutation({
    mutationFn: deleteLevelSafe,
    onSuccess: () => {
      clear();
      invalidateAll();
      setSelectedLevelId(null);
    },
    onError: capture,
  });

  const reorderLevelMutation = useMutation({
    mutationFn: (ordered: CurriculumLevel[]) => reorderLevels(ordered.map((l) => l.id)),
    onSuccess: invalidateAll,
    onError: capture,
  });

  const archiveBlockedReason =
    impact.data && impact.data.authorizedCenters > 0
      ? `Cannot archive while ${impact.data.authorizedCenters} center(s) are authorized for this course. Remove authorization on Centers first.`
      : null;

  const selectCourse = (id: string) => {
    setSelectedCourseId(id);
    if (isMobile) setMobileDetailOpen(false);
  };

  const detailPanel = selectedCourse ? (
    <CurriculumCourseDetail
      brandId={brandId}
      course={selectedCourse}
      impact={impact.data}
      levels={levels.data ?? []}
      unitCounts={unitCounts.data ?? {}}
      editingCourse={editingCourse}
      editCourse={editCourse}
      onEditCourseChange={setEditCourse}
      onStartEditCourse={() => {
        setEditCourse(courseToForm(selectedCourse));
        setEditingCourse(true);
      }}
      onCancelEditCourse={() => setEditingCourse(false)}
      onSaveCourse={() => saveCourse.mutate()}
      saveCoursePending={saveCourse.isPending}
      onArchiveCourse={() => archiveCourse.mutate()}
      archiveBlockedReason={archiveBlockedReason}
      selectedLevelId={selectedLevelId}
      onSelectLevel={(id) => setSelectedLevelId(id)}
      addLevel={addLevel}
      onAddLevelChange={setAddLevel}
      editLevel={editLevel}
      onEditLevelChange={setEditLevel}
      onCreateLevel={() => createLevelMutation.mutate()}
      createLevelPending={createLevelMutation.isPending}
      onUpdateLevel={(id) => updateLevelMutation.mutate(id)}
      updateLevelPending={updateLevelMutation.isPending}
      onDeleteLevel={(id) => deleteLevelMutation.mutate(id)}
      onReorderLevels={(ordered) => reorderLevelMutation.mutate(ordered)}
      reorderPending={reorderLevelMutation.isPending}
      onError={capture}
      levelCloser={levelCloser}
      readOnly={readOnly}
    />
  ) : (
    <CurriculumCourseDetailPlaceholder />
  );

  const listPanel = (
    <CurriculumCourseList
      brandId={brandId}
      courses={filteredCourses}
      levelCounts={levelCountsByProgram.data ?? {}}
      selectedId={activeCourseId || null}
      filter={courseFilter}
      onFilterChange={setCourseFilter}
      onSelect={selectCourse}
      addCourse={addCourse}
      onAddCourseChange={setAddCourse}
      onAddCourse={() => createCourse.mutate()}
      addPending={createCourse.isPending}
      bindAddClose={courseCloser.bindClose}
      readOnly={readOnly}
    />
  );

  return (
    <div className={`ed-curriculum-brand${isMobile ? " ed-ops-pipeline-hide-detail" : ""}`}>
      <OpsPageHeader
        title="Curriculum"
        subtitle={
          readOnly
            ? "Read-only view: Course → Program → Chapter. See what your center teaches."
            : "Build your curriculum: Course → Program → Chapter. Centers and parents see this on your website."
        }
      />
      <MutationError message={error} />

      <OpsSearchField
        value={search}
        onChange={setSearch}
        placeholder="Search courses by name or age band…"
      />

      {isMobile ? (
        <>
          {listPanel}
          {selectedCourse ? (
            <CurriculumCourseFeaturedCard
              course={selectedCourse}
              programCount={levelCountsByProgram.data?.[selectedCourse.id] ?? 0}
              onViewDetails={() => setMobileDetailOpen(true)}
            />
          ) : null}
        </>
      ) : (
        <PipelineMasterDetail list={listPanel} detail={detailPanel} />
      )}

      {isMobile && mobileDetailOpen && selectedCourse ? (
        <div className="ed-ops-mobile-detail" role="dialog" aria-modal aria-label="Course details">
          <div className="ed-ops-mobile-detail__bar">
            <button type="button" className="ed-ops-mobile-detail__back" onClick={() => setMobileDetailOpen(false)}>
              ← Back
            </button>
          </div>
          {detailPanel}
        </div>
      ) : null}
    </div>
  );
}
