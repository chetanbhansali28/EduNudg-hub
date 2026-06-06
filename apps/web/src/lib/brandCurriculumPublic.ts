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
  versionNumber: number;
  levels: PublicCurriculumLevel[];
};

function parseTopics(raw: unknown): string[] {
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
    versionNumber,
    levels,
  };
}

export function parsePublicCurriculum(raw: unknown): PublicCurriculumProgram[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(parseProgram).filter((p): p is PublicCurriculumProgram => p !== null);
}
