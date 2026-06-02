import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  Input,
  ListRow,
  MutationError,
  PageTitle,
  Select,
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
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [editProgram, setEditProgram] = useState({ name: "", description: "" });

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
        .select("id, name, description, is_active")
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
        .select("id, name, sort_order")
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
        .update({ name: editProgram.name.trim(), description: editProgram.description.trim() || null })
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
      const { error: mErr } = await getSupabase().from("levels").insert({
        brand_id: brandId,
        curriculum_version_id: selectedVersionId,
        name: levelName.trim(),
        sort_order: order,
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["levels", selectedVersionId] });
      setLevelName("");
    },
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

      <Card title="Programs">
        <Input label="Program name" value={programName} onChange={setProgramName} />
        <Input label="Description" value={programDesc} onChange={setProgramDesc} />
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
                      setEditProgram({ name: p.name, description: p.description ?? "" });
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
                    <Input label="Name" value={editProgram.name} onChange={(v) => setEditProgram((f) => ({ ...f, name: v }))} />
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
          <Input label="Level name" value={levelName} onChange={setLevelName} />
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
                  }}
                >
                  {l.name}
                  {selectedLevelId === l.id && <Badge tone="success"> Selected</Badge>}
                </button>
              </ListRow>
            )}
          />
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
    </>
  );
}
