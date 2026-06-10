import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import {
  DEFAULT_UNITS_MODULE_TITLE,
  type CurriculumStatus,
  type CurriculumVersion,
} from "@/lib/curriculumHelpers";

export interface CurriculumProgram {
  id: string;
  name: string;
  description: string | null;
  why_take: string | null;
  what_you_learn: string | null;
  marketing_video_url: string | null;
  marketing_image_url: string | null;
  age_label: string | null;
  marketing_benefits: string[] | unknown;
  scholarship_highlight: string | null;
  is_active: boolean;
}

export interface CurriculumLevel {
  id: string;
  name: string;
  sort_order: number;
  abacus_level_code: string | null;
  topics_covered: string[] | unknown;
  why_take: string | null;
  what_you_learn: string | null;
  marketing_video_url: string | null;
}

export interface CurriculumModule {
  id: string;
  title: string;
  sort_order: number;
  level_id: string;
}

export interface CurriculumLesson {
  id: string;
  title: string;
  duration_minutes: number | null;
  sort_order: number;
  module_id: string;
}

export type CurriculumUnit = CurriculumLesson & { moduleTitle: string };

function client(): SupabaseClient {
  return getSupabase();
}

export async function fetchPrograms(brandId: string): Promise<CurriculumProgram[]> {
  const { data, error } = await client()
    .from("programs")
    .select(
      "id, name, description, why_take, what_you_learn, marketing_video_url, marketing_image_url, age_label, marketing_benefits, scholarship_highlight, is_active",
    )
    .eq("brand_id", brandId)
    .is("deleted_at", null)
    .order("name");
  return supabaseList(data, error) as CurriculumProgram[];
}

export async function fetchVersions(brandId: string, programId: string): Promise<CurriculumVersion[]> {
  const { data, error } = await client()
    .from("curriculum_versions")
    .select("id, program_id, version_number, status, published_at")
    .eq("brand_id", brandId)
    .eq("program_id", programId)
    .order("version_number", { ascending: false });
  return supabaseList(data, error) as CurriculumVersion[];
}

export async function fetchLevels(versionId: string): Promise<CurriculumLevel[]> {
  const { data, error } = await client()
    .from("levels")
    .select("id, name, sort_order, abacus_level_code, topics_covered, why_take, what_you_learn, marketing_video_url")
    .eq("curriculum_version_id", versionId)
    .order("sort_order");
  return supabaseList(data, error) as CurriculumLevel[];
}

export async function fetchModules(levelId: string): Promise<CurriculumModule[]> {
  const { data, error } = await client()
    .from("modules")
    .select("id, title, sort_order, level_id")
    .eq("level_id", levelId)
    .order("sort_order");
  return supabaseList(data, error) as CurriculumModule[];
}

export async function fetchLessons(moduleId: string): Promise<CurriculumLesson[]> {
  const { data, error } = await client()
    .from("lessons")
    .select("id, title, duration_minutes, sort_order, module_id")
    .eq("module_id", moduleId)
    .order("sort_order");
  return supabaseList(data, error) as CurriculumLesson[];
}

export async function fetchLevelUnits(levelId: string): Promise<CurriculumUnit[]> {
  const modules = await fetchModules(levelId);
  const units: CurriculumUnit[] = [];
  for (const mod of modules) {
    const lessons = await fetchLessons(mod.id);
    for (const lesson of lessons) {
      units.push({ ...lesson, moduleTitle: mod.title });
    }
  }
  return units.sort((a, b) => a.sort_order - b.sort_order);
}

export type ProgramMarketingInput = {
  name: string;
  description: string;
  whyTake: string;
  whatYouLearn: string;
  videoUrl: string;
  ageLabel: string;
  marketingImageUrl: string;
  benefits: string[];
  scholarshipHighlight: string;
};

function programRow(input: ProgramMarketingInput) {
  const benefits = input.benefits.map((b) => b.trim()).filter(Boolean);
  return {
    name: input.name.trim(),
    description: input.description.trim() || null,
    why_take: input.whyTake.trim() || null,
    what_you_learn: input.whatYouLearn.trim() || null,
    marketing_video_url: input.videoUrl.trim() || null,
    marketing_image_url: input.marketingImageUrl.trim() || null,
    age_label: input.ageLabel.trim() || null,
    marketing_benefits: benefits,
    scholarship_highlight: input.scholarshipHighlight.trim() || null,
  };
}

