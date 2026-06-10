import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  FormActions,
  FormGrid,
  Input,
  ListRow,
  MutationError,
  PageTitle,
  SaveButton,
  Select,
  Textarea,
} from "@edunudg/ui";
import {
  archiveProgram,
  createLevel,
  createProgram,
  deleteLevel,
  fetchLevels,
  fetchPrograms,
  fetchVersions,
  updateLevel,
  updateProgram,
  type CurriculumLevel,
  type CurriculumProgram,
  type ProgramMarketingInput,
} from "@/lib/curriculumApi";
import { parseTopicsComma, pickWorkingVersion, topicsToString } from "@/lib/curriculumHelpers";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { DeleteConfirmButton } from "@/features/shared/DeleteConfirmButton";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import { MarketingMediaField } from "@/features/marketing/MarketingMediaField";

const EMPTY_PROGRAM_FORM: ProgramMarketingInput = {
  name: "",
  description: "",
  whyTake: "",
  whatYouLearn: "",
  videoUrl: "",
  ageLabel: "",
  marketingImageUrl: "",
  benefits: [],
  scholarshipHighlight: "",
};

function parseProgramBenefits(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string");
}

function programToForm(program: CurriculumProgram): ProgramMarketingInput {
  return {
    name: program.name,
    description: program.description ?? "",
    whyTake: program.why_take ?? "",
    whatYouLearn: program.what_you_learn ?? "",
    videoUrl: program.marketing_video_url ?? "",
    ageLabel: program.age_label ?? "",
    marketingImageUrl: program.marketing_image_url ?? "",
    benefits: parseProgramBenefits(program.marketing_benefits),
    scholarshipHighlight: program.scholarship_highlight ?? "",
  };
}

const EMPTY_LEVEL_FORM = {
  name: "",
  code: "",
  topics: "",
  whyTake: "",
  whatYouLearn: "",
  videoUrl: "",
};

interface CurriculumWorkspaceProps {
  brandId: string;
}

