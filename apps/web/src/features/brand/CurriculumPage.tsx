import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  FormGrid,
  Input,
  ListRow,
  MutationError,
  PageTitle,
  SaveButton,
  DraftPublishedToggle,
  Textarea,
  FormActions,
  Select,
} from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { DeleteConfirmButton } from "@/features/shared/DeleteConfirmButton";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import { useBrandScope } from "./hooks/useBrandScope";
import { versionPublishValue } from "@/lib/curriculumVersionStatus";

type CurriculumStatus = "draft" | "published" | "archived";

interface Program {
  id: string;
  name: string;
  description: string | null;
  why_take: string | null;
  what_you_learn: string | null;
  marketing_video_url: string | null;
  is_active: boolean;
}

interface Version {
  id: string;
  program_id: string;
  version_number: number;
  status: CurriculumStatus;
}

interface Level {
  id: string;
  name: string;
  sort_order: number;
  abacus_level_code: string | null;
  topics_covered: string[] | unknown;
  why_take: string | null;
  what_you_learn: string | null;
  marketing_video_url: string | null;
}

interface Module {
  id: string;
  title: string;
  sort_order: number;
}

interface Lesson {
  id: string;
  title: string;
  content_type: string | null;
  duration_minutes: number | null;
  sort_order: number;
}

const LESSON_CONTENT_TYPES = [
  { value: "article", label: "Article" },
  { value: "video", label: "Video" },
  { value: "quiz", label: "Quiz" },
  { value: "worksheet", label: "Worksheet" },
] as const;

type LessonContentType = (typeof LESSON_CONTENT_TYPES)[number]["value"];

function topicsToString(topics: string[] | unknown): string {
  return Array.isArray(topics) ? (topics as string[]).join(", ") : "";
}

