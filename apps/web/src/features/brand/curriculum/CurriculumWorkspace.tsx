import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CurriculumBuilderHeader, CurriculumFab, MutationError } from "@edunudg/ui";
import { CurriculumAddCoursePanel } from "@/features/brand/curriculum/CurriculumAddCoursePanel";
import {
  archiveProgram,
  createLevel,
  createProgram,
  deleteLevelSafe,
  fetchCourseImpactStats,
  fetchLevelCountsByProgram,
  fetchLevels,
  fetchLevelsForPrograms,
  fetchLevelUnitCounts,
  fetchPrograms,
  reorderLevels,
  updateLevel,
  updateProgram,
  type CurriculumLevel,
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
import {
  courseToForm,
  EMPTY_COURSE_FORM,
  EMPTY_LEVEL_FORM,
} from "@/features/brand/curriculum/curriculumForms";
import {
  filterCoursesByTab,
  matchesCurriculumSearch,
  type CurriculumTabFilter,
} from "@/features/brand/curriculum/curriculumBrandHelpers";
import "@/features/brand/curriculum/curriculumBrand.css";

interface CurriculumWorkspaceProps {
  brandId: string;
  readOnly?: boolean;
}

export function CurriculumWorkspace({ brandId, readOnly = false }: CurriculumWorkspaceProps) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const courseCloser = useAddFormCloser();
  const levelCloser = useAddFormCloser();
  const { isMobile } = useOpsBreakpoint();

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<CurriculumTabFilter>("active");
  const [search, setSearch] = useState("");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [requestAddProgram, setRequestAddProgram] = useState(false);

  const [addCourse, setAddCourse] = useState(EMPTY_COURSE_FORM);
  const [editCourse, setEditCourse] = useState(EMPTY_COURSE_FORM);
  const [addLevel, setAddLevel] = useState(EMPTY_LEVEL_FORM);
  const [editLevel, setEditLevel] = useState(EMPTY_LEVEL_FORM);

  const courses = useQuery({
    queryKey: ["programs", brandId],
    queryFn: () => fetchPrograms(brandId),
  });

  const allCourses = courses.data ?? [];

  const activeCourseId = useMemo(() => {
    if (addCourseOpen) return "";
    if (selectedCourseId && allCourses.some((course) => course.id === selectedCourseId)) {
      return selectedCourseId;
    }
    const firstActive = allCourses.find((course) => course.is_active);
    return firstActive?.id ?? allCourses[0]?.id ?? "";
  }, [addCourseOpen, selectedCourseId, allCourses]);

  const levelCountsByProgram = useQuery({
    queryKey: ["level-counts-by-program", brandId, allCourses.map((course) => course.id).join(",")],
    enabled: allCourses.length > 0,
    queryFn: () => fetchLevelCountsByProgram(brandId, allCourses.map((course) => course.id)),
  });

  const levelsByProgram = useQuery({
    queryKey: ["levels-by-program", brandId, allCourses.map((course) => course.id).join(",")],
    enabled: allCourses.length > 0,
    queryFn: () => fetchLevelsForPrograms(allCourses.map((course) => course.id)),
  });

  const levels = useQuery({
    queryKey: ["levels", activeCourseId],
    enabled: !!activeCourseId,
    queryFn: () => fetchLevels(activeCourseId),
  });

  const filteredCourses = useMemo(() => {
    const tabbed = isMobile ? filterCoursesByTab(allCourses, mobileTab) : allCourses.filter((course) => course.is_active);
    return tabbed.filter((course) => {
      const levelNames = (levelsByProgram.data?.[course.id] ?? []).map((level) => level.name);
      return matchesCurriculumSearch(course, levelNames, search);
    });
  }, [allCourses, isMobile, mobileTab, search, levelsByProgram.data]);

  useEffect(() => {
    if (activeCourseId || filteredCourses.length === 0) return;
    setSelectedCourseId(filteredCourses[0]!.id);
  }, [activeCourseId, filteredCourses]);

  const unitCounts = useQuery({
    queryKey: ["level-unit-counts", activeCourseId, levels.data?.map((level) => level.id).join(",")],
    enabled: !!levels.data?.length,
    queryFn: () => fetchLevelUnitCounts((levels.data ?? []).map((level) => level.id)),
  });

  const impact = useQuery({
    queryKey: ["course-impact", activeCourseId],
    enabled: !!activeCourseId,
    queryFn: () => fetchCourseImpactStats(brandId, activeCourseId),
  });

  const selectedCourse = allCourses.find((course) => course.id === activeCourseId) ?? null;
  const selectedCourseIndex = selectedCourse ? allCourses.findIndex((course) => course.id === selectedCourse.id) : 0;

  useEffect(() => {
    const course = allCourses.find((item) => item.id === activeCourseId);
    if (course) setEditCourse(courseToForm(course));
  }, [activeCourseId, courses.data]);

  useEffect(() => {
    setSelectedLevelId(null);
    setRequestAddProgram(false);
  }, [activeCourseId]);

  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: ["programs", brandId] });
    void qc.invalidateQueries({ queryKey: ["level-counts-by-program", brandId] });
    void qc.invalidateQueries({ queryKey: ["levels-by-program", brandId] });
    if (activeCourseId) {
      void qc.invalidateQueries({ queryKey: ["levels", activeCourseId] });
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
      setAddCourseOpen(false);
      courseCloser.closeAddForm();
    },
    onError: capture,
  });

  const saveCourse = useMutation({
    mutationFn: () => updateProgram(activeCourseId, editCourse),
    onSuccess: () => {
      clear();
      invalidateAll();
    },
    onError: capture,
  });

  const archiveCourse = useMutation({
    mutationFn: () => archiveProgram(activeCourseId),
    onSuccess: () => {
      clear();
      invalidateAll();
      setSelectedCourseId("");
      setMobileDetailOpen(false);
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
        order
      );
    },
    onSuccess: () => {
      clear();
      invalidateAll();
      setAddLevel(EMPTY_LEVEL_FORM);
      setRequestAddProgram(false);
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
    mutationFn: (ordered: CurriculumLevel[]) => reorderLevels(ordered.map((level) => level.id)),
    onSuccess: invalidateAll,
    onError: capture,
  });

  const archiveBlockedReason =
    impact.data && impact.data.authorizedCenters > 0
      ? `Cannot archive while ${impact.data.authorizedCenters} center(s) are authorized for this course. Remove authorization on Centers first.`
      : null;

  const openMobileCourse = (courseId: string, levelId?: string) => {
    setAddCourseOpen(false);
    setSelectedCourseId(courseId);
    setMobileDetailOpen(true);
    setSelectedLevelId(levelId ?? null);
  };

  const openAddCourse = () => {
    clear();
    setAddCourse(EMPTY_COURSE_FORM);
    setAddCourseOpen(true);
    setMobileDetailOpen(false);
  };

  const closeAddCourse = () => {
    setAddCourseOpen(false);
    setAddCourse(EMPTY_COURSE_FORM);
    courseCloser.closeAddForm();
  };

  const selectCourse = (id: string) => {
    setAddCourseOpen(false);
    setSelectedCourseId(id);
  };

  const detailPanel = selectedCourse ? (
    <CurriculumCourseDetail
      brandId={brandId}
      course={selectedCourse}
      courseIndex={Math.max(0, selectedCourseIndex)}
      impact={impact.data}
      levels={levels.data ?? []}
      unitCounts={unitCounts.data ?? {}}
      editCourse={editCourse}
      onEditCourseChange={setEditCourse}
      onSaveCourse={() => saveCourse.mutate()}
      saveCoursePending={saveCourse.isPending}
      onArchiveCourse={() => archiveCourse.mutate()}
      archiveBlockedReason={archiveBlockedReason}
      selectedLevelId={selectedLevelId}
      onSelectLevel={setSelectedLevelId}
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
      requestAddProgram={requestAddProgram}
      readOnly={readOnly}
      showPageHeader={isMobile}
    />
  ) : (
    <CurriculumCourseDetailPlaceholder />
  );

  const listPanel = (
    <CurriculumCourseList
      brandId={brandId}
      courses={filteredCourses}
      allCourses={allCourses}
      levelsByProgram={levelsByProgram.data ?? {}}
      levelCounts={levelCountsByProgram.data ?? {}}
      selectedId={activeCourseId || null}
      mobileTab={mobileTab}
      onMobileTabChange={setMobileTab}
      search={search}
      onSearchChange={setSearch}
      onSelect={selectCourse}
      onOpenCourse={(id) => openMobileCourse(id)}
      onEditProgram={(courseId, programId) => openMobileCourse(courseId, programId)}
      onAddProgram={(courseId) => {
        openMobileCourse(courseId);
        setRequestAddProgram(true);
      }}
      onOpenAddCourse={openAddCourse}
      readOnly={readOnly}
      isMobile={isMobile}
    />
  );

  const addCoursePanel = !readOnly ? (
    <CurriculumAddCoursePanel
      brandId={brandId}
      value={addCourse}
      onChange={setAddCourse}
      onCancel={closeAddCourse}
      onCreate={() => createCourse.mutate()}
      pending={createCourse.isPending}
      isMobile={isMobile}
    />
  ) : null;

  const mainDetailPanel = addCourseOpen && addCoursePanel ? addCoursePanel : detailPanel;

  return (
    <div className={`ed-curriculum-brand${isMobile ? " ed-curriculum-brand--mobile" : ""}`}>
      {!isMobile ? (
        <CurriculumBuilderHeader
          variant="page"
          title="Curriculum Builder"
          subtitle="Design and manage your franchise's educational blueprint. Changes here update across all authorized centers and student portals."
        />
      ) : null}

      <MutationError message={error} />

      {isMobile ? (
        listPanel
      ) : (
        <div className="ed-curriculum-brand__layout">
          {listPanel}
          <div className="ed-curriculum-brand__detail">{mainDetailPanel}</div>
        </div>
      )}

      {isMobile && mobileDetailOpen && selectedCourse && !addCourseOpen ? (
        <div className="ed-ops-mobile-detail" role="dialog" aria-modal aria-label="Course details">
          <div className="ed-ops-mobile-detail__bar">
            <button type="button" className="ed-ops-mobile-detail__back" onClick={() => setMobileDetailOpen(false)}>
              ← Back
            </button>
          </div>
          {detailPanel}
        </div>
      ) : null}

      {isMobile && addCourseOpen && addCoursePanel ? (
        <div className="ed-ops-mobile-detail" role="dialog" aria-modal aria-label="Add course">
          {addCoursePanel}
        </div>
      ) : null}

      {isMobile && !readOnly && !addCourseOpen ? (
        <CurriculumFab onClick={openAddCourse} />
      ) : null}
    </div>
  );
}