export function CurriculumWorkspace({ brandId }: CurriculumWorkspaceProps) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const programCloser = useAddFormCloser();
  const levelCloser = useAddFormCloser();

  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [expandedLevelId, setExpandedLevelId] = useState<string | null>(null);

  const [addProgram, setAddProgram] = useState(EMPTY_PROGRAM_FORM);
  const [editProgram, setEditProgram] = useState(EMPTY_PROGRAM_FORM);
  const [addLevel, setAddLevel] = useState(EMPTY_LEVEL_FORM);
  const [editLevel, setEditLevel] = useState(EMPTY_LEVEL_FORM);

  const programs = useQuery({
    queryKey: ["programs", brandId],
    queryFn: () => fetchPrograms(brandId),
  });

  const versions = useQuery({
    queryKey: ["curriculum-versions", brandId, selectedProgramId],
    enabled: !!selectedProgramId,
    queryFn: () => fetchVersions(brandId, selectedProgramId),
  });

  const workingVersion = useMemo(
    () => pickWorkingVersion(versions.data ?? []),
    [versions.data],
  );

  const levels = useQuery({
    queryKey: ["levels", workingVersion?.id],
    enabled: !!workingVersion?.id,
    queryFn: () => fetchLevels(workingVersion!.id),
  });

  const selectedProgram = (programs.data ?? []).find((p) => p.id === selectedProgramId);

  useEffect(() => {
    const list = programs.data;
    if (!selectedProgramId && list?.length) {
      setSelectedProgramId(list[0].id);
    }
  }, [programs.data, selectedProgramId]);

  useEffect(() => {
    setExpandedLevelId(null);
  }, [selectedProgramId, workingVersion?.id]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["programs", brandId] });
    qc.invalidateQueries({ queryKey: ["curriculum-versions", brandId, selectedProgramId] });
    if (workingVersion?.id) qc.invalidateQueries({ queryKey: ["levels", workingVersion.id] });
  };

  const createProgramMutation = useMutation({
    mutationFn: () => createProgram(brandId, addProgram),
    onSuccess: () => {
      clear();
      invalidateAll();
      setAddProgram(EMPTY_PROGRAM_FORM);
      programCloser.closeAddForm();
    },
    onError: capture,
  });

  const updateProgramMutation = useMutation({
    mutationFn: (id: string) => updateProgram(id, editProgram),
    onSuccess: () => {
      clear();
      invalidateAll();
      setEditingProgramId(null);
    },
    onError: capture,
  });

  const archiveProgramMutation = useMutation({
    mutationFn: archiveProgram,
    onSuccess: () => {
      clear();
      invalidateAll();
      setSelectedProgramId("");
    },
    onError: capture,
  });

  const createLevelMutation = useMutation({
    mutationFn: async () => {
      if (!workingVersion) throw new Error("Select a program first");
      const order = (levels.data?.length ?? 0) + 1;
      await createLevel(brandId, workingVersion.id, {
        name: addLevel.name,
        code: addLevel.code,
        topics: parseTopicsComma(addLevel.topics),
        whyTake: addLevel.whyTake,
        whatYouLearn: addLevel.whatYouLearn,
        videoUrl: addLevel.videoUrl,
      }, order);
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
    mutationFn: deleteLevel,
    onSuccess: () => {
      clear();
      invalidateAll();
      setExpandedLevelId(null);
    },
    onError: capture,
  });

  const programOptions = (programs.data ?? []).map((p) => ({ value: p.id, label: p.name }));

  const loadLevelIntoEdit = (level: CurriculumLevel) => {
    setEditLevel({
      name: level.name,
      code: level.abacus_level_code ?? "",
      topics: topicsToString(level.topics_covered),
      whyTake: level.why_take ?? "",
      whatYouLearn: level.what_you_learn ?? "",
      videoUrl: level.marketing_video_url ?? "",
    });
  };

  return (
    <>
      <PageTitle>Curriculum</PageTitle>
      <MutationError message={error} />

      <p className="ed-text-sm ed-muted ed-curriculum-intro">
        Manage your program and levels — the content parents see on your website and centers use to describe
        what you teach.
      </p>

      <Card title="Program">
        <Select
          label="Active program"
          value={selectedProgramId}
          onChange={setSelectedProgramId}
          options={programOptions}
          placeholder="Select a program"
          editable
        />

        <AddFormSection
          buttonLabel="Add program"
          panelTitle="Add program"
          actionsPlacement="footer"
          primaryAction={{
            label: "Add program",
            onClick: () => createProgramMutation.mutate(),
            pending: createProgramMutation.isPending,
            disabled: !addProgram.name.trim(),
          }}
        >
          {({ close }) => {
            programCloser.bindClose(close);
            return <ProgramFields brandId={brandId} value={addProgram} onChange={setAddProgram} />;
          }}
        </AddFormSection>

        {selectedProgram && editingProgramId === selectedProgram.id ? (
          <div className="ed-editable-form">
            <ProgramFields brandId={brandId} value={editProgram} onChange={setEditProgram} />
            <FormActions>
              <SaveButton
                onClick={() => updateProgramMutation.mutate(selectedProgram.id)}
                pending={updateProgramMutation.isPending}
                disabled={!editProgram.name.trim()}
              />
              <Button variant="ghost" onClick={() => setEditingProgramId(null)}>
                Cancel
              </Button>
            </FormActions>
          </div>
        ) : selectedProgram ? (
          <div className="ed-curriculum-program-summary">
            <div>
              <strong>{selectedProgram.name}</strong>
              {selectedProgram.description && (
                <p className="ed-text-sm ed-muted">{selectedProgram.description}</p>
              )}
            </div>
            <CrudRowActions
              editing={false}
              onEdit={() => {
                setEditingProgramId(selectedProgram.id);
                setEditProgram(programToForm(selectedProgram));
              }}
              onSave={() => updateProgramMutation.mutate(selectedProgram.id)}
              onCancel={() => setEditingProgramId(null)}
              onDelete={() => archiveProgramMutation.mutate(selectedProgram.id)}
              deleteTitle="Archive this program?"
              deleteDescription="The program will be archived and hidden from your website."
              saveDisabled
            />
          </div>
        ) : null}
      </Card>

      {selectedProgramId && workingVersion && (
        <CourseOutlineSection
          program={selectedProgram}
          levels={levels.data ?? []}
          addLevel={addLevel}
          setAddLevel={setAddLevel}
          editLevel={editLevel}
          setEditLevel={setEditLevel}
          expandedLevelId={expandedLevelId}
          onExpandLevel={(id, level) => {
            setExpandedLevelId(id);
            loadLevelIntoEdit(level);
          }}
          onCollapseLevel={() => setExpandedLevelId(null)}
          onCreateLevel={() => createLevelMutation.mutate()}
          createLevelPending={createLevelMutation.isPending}
          onUpdateLevel={(id) => updateLevelMutation.mutate(id)}
          updateLevelPending={updateLevelMutation.isPending}
          onDeleteLevel={(id) => deleteLevelMutation.mutate(id)}
          levelCloser={levelCloser}
        />
      )}
    </>
  );
}