export async function createProgram(
  brandId: string,
  input: ProgramMarketingInput,
): Promise<string> {
  const { data: created, error } = await client()
    .from("programs")
    .insert({
      brand_id: brandId,
      ...programRow(input),
    })
    .select("id")
    .single();
  if (error || !created?.id) throw error ?? new Error("Program not created");

  const { error: versionErr } = await client().from("curriculum_versions").insert({
    brand_id: brandId,
    program_id: created.id,
    version_number: 1,
    status: "draft",
  });
  if (versionErr) throw versionErr;
  return created.id;
}

export async function updateProgram(id: string, input: ProgramMarketingInput): Promise<void> {
  const { error } = await client()
    .from("programs")
    .update(programRow(input))
    .eq("id", id);
  if (error) throw error;
}

export async function archiveProgram(id: string): Promise<void> {
  const { error } = await client()
    .from("programs")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function publishVersion(id: string): Promise<void> {
  const { error } = await client()
    .from("curriculum_versions")
    .update({ status: "published" as CurriculumStatus, published_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function unpublishVersion(id: string): Promise<void> {
  const { error } = await client()
    .from("curriculum_versions")
    .update({ status: "draft" as CurriculumStatus, published_at: null })
    .eq("id", id);
  if (error) throw error;
}

export async function createLevel(
  brandId: string,
  versionId: string,
  input: {
    name: string;
    code: string;
    topics: string[];
    whyTake: string;
    whatYouLearn: string;
    videoUrl: string;
  },
  sortOrder: number,
): Promise<void> {
  const { error } = await client().from("levels").insert({
    brand_id: brandId,
    curriculum_version_id: versionId,
    name: input.name.trim(),
    sort_order: sortOrder,
    abacus_level_code: input.code.trim() || null,
    topics_covered: input.topics,
    why_take: input.whyTake.trim() || null,
    what_you_learn: input.whatYouLearn.trim() || null,
    marketing_video_url: input.videoUrl.trim() || null,
  });
  if (error) throw error;
}

export async function updateLevel(
  id: string,
  input: {
    name: string;
    code: string;
    topics: string[];
    whyTake: string;
    whatYouLearn: string;
    videoUrl: string;
  },
): Promise<void> {
  const { error } = await client()
    .from("levels")
    .update({
      name: input.name.trim(),
      abacus_level_code: input.code.trim() || null,
      topics_covered: input.topics,
      why_take: input.whyTake.trim() || null,
      what_you_learn: input.whatYouLearn.trim() || null,
      marketing_video_url: input.videoUrl.trim() || null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteLevel(id: string): Promise<void> {
  const { error } = await client().from("levels").delete().eq("id", id);
  if (error) throw error;
}

export async function ensureUnitsModule(brandId: string, levelId: string): Promise<string> {
  const modules = await fetchModules(levelId);
  const existing = modules.find((m) => m.title === DEFAULT_UNITS_MODULE_TITLE) ?? modules[0];
  if (existing) return existing.id;

  const { data, error } = await client()
    .from("modules")
    .insert({
      brand_id: brandId,
      level_id: levelId,
      title: DEFAULT_UNITS_MODULE_TITLE,
      sort_order: 1,
    })
    .select("id")
    .single();
  if (error || !data?.id) throw error ?? new Error("Module not created");
  return data.id;
}

export async function createUnit(
  brandId: string,
  levelId: string,
  input: { title: string; durationMinutes: number | null },
  sortOrder: number,
): Promise<void> {
  const moduleId = await ensureUnitsModule(brandId, levelId);
  const { error } = await client().from("lessons").insert({
    brand_id: brandId,
    module_id: moduleId,
    title: input.title.trim(),
    sort_order: sortOrder,
    duration_minutes: input.durationMinutes,
    content_type: "article",
  });
  if (error) throw error;
}

export async function updateUnit(
  id: string,
  input: { title: string; durationMinutes: number | null },
): Promise<void> {
  const { error } = await client()
    .from("lessons")
    .update({
      title: input.title.trim(),
      duration_minutes: input.durationMinutes,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteUnit(id: string): Promise<void> {
  const { error } = await client().from("lessons").delete().eq("id", id);
  if (error) throw error;
}
