import { Button, FormGrid, Input, Textarea } from "@edunudg/ui";
import type { CurriculumProgram, ProgramMarketingInput } from "@/lib/curriculumApi";
import { MarketingMediaField } from "@/features/marketing/MarketingMediaField";

export const EMPTY_COURSE_FORM: ProgramMarketingInput = {
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

export const EMPTY_LEVEL_FORM = {
  name: "",
  code: "",
  topics: "",
  whyTake: "",
  whatYouLearn: "",
  videoUrl: "",
};

export type LevelForm = typeof EMPTY_LEVEL_FORM;

function parseProgramBenefits(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string");
}

export function courseToForm(program: CurriculumProgram): ProgramMarketingInput {
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

export function CourseFields({
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
          label="Course name"
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
      <p className="ed-text-sm ed-muted">Benefits appear as bullet points in the public Know More popup.</p>
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
        label="Skills and outcomes"
        value={value.whatYouLearn}
        onChange={(whatYouLearn) => onChange({ ...value, whatYouLearn })}
        rows={3}
        editable
      />
    </div>
  );
}

export function LevelMarketingFields({
  value,
  onChange,
}: {
  value: LevelForm;
  onChange: (v: LevelForm) => void;
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