function ProgramFields({
  brandId,
  value,
  onChange,
}: {
  brandId: string;
  value: ProgramMarketingInput;
  onChange: (v: ProgramMarketingInput) => void;
}) {
  const uploadScope = { kind: "brand" as const, brandId };

  const updateBenefit = (index: number, text: string) => {
    const benefits = [...value.benefits];
    benefits[index] = text;
    onChange({ ...value, benefits });
  };

  return (
    <div className="ed-editable-form">
      <FormGrid columns={2}>
        <Input
          label="Program name"
          value={value.name}
          onChange={(name) => onChange({ ...value, name })}
          editable
        />
        <Input
          label="Age / grade badge"
          value={value.ageLabel}
          onChange={(ageLabel) => onChange({ ...value, ageLabel })}
          placeholder="Age 6–14"
          editable
        />
      </FormGrid>
      <MarketingMediaField
        label="Card image"
        value={value.marketingImageUrl}
        onChange={(marketingImageUrl) => onChange({ ...value, marketingImageUrl })}
        mediaType="image"
        uploadSubdir="program-marketing"
        uploadScope={uploadScope}
      />
      <Textarea
        label="Short description (card blurb)"
        value={value.description}
        onChange={(description) => onChange({ ...value, description })}
        rows={3}
        editable
      />
      <p className="ed-text-sm ed-muted">Benefits appear as bullet points in the public &quot;Know More&quot; popup.</p>
      {value.benefits.map((benefit, index) => (
        <div key={`benefit-${index}`} className="ed-form-section">
          <Input
            label={`Benefit ${index + 1}`}
            value={benefit}
            onChange={(v) => updateBenefit(index, v)}
            editable
          />
          <Button
            variant="ghost"
            onClick={() =>
              onChange({ ...value, benefits: value.benefits.filter((_, idx) => idx !== index) })
            }
          >
            Remove benefit
          </Button>
        </div>
      ))}
      <Button variant="ghost" onClick={() => onChange({ ...value, benefits: [...value.benefits, ""] })}>
        Add benefit
      </Button>
      <Input
        label="Scholarship highlight (optional)"
        value={value.scholarshipHighlight}
        onChange={(scholarshipHighlight) => onChange({ ...value, scholarshipHighlight })}
        placeholder="1 Lakh Success Scholarship!"
        editable
      />
      <FormGrid columns={2}>
        <Input
          label="Overview video"
          value={value.videoUrl}
          onChange={(videoUrl) => onChange({ ...value, videoUrl })}
          placeholder="https://…"
          editable
        />
        <Textarea
          label="Why parents choose this"
          value={value.whyTake}
          onChange={(whyTake) => onChange({ ...value, whyTake })}
          rows={3}
          editable
        />
      </FormGrid>
      <Textarea
        label="Skills and outcomes (legacy fallback)"
        value={value.whatYouLearn}
        onChange={(whatYouLearn) => onChange({ ...value, whatYouLearn })}
        rows={3}
        editable
      />
    </div>
  );
}

