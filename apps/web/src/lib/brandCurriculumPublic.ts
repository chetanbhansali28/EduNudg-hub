export type PublicCurriculumLesson = {
  title: string;
  durationMinutes: number | null;
  contentType: string | null;
};

export type PublicCurriculumModule = {
  title: string;
  lessons: PublicCurriculumLesson[];
};

export type PublicCurriculumLevel = {
  name: string;
  levelCode: string | null;
  topicsCovered: string[];
  whyTake: string | null;
  whatYouLearn: string | null;
  marketingVideoUrl: string | null;
  modules: PublicCurriculumModule[];
};

export type PublicCurriculumProgram = {
  name: string;
  description: string | null;
  whyTake: string | null;
  whatYouLearn: string | null;
  marketingVideoUrl: string | null;
  marketingImageUrl: string | null;
  ageLabel: string | null;
  marketingBenefits: string[];
  scholarshipHighlight: string | null;
  versionNumber: number;
  levels: PublicCurriculumLevel[];
};

function parseTopics(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
}

function parseBenefits(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
}

function parseLesson(raw: unknown): PublicCurriculumLesson | null {
  if (typeof raw !== "object" || raw === null) return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.title !== "string") return null;
  return {
    title: row.title,
    durationMinutes: typeof row.duration_minutes === "number" ? row.duration_minutes : null,
    contentType: typeof row.content_type === "string" ? row.content_type : null,
  };
}

function parseModule(raw: unknown): PublicCurriculumModule | null {
  if (typeof raw !== "object" || raw === null) return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.title !== "string") return null;
  const lessonsRaw = Array.isArray(row.lessons) ? row.lessons : [];
  return {
    title: row.title,
    lessons: lessonsRaw.map(parseLesson).filter((l): l is PublicCurriculumLesson => l !== null),
  };
}

function parseLevel(raw: unknown): PublicCurriculumLevel | null {
  if (typeof raw !== "object" || raw === null) return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.name !== "string") return null;
  const modulesRaw = Array.isArray(row.modules) ? row.modules : [];
  return {
    name: row.name,
    levelCode: typeof row.level_code === "string" ? row.level_code : null,
    topicsCovered: parseTopics(row.topics_covered),
    whyTake: typeof row.why_take === "string" ? row.why_take : null,
    whatYouLearn: typeof row.what_you_learn === "string" ? row.what_you_learn : null,
    marketingVideoUrl: typeof row.marketing_video_url === "string" ? row.marketing_video_url : null,
    modules: modulesRaw.map(parseModule).filter((m): m is PublicCurriculumModule => m !== null),
  };
}

function parseProgram(raw: unknown): PublicCurriculumProgram | null {
  if (typeof raw !== "object" || raw === null) return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.name !== "string") return null;
  const versionNumber = typeof row.version_number === "number" ? row.version_number : 0;
  const levelsRaw = Array.isArray(row.levels) ? row.levels : [];
  const levels = levelsRaw.map(parseLevel).filter((l): l is PublicCurriculumLevel => l !== null);
  return {
    name: row.name,
    description: typeof row.description === "string" ? row.description : null,
    whyTake: typeof row.why_take === "string" ? row.why_take : null,
    whatYouLearn: typeof row.what_you_learn === "string" ? row.what_you_learn : null,
    marketingVideoUrl: typeof row.marketing_video_url === "string" ? row.marketing_video_url : null,
    marketingImageUrl: typeof row.marketing_image_url === "string" ? row.marketing_image_url : null,
    ageLabel: typeof row.age_label === "string" ? row.age_label : null,
    marketingBenefits: parseBenefits(row.marketing_benefits),
    scholarshipHighlight: typeof row.scholarship_highlight === "string" ? row.scholarship_highlight : null,
    versionNumber,
    levels,
  };
}

/** Benefit bullets for program detail modal — dedicated list first, then legacy fallback. */
export function programMarketingBenefits(program: PublicCurriculumProgram): string[] {
  if (program.marketingBenefits.length > 0) return program.marketingBenefits;
  if (!program.whatYouLearn) return [];
  return program.whatYouLearn
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

export function parsePublicCurriculum(raw: unknown): PublicCurriculumProgram[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(parseProgram).filter((p): p is PublicCurriculumProgram => p !== null);
}

const PUBLIC_CURRICULUM_PROGRAM_DEFAULTS: Omit<PublicCurriculumProgram, "name"> = {
  description: null,
  whyTake: null,
  whatYouLearn: null,
  marketingVideoUrl: null,
  marketingImageUrl: null,
  ageLabel: null,
  marketingBenefits: [],
  scholarshipHighlight: null,
  versionNumber: 1,
  levels: [],
};

/** Build a typed program fixture (tests, story data). */
export function createPublicCurriculumProgram(
  overrides: Partial<PublicCurriculumProgram> & Pick<PublicCurriculumProgram, "name">
): PublicCurriculumProgram {
  return { ...PUBLIC_CURRICULUM_PROGRAM_DEFAULTS, ...overrides };
}
