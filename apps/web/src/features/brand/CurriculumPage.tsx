import { useState } from "react";
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
  PageGrid,
  PageGridFull,
  PageTitle,
  Select,
  Textarea,
} from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { useBrandScope } from "./hooks/useBrandScope";

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

const VERSION_STATUS: { value: CurriculumStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

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
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");

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

  const invalidatePrograms = () => qc.invalidateQueries({ queryKey: ["programs", brandId] });

  const createProgram = useMutation({
    mutationFn: async () => {
      if (!brandId) throw new Error("Brand required");
      clear();
      const { error: mErr } = await getSupabase().from("programs").insert({
        brand_id: brandId,
        name: programName.trim(),
        description: programDesc.trim() || null,
        why_take: programWhyTake.trim() || null,
        what_you_learn: programWhatLearn.trim() || null,
        marketing_video_url: programVideoUrl.trim() || null,
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidatePrograms();
      setProgramName("");
      setProgramDesc("");
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
      if (!confirm("Archive this program?")) return;
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
      if (!confirm("Delete this curriculum version and all nested content?")) return;
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
      if (!confirm("Delete this level and nested modules?")) return;
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
    },
    onError: capture,
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm("Delete this module and lessons?")) return;
      clear();
      const { error: mErr } = await getSupabase().from("modules").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modules", selectedLevelId] });
      setSelectedModuleId("");
    },
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
        content_type: "article",
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons", selectedModuleId] });
      setLessonTitle("");
      setLessonDuration("");
    },
    onError: capture,
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm("Delete this lesson?")) return;
      clear();
      const { error: mErr } = await getSupabase().from("lessons").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons", selectedModuleId] }),
    onError: capture,
  });

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  const programOptions = (programs.data ?? []).map((p) => ({ value: p.id, label: p.name }));

  return (
    <>
      <PageTitle>Curriculum</PageTitle>
      <MutationError message={error} />

      <PageGridFull>
      <Card title="Programs">
        <FormGrid>
          <Input label="Program name" value={programName} onChange={setProgramName} />
          <Input label="Marketing video URL" value={programVideoUrl} onChange={setProgramVideoUrl} placeholder="https://…" />
        </FormGrid>
        <Input label="Description" value={programDesc} onChange={setProgramDesc} />
        <Textarea label="Why take abacus (program overview)" value={programWhyTake} onChange={setProgramWhyTake} rows={3} />
        <Textarea label="What you will learn" value={programWhatLearn} onChange={setProgramWhatLearn} rows={3} />
        <Button onClick={() => createProgram.mutate()} disabled={!programName.trim() || createProgram.isPending}>
          Add program
        </Button>
        <DataList
          items={programs.data ?? []}
          empty="No programs yet."
          render={(p) => {
            const editing = editingProgramId === p.id;
            return (
              <ListRow
                aside={
                  <CrudRowActions
                    editing={editing}
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
                    saveDisabled={!editProgram.name.trim() || updateProgram.isPending}
                  />
                }
              >
                {editing ? (
                  <div className="ed-form-section">
                    <FormGrid>
                      <Input label="Name" value={editProgram.name} onChange={(v) => setEditProgram((f) => ({ ...f, name: v }))} />
                      <Input
                        label="Marketing video URL"
                        value={editProgram.marketingVideoUrl}
                        onChange={(v) => setEditProgram((f) => ({ ...f, marketingVideoUrl: v }))}
                      />
                    </FormGrid>
                    <Textarea label="Why take abacus" value={editProgram.whyTake} onChange={(v) => setEditProgram((f) => ({ ...f, whyTake: v }))} rows={2} />
                    <Textarea label="What you will learn" value={editProgram.whatYouLearn} onChange={(v) => setEditProgram((f) => ({ ...f, whatYouLearn: v }))} rows={2} />
                    <Input label="Description" value={editProgram.description} onChange={(v) => setEditProgram((f) => ({ ...f, description: v }))} />
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
      </PageGridFull>

      <PageGrid cols={3}>
      {selectedProgramId && (
        <Card title="Versions">
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
                    <Select
                      label=""
                      value={v.status}
                      onChange={(status) => updateVersionStatus.mutate({ id: v.id, status })}
                      options={VERSION_STATUS}
                    />
                    <Button variant="danger" onClick={() => deleteVersion.mutate(v.id)}>
                      Delete
                    </Button>
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
      )}

      {selectedVersionId && (
        <Card title="Levels">
          <FormGrid>
            <Input label="Level name" value={levelName} onChange={setLevelName} placeholder="Level 1 — Foundations" />
            <Input label="Abacus level code" value={levelAbacusCode} onChange={setLevelAbacusCode} placeholder="L1" />
          </FormGrid>
          <Input label="Topics covered (comma-separated)" value={levelTopics} onChange={setLevelTopics} placeholder="Finger basics, Small friends, …" />
          <Textarea label="Why this level" value={levelWhyTake} onChange={setLevelWhyTake} rows={2} />
          <Textarea label="What you will learn" value={levelWhatLearn} onChange={setLevelWhatLearn} rows={2} />
          <Input label="Level marketing video URL" value={levelVideoUrl} onChange={setLevelVideoUrl} />
          <Button onClick={() => createLevel.mutate()} disabled={!levelName.trim() || createLevel.isPending}>
            Add level
          </Button>
          <DataList
            items={levels.data ?? []}
            render={(l) => (
              <ListRow aside={<Button variant="danger" onClick={() => deleteLevel.mutate(l.id)}>Delete</Button>}>
                <button
                  type="button"
                  className="ed-link-button"
                  onClick={() => {
                    setSelectedLevelId(l.id);
                    setSelectedModuleId("");
                    const topics = Array.isArray(l.topics_covered) ? (l.topics_covered as string[]).join(", ") : "";
                    setLevelAbacusCode(l.abacus_level_code ?? "");
                    setLevelTopics(topics);
                    setLevelWhyTake(l.why_take ?? "");
                    setLevelWhatLearn(l.what_you_learn ?? "");
                    setLevelVideoUrl(l.marketing_video_url ?? "");
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
            <Button variant="ghost" onClick={() => updateLevelDetails.mutate(selectedLevelId)} disabled={updateLevelDetails.isPending}>
              Save level details
            </Button>
          )}
        </Card>
      )}

      {selectedLevelId && (
        <Card title="Modules">
          <Input label="Module title" value={moduleTitle} onChange={setModuleTitle} />
          <Button onClick={() => createModule.mutate()} disabled={!moduleTitle.trim() || createModule.isPending}>
            Add module
          </Button>
          <DataList
            items={modules.data ?? []}
            render={(m) => (
              <ListRow aside={<Button variant="danger" onClick={() => deleteModule.mutate(m.id)}>Delete</Button>}>
                <button
                  type="button"
                  className="ed-link-button"
                  onClick={() => setSelectedModuleId(m.id)}
                >
                  {m.title}
                  {selectedModuleId === m.id && <Badge tone="success"> Selected</Badge>}
                </button>
              </ListRow>
            )}
          />
        </Card>
      )}

      {selectedModuleId && (
        <Card title="Lessons">
          <Input label="Lesson title" value={lessonTitle} onChange={setLessonTitle} />
          <Input label="Duration (minutes)" value={lessonDuration} onChange={setLessonDuration} />
          <Button onClick={() => createLesson.mutate()} disabled={!lessonTitle.trim() || createLesson.isPending}>
            Add lesson
          </Button>
          <DataList
            items={lessons.data ?? []}
            render={(l) => (
              <ListRow aside={<Button variant="danger" onClick={() => deleteLesson.mutate(l.id)}>Delete</Button>}>
                <span>
                  {l.title}
                  {l.duration_minutes != null && <small className="ed-muted"> · {l.duration_minutes} min</small>}
                </span>
              </ListRow>
            )}
          />
        </Card>
      )}
      </PageGrid>
    </>
  );
}