function CourseOutlineSection({
  program,
  levels,
  addLevel,
  setAddLevel,
  editLevel,
  setEditLevel,
  expandedLevelId,
  onExpandLevel,
  onCollapseLevel,
  onCreateLevel,
  createLevelPending,
  onUpdateLevel,
  updateLevelPending,
  onDeleteLevel,
  levelCloser,
}: {
  program?: CurriculumProgram;
  levels: CurriculumLevel[];
  addLevel: typeof EMPTY_LEVEL_FORM;
  setAddLevel: (v: typeof EMPTY_LEVEL_FORM) => void;
  editLevel: typeof EMPTY_LEVEL_FORM;
  setEditLevel: (v: typeof EMPTY_LEVEL_FORM) => void;
  expandedLevelId: string | null;
  onExpandLevel: (id: string, level: CurriculumLevel) => void;
  onCollapseLevel: () => void;
  onCreateLevel: () => void;
  createLevelPending: boolean;
  onUpdateLevel: (id: string) => void;
  updateLevelPending: boolean;
  onDeleteLevel: (id: string) => void;
  levelCloser: ReturnType<typeof useAddFormCloser>;
}) {
  return (
    <>
      <h3 className="ed-curriculum-section-title">Course outline</h3>

      {program && (
        <Card title="Program overview">
          <p className="ed-text-sm ed-muted">
            This copy appears at the top of the curriculum section on your public website.
          </p>
          <dl className="ed-curriculum-preview-fields">
            {program.why_take && (
              <>
                <dt>Why parents choose this</dt>
                <dd>{program.why_take}</dd>
              </>
            )}
            {program.what_you_learn && (
              <>
                <dt>Skills and outcomes</dt>
                <dd>{program.what_you_learn}</dd>
              </>
            )}
          </dl>
          <p className="ed-text-sm ed-muted">Use Edit on the program card above to change this content.</p>
        </Card>
      )}

      <Card title="Levels">
        <p className="ed-text-sm ed-muted">
          Each level can have its own marketing copy and topics shown to parents on your website.
        </p>
        <AddFormSection
          buttonLabel="Add level"
          panelTitle="Add level"
          actionsPlacement="footer"
          primaryAction={{
            label: "Add level",
            onClick: onCreateLevel,
            pending: createLevelPending,
            disabled: !addLevel.name.trim(),
          }}
        >
          {({ close }) => {
            levelCloser.bindClose(close);
            return <LevelMarketingFields value={addLevel} onChange={setAddLevel} />;
          }}
        </AddFormSection>

        <DataList
          items={levels}
          empty="No levels yet — add your first level (e.g. Level 1 · L1)."
          render={(level) => {
            const expanded = expandedLevelId === level.id;
            return (
              <ListRow
                className={expanded ? "ed-list-row--edit-full" : undefined}
                aside={
                  expanded ? (
                    <DeleteConfirmButton
                      onConfirm={() => onDeleteLevel(level.id)}
                      description="This removes the level and all content under it."
                    />
                  ) : undefined
                }
              >
                {expanded ? (
                  <div className="ed-editable-form">
                    <LevelMarketingFields value={editLevel} onChange={setEditLevel} />
                    <FormActions>
                      <SaveButton
                        onClick={() => onUpdateLevel(level.id)}
                        pending={updateLevelPending}
                        disabled={!editLevel.name.trim()}
                      />
                      <Button variant="ghost" onClick={onCollapseLevel}>
                        Close
                      </Button>
                    </FormActions>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="ed-link-button ed-curriculum-level-row"
                    onClick={() => onExpandLevel(level.id, level)}
                  >
                    <strong>{level.name}</strong>
                    {level.abacus_level_code && <Badge>{level.abacus_level_code}</Badge>}
                  </button>
                )}
              </ListRow>
            );
          }}
        />
      </Card>
    </>
  );
}

function LevelMarketingFields({
  value,
  onChange,
}: {
  value: typeof EMPTY_LEVEL_FORM;
  onChange: (v: typeof EMPTY_LEVEL_FORM) => void;
}) {
  return (
    <div className="ed-editable-form">
      <FormGrid columns={3}>
        <Input
          label="Level name"
          value={value.name}
          onChange={(name) => onChange({ ...value, name })}
          placeholder="Level 1 — Foundations"
          editable
        />
        <Input
          label="Level code"
          value={value.code}
          onChange={(code) => onChange({ ...value, code })}
          placeholder="L1"
          editable
        />
        <Input
          label="Topics in this level"
          value={value.topics}
          onChange={(topics) => onChange({ ...value, topics })}
          placeholder="Finger basics, Small friends, …"
          editable
        />
      </FormGrid>
      <FormGrid columns={2}>
        <Textarea
          label="Why this level"
          value={value.whyTake}
          onChange={(whyTake) => onChange({ ...value, whyTake })}
          rows={3}
          editable
        />
        <Textarea
          label="Skills and outcomes"
          value={value.whatYouLearn}
          onChange={(whatYouLearn) => onChange({ ...value, whatYouLearn })}
          rows={3}
          editable
        />
      </FormGrid>
      <Input
        label="Overview video"
        value={value.videoUrl}
        onChange={(videoUrl) => onChange({ ...value, videoUrl })}
        editable
      />
    </div>
  );
}