export function CurriculumPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();

  const [programName, setProgramName] = useState("");
  const [programDesc, setProgramDesc] = useState("");
  const [programWhyTake, setProgramWhyTake] = useState("");
  const [programWhatLearn, setProgramWhatLearn] = useState("");
  const [programVideoUrl, setProgramVideoUrl] = useState("");
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [editProgram, setEditProgram] = useState({
    name: "",
    description: "",
    whyTake: "",
    whatYouLearn: "",
    marketingVideoUrl: "",
  });
  const [levelAbacusCode, setLevelAbacusCode] = useState("");
  const [levelTopics, setLevelTopics] = useState("");
  const [levelWhyTake, setLevelWhyTake] = useState("");
  const [levelWhatLearn, setLevelWhatLearn] = useState("");
  const [levelVideoUrl, setLevelVideoUrl] = useState("");

  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");

  const [levelName, setLevelName] = useState("");
  const [editLevelName, setEditLevelName] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [editModuleTitle, setEditModuleTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");
  const [lessonContentType, setLessonContentType] = useState<LessonContentType>("article");
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonDuration, setEditLessonDuration] = useState("");
  const [editLessonContentType, setEditLessonContentType] = useState<LessonContentType>("article");
  const [editingLessonId, setEditingLessonId] = useState("");
  const programCloser = useAddFormCloser();
  const levelCloser = useAddFormCloser();
  const moduleCloser = useAddFormCloser();
  const lessonCloser = useAddFormCloser();

  const programs = useQuery({
    queryKey: ["programs", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("programs")
        .select("id, name, description, why_take, what_you_learn, marketing_video_url, is_active")
        .eq("brand_id", brandId!)
        .is("deleted_at", null)
        .order("name");
      return supabaseList(data, qErr) as Program[];
    },
  });

  const versions = useQuery({
    queryKey: ["curriculum-versions", brandId, selectedProgramId],
    enabled: !!brandId && !!selectedProgramId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("curriculum_versions")
        .select("id, program_id, version_number, status")
        .eq("brand_id", brandId!)
        .eq("program_id", selectedProgramId)
        .order("version_number", { ascending: false });
      return supabaseList(data, qErr) as Version[];
    },
  });

  const levels = useQuery({
    queryKey: ["levels", selectedVersionId],
    enabled: !!selectedVersionId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("levels")
        .select("id, name, sort_order, abacus_level_code, topics_covered, why_take, what_you_learn, marketing_video_url")
        .eq("curriculum_version_id", selectedVersionId)
        .order("sort_order");
      return supabaseList(data, qErr) as Level[];
    },
  });

  const modules = useQuery({
    queryKey: ["modules", selectedLevelId],
    enabled: !!selectedLevelId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("modules")
        .select("id, title, sort_order")
        .eq("level_id", selectedLevelId)
        .order("sort_order");
      return supabaseList(data, qErr) as Module[];
    },
  });

  const lessons = useQuery({
    queryKey: ["lessons", selectedModuleId],
    enabled: !!selectedModuleId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("lessons")
        .select("id, title, content_type, duration_minutes, sort_order")
        .eq("module_id", selectedModuleId)
        .order("sort_order");
      return supabaseList(data, qErr) as Lesson[];
    },
  });

  const loadLevelIntoEditForm = (l: Level) => {
    setEditLevelName(l.name);
    setLevelAbacusCode(l.abacus_level_code ?? "");
    setLevelTopics(topicsToString(l.topics_covered));
    setLevelWhyTake(l.why_take ?? "");
    setLevelWhatLearn(l.what_you_learn ?? "");
    setLevelVideoUrl(l.marketing_video_url ?? "");
  };

  const selectedProgram = (programs.data ?? []).find((p) => p.id === selectedProgramId);
  const selectedVersion = (versions.data ?? []).find((v) => v.id === selectedVersionId);
  const selectedLevel = (levels.data ?? []).find((l) => l.id === selectedLevelId);
  const selectedModule = (modules.data ?? []).find((m) => m.id === selectedModuleId);

  useEffect(() => {
    const list = programs.data;
    if (!selectedProgramId && list?.length) {
      setSelectedProgramId(list[0].id);
    }
  }, [programs.data, selectedProgramId]);

  useEffect(() => {
    const list = versions.data;
    if (selectedProgramId && !selectedVersionId && list?.length) {
      setSelectedVersionId(list[0].id);
      setSelectedLevelId("");
      setSelectedModuleId("");
    }
  }, [versions.data, selectedProgramId, selectedVersionId]);

  useEffect(() => {
    const list = levels.data;
    if (selectedVersionId && !selectedLevelId && list?.length) {
      const first = list[0];
      setSelectedLevelId(first.id);
      setSelectedModuleId("");
      loadLevelIntoEditForm(first);
    }
  }, [levels.data, selectedVersionId, selectedLevelId]);

  useEffect(() => {
    const list = modules.data;
    if (selectedLevelId && !selectedModuleId && list?.length) {
      const first = list[0];
      setSelectedModuleId(first.id);
      setEditModuleTitle(first.title);
    }
  }, [modules.data, selectedLevelId, selectedModuleId]);

  const invalidatePrograms = () => qc.invalidateQueries({ queryKey: ["programs", brandId] });

  const createProgram = useMutation({
    mutationFn: async () => {
      if (!brandId) throw new Error("Brand required");
      clear();
      const { data: created, error: mErr } = await getSupabase()
        .from("programs")
        .insert({
          brand_id: brandId,
          name: programName.trim(),
          description: programDesc.trim() || null,
          why_take: programWhyTake.trim() || null,
          what_you_learn: programWhatLearn.trim() || null,
          marketing_video_url: programVideoUrl.trim() || null,
        })
        .select("id")
        .single();
      if (mErr || !created?.id) throw mErr ?? new Error("Program not created");

      const { error: versionErr } = await getSupabase().from("curriculum_versions").insert({
        brand_id: brandId,
        program_id: created.id,
        version_number: 1,
        status: "draft",
      });
      if (versionErr) throw versionErr;
    },
    onSuccess: () => {
      invalidatePrograms();
      setProgramName("");
      setProgramDesc("");
      setProgramWhyTake("");
      setProgramWhatLearn("");
      setProgramVideoUrl("");
      programCloser.closeAddForm();
    },
    onError: capture,
  });

  const updateProgram = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("programs")
        .update({
          name: editProgram.name.trim(),
          description: editProgram.description.trim() || null,
          why_take: editProgram.whyTake.trim() || null,
          what_you_learn: editProgram.whatYouLearn.trim() || null,
          marketing_video_url: editProgram.marketingVideoUrl.trim() || null,
        })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidatePrograms();
      setEditingProgramId(null);
    },
    onError: capture,
  });

  const deleteProgram = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("programs")
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidatePrograms();
      if (selectedProgramId === editingProgramId) {
        setSelectedProgramId("");
        setSelectedVersionId("");
      }
    },
    onError: capture,
  });

  const createVersion = useMutation({
    mutationFn: async () => {
      if (!brandId || !selectedProgramId) throw new Error("Select a program");
      clear();
      const max = versions.data?.[0]?.version_number ?? 0;
      const { error: mErr } = await getSupabase().from("curriculum_versions").insert({
        brand_id: brandId,
        program_id: selectedProgramId,
        version_number: max + 1,
        status: "draft",
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["curriculum-versions", brandId, selectedProgramId] }),
    onError: capture,
  });

  const deleteVersion = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase().from("curriculum_versions").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["curriculum-versions", brandId, selectedProgramId] });
      setSelectedVersionId("");
    },
    onError: capture,
  });

  const updateVersionStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CurriculumStatus }) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("curriculum_versions")
        .update({ status, published_at: status === "published" ? new Date().toISOString() : null })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["curriculum-versions", brandId, selectedProgramId] }),
    onError: capture,
  });

  const createLevel = useMutation({
    mutationFn: async () => {
      if (!brandId || !selectedVersionId) throw new Error("Select a version");
      clear();
      const order = (levels.data?.length ?? 0) + 1;
      const topics = levelTopics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const { error: mErr } = await getSupabase().from("levels").insert({
        brand_id: brandId,
        curriculum_version_id: selectedVersionId,
        name: levelName.trim(),
        sort_order: order,
        abacus_level_code: levelAbacusCode.trim() || null,
        topics_covered: topics,
        why_take: levelWhyTake.trim() || null,
        what_you_learn: levelWhatLearn.trim() || null,
        marketing_video_url: levelVideoUrl.trim() || null,
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["levels", selectedVersionId] });
      setLevelName("");
      setLevelAbacusCode("");
      setLevelTopics("");
      setLevelWhyTake("");
      setLevelWhatLearn("");
      setLevelVideoUrl("");
      levelCloser.closeAddForm();
    },
    onError: capture,
  });

  const updateLevelDetails = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const topics = levelTopics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const { error: mErr } = await getSupabase()
        .from("levels")
        .update({
          name: editLevelName.trim(),
          abacus_level_code: levelAbacusCode.trim() || null,
          topics_covered: topics,
          why_take: levelWhyTake.trim() || null,
          what_you_learn: levelWhatLearn.trim() || null,
          marketing_video_url: levelVideoUrl.trim() || null,
        })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["levels", selectedVersionId] }),
    onError: capture,
  });

  const deleteLevel = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase().from("levels").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["levels", selectedVersionId] });
      setSelectedLevelId("");
    },
    onError: capture,
  });

  const createModule = useMutation({
    mutationFn: async () => {
      if (!brandId || !selectedLevelId) throw new Error("Select a level");
      clear();
      const order = (modules.data?.length ?? 0) + 1;
      const { error: mErr } = await getSupabase().from("modules").insert({
        brand_id: brandId,
        level_id: selectedLevelId,
        title: moduleTitle.trim(),
        sort_order: order,
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modules", selectedLevelId] });
      setModuleTitle("");
      moduleCloser.closeAddForm();
    },
    onError: capture,
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase().from("modules").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modules", selectedLevelId] });
      setSelectedModuleId("");
      setEditModuleTitle("");
    },
    onError: capture,
  });

  const updateModule = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("modules")
        .update({ title: editModuleTitle.trim() })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules", selectedLevelId] }),
    onError: capture,
  });

  const createLesson = useMutation({
    mutationFn: async () => {
      if (!brandId || !selectedModuleId) throw new Error("Select a module");
      clear();
      const order = (lessons.data?.length ?? 0) + 1;
      const duration = lessonDuration.trim() ? parseInt(lessonDuration, 10) : null;
      const { error: mErr } = await getSupabase().from("lessons").insert({
        brand_id: brandId,
        module_id: selectedModuleId,
        title: lessonTitle.trim(),
        sort_order: order,
        duration_minutes: duration,
        content_type: lessonContentType,
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons", selectedModuleId] });
      setLessonTitle("");
      setLessonDuration("");
      setLessonContentType("article");
      lessonCloser.closeAddForm();
    },
    onError: capture,
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase().from("lessons").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons", selectedModuleId] }),
    onError: capture,
  });

  const updateLesson = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const duration = editLessonDuration.trim() ? parseInt(editLessonDuration, 10) : null;
      const { error: mErr } = await getSupabase()
        .from("lessons")
        .update({
          title: editLessonTitle.trim(),
          duration_minutes: duration,
          content_type: editLessonContentType,
        })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons", selectedModuleId] }),
    onError: capture,
  });

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  const versionOptions = (versions.data ?? []).map((v) => ({
    value: v.id,
    label: `v${v.version_number} (${v.status})`,
  }));
  const levelOptions = (levels.data ?? []).map((l) => ({
    value: l.id,
    label: l.abacus_level_code ? `${l.name} · ${l.abacus_level_code}` : l.name,
  }));
  const moduleOptions = (modules.data ?? []).map((m) => ({ value: m.id, label: m.title }));

  return (
    <>
      <PageTitle>Curriculum</PageTitle>
      <MutationError message={error} />

      <p className="ed-text-sm ed-muted ed-curriculum-intro">
        Manage the full curriculum tree in five layers: <strong>programs</strong> (marketing overview) →{" "}
        <strong>curriculum_versions</strong> (draft / published snapshots) → <strong>levels</strong> →{" "}
        <strong>modules</strong> → <strong>lessons</strong>. Select a program below, then work through versions,
        levels, modules, and lessons in order. A draft version v1 is created automatically with each new program.
      </p>

      <Card title="Programs (programs)">
        <AddFormSection
          buttonLabel="Add program"
          panelTitle="Add program"
          actionsPlacement="footer"
          primaryAction={{
            label: "Add program",
            onClick: () => createProgram.mutate(),
            pending: createProgram.isPending,
            disabled: !programName.trim(),
          }}
        >
          {({ close }) => {
            programCloser.bindClose(close);
            return (
              <div className="ed-editable-form">
                <FormGrid columns={2}>
                  <Input label="Program name" value={programName} onChange={setProgramName} editable />
                  <Input
                    label="Marketing video URL"
                    value={programVideoUrl}
                    onChange={setProgramVideoUrl}
                    placeholder="https://…"
                    editable
                  />
                </FormGrid>
                <Textarea
                  label="Description"
                  value={programDesc}
                  onChange={setProgramDesc}
                  rows={6}
                  editable
                />
                <FormGrid columns={2}>
                  <Textarea
                    label="Why take this program (overview)"
                    value={programWhyTake}
                    onChange={setProgramWhyTake}
                    rows={3}
                    editable
                  />
                  <Textarea label="What you will learn" value={programWhatLearn} onChange={setProgramWhatLearn} rows={3} editable />
                </FormGrid>
              </div>
            );
          }}
        </AddFormSection>
        <DataList
          items={programs.data ?? []}
          empty="No programs yet."
          render={(p) => {
            const editing = editingProgramId === p.id;
            return (
              <ListRow
                className={editing ? "ed-list-row--edit-full" : undefined}
                aside={
                  editing ? undefined : (
                    <CrudRowActions
                      editing={false}
                      onEdit={() => {
                        setEditingProgramId(p.id);
                        setEditProgram({
                          name: p.name,
                          description: p.description ?? "",
                          whyTake: p.why_take ?? "",
                          whatYouLearn: p.what_you_learn ?? "",
                          marketingVideoUrl: p.marketing_video_url ?? "",
                        });
                      }}
                      onSave={() => updateProgram.mutate(p.id)}
                      onCancel={() => setEditingProgramId(null)}
                      onDelete={() => deleteProgram.mutate(p.id)}
                      deleteTitle="Archive this program?"
                      deleteDescription="The program will be archived and hidden from active curriculum lists."
                      saveDisabled={!editProgram.name.trim() || updateProgram.isPending}
                    />
                  )
                }
              >
                {editing ? (
                  <div className="ed-editable-form">
                    <FormGrid columns={2}>
                      <Input
                        label="Name"
                        value={editProgram.name}
                        onChange={(v) => setEditProgram((f) => ({ ...f, name: v }))}
                        editable
                      />
                      <Input
                        label="Marketing video URL"
                        value={editProgram.marketingVideoUrl}
                        onChange={(v) => setEditProgram((f) => ({ ...f, marketingVideoUrl: v }))}
                        editable
                      />
                    </FormGrid>
                    <Textarea
                      label="Description"
                      value={editProgram.description}
                      onChange={(v) => setEditProgram((f) => ({ ...f, description: v }))}
                      rows={6}
                      editable
                    />
                    <FormGrid columns={2}>
                      <Textarea
                        label="Why take this program"
                        value={editProgram.whyTake}
                        onChange={(v) => setEditProgram((f) => ({ ...f, whyTake: v }))}
                        rows={4}
                        editable
                      />
                      <Textarea
                        label="What you will learn"
                        value={editProgram.whatYouLearn}
                        onChange={(v) => setEditProgram((f) => ({ ...f, whatYouLearn: v }))}
                        rows={4}
                        editable
                      />
                    </FormGrid>
                    <FormActions>
                      <SaveButton
                        onClick={() => updateProgram.mutate(p.id)}
                        pending={updateProgram.isPending}
                        disabled={!editProgram.name.trim()}
                      />
                      <Button variant="ghost" onClick={() => setEditingProgramId(null)}>
                        Cancel
                      </Button>
                    </FormActions>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="ed-link-button"
                    onClick={() => {
                      setSelectedProgramId(p.id);
                      setSelectedVersionId("");
                      setSelectedLevelId("");
                      setSelectedModuleId("");
                      setEditingLessonId("");
                    }}
                  >
                    <strong>{p.name}</strong>
                    {selectedProgramId === p.id && <Badge tone="success"> Selected</Badge>}
                  </button>
                )}
              </ListRow>
            );
          }}
        />
      </Card>

      {selectedProgramId && selectedProgram && (
        <Card title="Curriculum structure">
          <p className="ed-text-sm ed-muted">
            Use the selectors to jump between items, or click a row in each section to edit details.
          </p>
          <div className="ed-curriculum-structure" aria-label="Current curriculum path">
            <span className="ed-curriculum-structure__step">
              <Badge tone="success">Program</Badge> {selectedProgram.name}
            </span>
            {selectedVersion && (
              <>
                <span className="ed-curriculum-structure__sep">→</span>
                <span className="ed-curriculum-structure__step">
                  <Badge>Version</Badge> v{selectedVersion.version_number} ({selectedVersion.status})
                </span>
              </>
            )}
            {selectedLevel && (
              <>
                <span className="ed-curriculum-structure__sep">→</span>
                <span className="ed-curriculum-structure__step">
                  <Badge>Level</Badge> {selectedLevel.name}
                </span>
              </>
            )}
            {selectedModule && (
              <>
                <span className="ed-curriculum-structure__sep">→</span>
                <span className="ed-curriculum-structure__step">
                  <Badge>Module</Badge> {selectedModule.title}
                </span>
              </>
            )}
          </div>
          <FormGrid columns={3}>
            <Select
              label="Version (curriculum_versions)"
              value={selectedVersionId}
              onChange={(id) => {
                setSelectedVersionId(id);
                setSelectedLevelId("");
                setSelectedModuleId("");
              }}
              options={versionOptions}
              placeholder="Select version"
              editable
            />
            <Select
              label="Level (levels)"
              value={selectedLevelId}
              onChange={(id) => {
                setSelectedLevelId(id);
                setSelectedModuleId("");
                const level = (levels.data ?? []).find((l) => l.id === id);
                if (level) loadLevelIntoEditForm(level);
              }}
              options={levelOptions}
              placeholder={selectedVersionId ? "Select level" : "Select a version first"}
              editable
            />
            <Select
              label="Module (modules)"
              value={selectedModuleId}
              onChange={(id) => {
                setSelectedModuleId(id);
                setEditingLessonId("");
                const mod = (modules.data ?? []).find((m) => m.id === id);
                setEditModuleTitle(mod?.title ?? "");
              }}
              options={moduleOptions}
              placeholder={selectedLevelId ? "Select module" : "Select a level first"}
              editable
            />
          </FormGrid>
        </Card>
      )}

      {selectedProgramId && (
        <div className="ed-curriculum-stack">
        <Card title="Versions (curriculum_versions)">
          <Button onClick={() => createVersion.mutate()} disabled={createVersion.isPending}>
            New version
          </Button>
          <DataList
            items={versions.data ?? []}
            empty="No versions — create one."
            render={(v) => (
              <ListRow
                aside={
                  <>
                    {v.status === "archived" && <Badge tone="warning">Archived</Badge>}
                    <DraftPublishedToggle
                      value={versionPublishValue(v.status)}
                      onChange={(status) => updateVersionStatus.mutate({ id: v.id, status })}
                      disabled={updateVersionStatus.isPending}
                      aria-label={`Version ${v.version_number} publication status`}
                    />
                    <DeleteConfirmButton
                      onConfirm={() => deleteVersion.mutate(v.id)}
                      description="This will delete the curriculum version and all nested levels, modules, and lessons."
                    />
                  </>
                }
              >
                <button
                  type="button"
                  className="ed-link-button"
                  onClick={() => {
                    setSelectedVersionId(v.id);
                    setSelectedLevelId("");
                    setSelectedModuleId("");
                  }}
                >
                  v{v.version_number} — {v.status}
                  {selectedVersionId === v.id && <Badge tone="success"> Selected</Badge>}
                </button>
              </ListRow>
            )}
          />
        </Card>

      {selectedVersionId && (
        <Card
          title="Levels (levels)"
        >
          <AddFormSection
            buttonLabel="Add level"
            panelTitle="Add level"
            actionsPlacement="footer"
            primaryAction={{
              label: "Add level",
              onClick: () => createLevel.mutate(),
              pending: createLevel.isPending,
              disabled: !levelName.trim(),
            }}
          >
            {({ close }) => {
              levelCloser.bindClose(close);
              return (
                <div className="ed-editable-form">
                  <FormGrid columns={3}>
                    <Input
                      label="Level name"
                      value={levelName}
                      onChange={setLevelName}
                      placeholder="Level 1 — Foundations"
                      editable
                    />
                    <Input label="Level code" value={levelAbacusCode} onChange={setLevelAbacusCode} placeholder="L1" editable />
                    <Input
                      label="Topics covered (comma-separated)"
                      value={levelTopics}
                      onChange={setLevelTopics}
                      placeholder="Finger basics, Small friends, …"
                      editable
                    />
                  </FormGrid>
                  <FormGrid columns={2}>
                    <Textarea label="Why this level" value={levelWhyTake} onChange={setLevelWhyTake} rows={2} editable />
                    <Textarea label="What you will learn" value={levelWhatLearn} onChange={setLevelWhatLearn} rows={2} editable />
                  </FormGrid>
                  <FormGrid columns={3}>
                    <Input label="Level marketing video URL" value={levelVideoUrl} onChange={setLevelVideoUrl} editable />
                  </FormGrid>
                </div>
              );
            }}
          </AddFormSection>
          <DataList
            items={levels.data ?? []}
            render={(l) => (
              <ListRow
                aside={
                  <DeleteConfirmButton
                    onConfirm={() => deleteLevel.mutate(l.id)}
                    description="This will delete the level and all nested modules."
                  />
                }
              >
                <button
                  type="button"
                  className="ed-link-button"
                  onClick={() => {
                    setSelectedLevelId(l.id);
                    setSelectedModuleId("");
                    loadLevelIntoEditForm(l);
                  }}
                >
                  {l.name}
                  {l.abacus_level_code && <span className="ed-text-sm ed-muted"> · {l.abacus_level_code}</span>}
                  {selectedLevelId === l.id && <Badge tone="success"> Selected</Badge>}
                </button>
              </ListRow>
            )}
          />
          {selectedLevelId && (
            <div className="ed-editable-form">
              <FormGrid columns={3}>
                <Input label="Level name" value={editLevelName} onChange={setEditLevelName} editable />
                <Input label="Level code" value={levelAbacusCode} onChange={setLevelAbacusCode} placeholder="L1" editable />
                <Input
                  label="Topics covered (comma-separated)"
                  value={levelTopics}
                  onChange={setLevelTopics}
                  placeholder="Finger basics, Small friends, …"
                  editable
                />
              </FormGrid>
              <FormGrid columns={2}>
                <Textarea label="Why this level" value={levelWhyTake} onChange={setLevelWhyTake} rows={3} editable />
                <Textarea label="What you will learn" value={levelWhatLearn} onChange={setLevelWhatLearn} rows={3} editable />
              </FormGrid>
              <Input label="Level marketing video URL" value={levelVideoUrl} onChange={setLevelVideoUrl} editable />
              <FormActions>
                <SaveButton
                  onClick={() => updateLevelDetails.mutate(selectedLevelId)}
                  pending={updateLevelDetails.isPending}
                  disabled={!editLevelName.trim()}
                />
              </FormActions>
            </div>
          )}
        </Card>
      )}

      {selectedLevelId && (
        <Card title="Modules (modules)">
          <AddFormSection
            buttonLabel="Add module"
            panelTitle="Add module"
            actionsPlacement="footer"
            primaryAction={{
              label: "Add module",
              onClick: () => createModule.mutate(),
              pending: createModule.isPending,
              disabled: !moduleTitle.trim(),
            }}
          >
            {({ close }) => {
              moduleCloser.bindClose(close);
              return (
                <div className="ed-editable-form">
                  <FormGrid columns={3}>
                    <Input label="Module title" value={moduleTitle} onChange={setModuleTitle} editable />
                  </FormGrid>
                </div>
              );
            }}
          </AddFormSection>
          <DataList
            items={modules.data ?? []}
            render={(m) => (
              <ListRow
                aside={
                  <DeleteConfirmButton
                    onConfirm={() => deleteModule.mutate(m.id)}
                    description="This will delete the module and all nested lessons."
                  />
                }
              >
                <button
                  type="button"
                  className="ed-link-button"
                  onClick={() => {
                    setSelectedModuleId(m.id);
                    setEditModuleTitle(m.title);
                  }}
                >
                  {m.title}
                  {selectedModuleId === m.id && <Badge tone="success"> Selected</Badge>}
                </button>
              </ListRow>
            )}
          />
          {selectedModuleId && (
            <div className="ed-editable-form">
              <FormGrid columns={3}>
                <Input label="Module title" value={editModuleTitle} onChange={setEditModuleTitle} editable />
              </FormGrid>
              <FormActions>
                <SaveButton
                  onClick={() => updateModule.mutate(selectedModuleId)}
                  pending={updateModule.isPending}
                  disabled={!editModuleTitle.trim()}
                />
              </FormActions>
            </div>
          )}
        </Card>
      )}

      {selectedModuleId && (
        <Card title="Lessons (lessons)">
          <AddFormSection
            buttonLabel="Add lesson"
            panelTitle="Add lesson"
            actionsPlacement="footer"
            primaryAction={{
              label: "Add lesson",
              onClick: () => createLesson.mutate(),
              pending: createLesson.isPending,
              disabled: !lessonTitle.trim(),
            }}
          >
            {({ close }) => {
              lessonCloser.bindClose(close);
              return (
                <div className="ed-editable-form">
                  <FormGrid columns={3}>
                    <Input label="Lesson title" value={lessonTitle} onChange={setLessonTitle} editable />
                    <Input label="Duration (minutes)" value={lessonDuration} onChange={setLessonDuration} editable />
                    <Select
                      label="Content type"
                      value={lessonContentType}
                      onChange={setLessonContentType}
                      options={[...LESSON_CONTENT_TYPES]}
                      editable
                    />
                  </FormGrid>
                </div>
              );
            }}
          </AddFormSection>
          <DataList
            items={lessons.data ?? []}
            empty="No lessons yet."
            render={(l) => (
              <ListRow
                aside={<DeleteConfirmButton onConfirm={() => deleteLesson.mutate(l.id)} />}
              >
                <button
                  type="button"
                  className="ed-link-button"
                  onClick={() => {
                    setEditingLessonId(l.id);
                    setEditLessonTitle(l.title);
                    setEditLessonDuration(l.duration_minutes != null ? String(l.duration_minutes) : "");
                    setEditLessonContentType((l.content_type as LessonContentType) ?? "article");
                  }}
                >
                  {l.title}
                  {l.duration_minutes != null && <small className="ed-muted"> · {l.duration_minutes} min</small>}
                  {l.content_type && <small className="ed-muted"> · {l.content_type}</small>}
                  {editingLessonId === l.id && <Badge tone="success"> Selected</Badge>}
                </button>
              </ListRow>
            )}
          />
          {editingLessonId && (
            <div className="ed-editable-form">
              <FormGrid columns={3}>
                <Input label="Lesson title" value={editLessonTitle} onChange={setEditLessonTitle} editable />
                <Input label="Duration (minutes)" value={editLessonDuration} onChange={setEditLessonDuration} editable />
                <Select
                  label="Content type"
                  value={editLessonContentType}
                  onChange={setEditLessonContentType}
                  options={[...LESSON_CONTENT_TYPES]}
                  editable
                />
              </FormGrid>
              <FormActions>
                <SaveButton
                  onClick={() => updateLesson.mutate(editingLessonId)}
                  pending={updateLesson.isPending}
                  disabled={!editLessonTitle.trim()}
                />
              </FormActions>
            </div>
          )}
        </Card>
      )}
        </div>
      )}
    </>
  );
}
