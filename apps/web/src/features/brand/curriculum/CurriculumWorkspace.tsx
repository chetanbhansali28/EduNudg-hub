import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, CurriculumFab, FilterTabs, LeadKpiCard, LeadKpiGrid, MutationError, PipelinePageHeader, PipelineWorkspace } from "@edunudg/ui";
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
  setProgramActive,
  updateLevel,
  updateProgram,
  type CurriculumLevel,
} from "@/lib/curriculumApi";
import { parseTopicsComma } from "@/lib/curriculumHelpers";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import { useSavedFlash } from "@/features/shared/useSavedFlash";
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
  curriculumPageCounts,
  filterCoursesByTab,
  matchesCurriculumSearch,
  type CurriculumTabFilter,
} from "@/features/brand/curriculum/curriculumBrandHelpers";
import "@/features/brand/curriculum/curriculumBrand.css";

const ICON_SEARCH = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

interface CurriculumWorkspaceProps {
  brandId: string;
  readOnly?: boolean;
}

export function CurriculumWorkspace({ brandId, readOnly = false }: CurriculumWorkspaceProps) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const courseSaved = useSavedFlash();
  const levelSaved = useSavedFlash();
  const courseCloser = useAddFormCloser();
  const levelCloser = useAddFormCloser();
  const { isMobile } = useOpsBreakpoint();

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState<CurriculumTabFilter>("all");
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
    const tabbed = filterCoursesByTab(allCourses, listFilter);
    return tabbed.filter((course) => {
      const levelNames = (levelsByProgram.data?.[course.id] ?? []).map((level) => level.name);
      return matchesCurriculumSearch(course, levelNames, search);
    });
  }, [allCourses, listFilter, search, levelsByProgram.data]);

  const pageCounts = useMemo(
    () => curriculumPageCounts(allCourses, levelCountsByProgram.data ?? {}),
    [allCourses, levelCountsByProgram.data],
  );

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
      courseSaved.flash();
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

  const toggleCourseActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setProgramActive(id, isActive),
    onSuccess: () => {
      clear();
      invalidateAll();
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
    onSuccess: () => {
      invalidateAll();
      levelSaved.flash();
    },
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
      saveCourseSaved={courseSaved.saved}
      onArchiveCourse={() => archiveCourse.mutate()}
      onToggleActive={(isActive) => toggleCourseActive.mutate({ id: selectedCourse.id, isActive })}
      toggleActivePending={toggleCourseActive.isPending && toggleCourseActive.variables?.id === selectedCourse.id}
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
      updateLevelSaved={levelSaved.saved}
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
      mobileTab={listFilter}
      onMobileTabChange={setListFilter}
      search={search}
      onSearchChange={setSearch}
      onSelect={selectCourse}
      onOpenCourse={(id) => openMobileCourse(id)}
      onEditProgram={(courseId, programId) => openMobileCourse(courseId, programId)}
      onAddProgram={(courseId) => {
        openMobileCourse(courseId);
        setRequestAddProgram(true);
      }}
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

  const filterTabs = [
    { value: "all" as const, label: isMobile ? "All" : "All courses", count: pageCounts.total },
    { value: "active" as const, label: "Active", count: pageCounts.active },
    { value: "drafts" as const, label: "Drafts", count: pageCounts.drafts },
  ];

  return (
    <div className={`ed-curriculum-brand${isMobile ? " ed-curriculum-brand--mobile" : ""}`}>
      <PipelinePageHeader
        title="Curriculum"
        subtitle="Design and manage your franchise's educational blueprint. Changes here update across all authorized centers and student portals."
        actions={
          !readOnly ? (
            <Button onClick={openAddCourse}>+ Add Curriculum</Button>
          ) : null
        }
      />

      <LeadKpiGrid>
        <LeadKpiCard
          label="Active"
          value={pageCounts.active}
          hint={pageCounts.active > 0 ? "Live" : undefined}
          active={listFilter === "active"}
          onClick={() => setListFilter("active")}
        />
        <LeadKpiCard
          label="Drafts"
          value={pageCounts.drafts}
          hint="Not live"
          active={listFilter === "drafts"}
          onClick={() => setListFilter("drafts")}
        />
        <LeadKpiCard
          label="Programs"
          value={pageCounts.programs}
          hint="Syllabus levels"
        />
        <LeadKpiCard
          label="Total"
          value={pageCounts.total}
          hint="All courses"
          tone="total"
          active={listFilter === "all"}
          onClick={() => setListFilter("all")}
        />
      </LeadKpiGrid>

      <MutationError message={error} />

      {!isMobile ? (
        <div className="ed-curriculum-brand__toolbar">
          <label className="ed-curriculum-brand__search">
            <span className="ed-curriculum-brand__search-icon">{ICON_SEARCH}</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search courses..."
              aria-label="Search courses"
            />
          </label>
          <FilterTabs
            options={filterTabs}
            value={listFilter}
            onChange={setListFilter}
            aria-label="Course filter"
          />
        </div>
      ) : null}

      {isMobile ? (
        listPanel
      ) : (
        <PipelineWorkspace
          detailOpen={!!selectedCourse || addCourseOpen}
          list={listPanel}
          detail={<div className="ed-curriculum-brand__detail">{mainDetailPanel}</div>}
        />
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
