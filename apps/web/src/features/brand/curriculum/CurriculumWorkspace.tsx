import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MutationError, PageToolbar, PipelineMasterDetail } from "@edunudg/ui";
import {
  archiveProgram,
  cloneCurriculumVersionToDraft,
  createLevel,
  createProgram,
  deleteLevelSafe,
  fetchCourseImpactStats,
  fetchLevelUnitCounts,
  fetchLevels,
  fetchPrograms,
  fetchVersions,
  publishVersion,
  reorderLevels,
  unpublishVersion,
  updateLevel,
  updateProgram,
  type CurriculumLevel,
} from "@/lib/curriculumApi";
import { parseTopicsComma, pickPublishedVersion, pickWorkingVersion } from "@/lib/curriculumHelpers";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
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
import "@/features/brand/curriculum/curriculumBrand.css";
import "@/features/center/centerOps.css";

type CourseFilter = "active" | "all";

interface CurriculumWorkspaceProps {
  brandId: string;
}

export function CurriculumWorkspace({ brandId }: CurriculumWorkspaceProps) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const courseCloser = useAddFormCloser();
  const levelCloser = useAddFormCloser();

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("active");
  const [editingCourse, setEditingCourse] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

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

  const versions = useQuery({
    queryKey: ["curriculum-versions", brandId, activeCourseId],
    enabled: !!activeCourseId,
    queryFn: () => fetchVersions(brandId, activeCourseId),
  });

  const workingVersion = useMemo(
    () => pickWorkingVersion(versions.data ?? []),
    [versions.data],
  );

  const publishedVersion = useMemo(
    () => pickPublishedVersion(versions.data ?? []),
    [versions.data],
  );

  const isLiveOnly =
    workingVersion?.status === "published" &&
    !(versions.data ?? []).some((v) => v.status === "draft");

  const canEditStructure = workingVersion?.status === "draft";

  const levels = useQuery({
    queryKey: ["levels", workingVersion?.id],
    enabled: !!workingVersion?.id,
    queryFn: () => fetchLevels(workingVersion!.id),
  });

  const unitCounts = useQuery({
    queryKey: ["level-unit-counts", workingVersion?.id, levels.data?.map((l) => l.id).join(",")],
    enabled: !!levels.data?.length,
    queryFn: () => fetchLevelUnitCounts((levels.data ?? []).map((l) => l.id)),
  });

  const impact = useQuery({
    queryKey: ["course-impact", activeCourseId],
    enabled: !!activeCourseId,
    queryFn: () => fetchCourseImpactStats(brandId, activeCourseId),
  });

  const selectedCourse = (courses.data ?? []).find((c) => c.id === activeCourseId);

  const versionsByCourse = useMemo(() => {
    const map: Record<string, NonNullable<typeof versions.data>> = {};
    if (activeCourseId && versions.data) {
      map[activeCourseId] = versions.data;
    }
    return map;
  }, [activeCourseId, versions.data]);

  const levelCountsByCourse = useMemo(() => {
    const map: Record<string, number> = {};
    if (activeCourseId && levels.data) {
      map[activeCourseId] = levels.data.length;
    }
    return map;
  }, [activeCourseId, levels.data]);

  useEffect(() => {
    setSelectedLevelId(null);
    setPublishMessage(null);
  }, [activeCourseId, workingVersion?.id]);

  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: ["programs", brandId] });
    if (activeCourseId) {
      void qc.invalidateQueries({ queryKey: ["curriculum-versions", brandId, activeCourseId] });
      void qc.invalidateQueries({ queryKey: ["course-impact", activeCourseId] });
    }
    if (workingVersion?.id) {
      void qc.invalidateQueries({ queryKey: ["levels", workingVersion.id] });
      void qc.invalidateQueries({ queryKey: ["level-unit-counts"] });
    }
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

  const createDraft = useMutation({
    mutationFn: () => cloneCurriculumVersionToDraft(publishedVersion!.id),
    onSuccess: () => {
      clear();
      invalidateAll();
      setPublishMessage("Draft created — you can now edit levels and units.");
    },
    onError: capture,
  });

  const publish = useMutation({
    mutationFn: () => publishVersion(workingVersion!.id),
    onSuccess: () => {
      clear();
      invalidateAll();
      setPublishMessage("Course published — visible on your website and center batch picker.");
    },
    onError: capture,
  });

  const unpublish = useMutation({
    mutationFn: () => unpublishVersion(workingVersion!.id),
    onSuccess: () => {
      clear();
      invalidateAll();
      setPublishMessage("Reverted to draft — no longer visible on public site.");
    },
    onError: capture,
  });

  const createLevelMutation = useMutation({
    mutationFn: async () => {
      if (!workingVersion || !canEditStructure) throw new Error("Create a draft to add levels");
      const order = (levels.data?.length ?? 0) + 1;
      await createLevel(
        brandId,
        workingVersion.id,
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
    mutationFn: (id: string) => {
      if (!canEditStructure) throw new Error("Create a draft to edit levels");
      return updateLevel(id, {
        name: editLevel.name,
        code: editLevel.code,
        topics: parseTopicsComma(editLevel.topics),
        whyTake: editLevel.whyTake,
        whatYouLearn: editLevel.whatYouLearn,
        videoUrl: editLevel.videoUrl,
      });
    },
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

  return (
    <div className="ed-curriculum-brand">
      <PageToolbar
        title="Curriculum"
        subtitle="Courses, levels, and units — what parents see on your website and centers use for batches."
      />
      <MutationError message={error} />

      <PipelineMasterDetail
        list={
          <CurriculumCourseList
            brandId={brandId}
            courses={courses.data ?? []}
            versionsByCourse={versionsByCourse}
            levelCounts={levelCountsByCourse}
            selectedId={activeCourseId || null}
            filter={courseFilter}
            onFilterChange={setCourseFilter}
            onSelect={setSelectedCourseId}
            addCourse={addCourse}
            onAddCourseChange={setAddCourse}
            onAddCourse={() => createCourse.mutate()}
            addPending={createCourse.isPending}
            bindAddClose={courseCloser.bindClose}
          />
        }
        detail={
          selectedCourse && workingVersion ? (
            <CurriculumCourseDetail
              brandId={brandId}
              course={selectedCourse}
              workingVersion={workingVersion}
              publishedVersion={publishedVersion}
              impact={impact.data}
              levels={levels.data ?? []}
              unitCounts={unitCounts.data ?? {}}
              canEditStructure={canEditStructure}
              isLiveOnly={isLiveOnly}
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
              onPublish={() => publish.mutate()}
              onUnpublish={() => unpublish.mutate()}
              publishPending={publish.isPending || unpublish.isPending}
              onCreateDraft={() => createDraft.mutate()}
              createDraftPending={createDraft.isPending}
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
              publishMessage={publishMessage}
            />
          ) : (
            <CurriculumCourseDetailPlaceholder />
          )
        }
      />
    </div>
  );
}
