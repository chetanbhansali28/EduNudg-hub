import { slugifyBrandName } from "@/lib/brandSlug";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";

export const PUBLIC_COURSE_PATH_PREFIX = "/courses";

function programKey(program: PublicCurriculumProgram, index: number): string {
  return program.id?.trim() || `name:${program.name}:${index}`;
}

function baseSlug(name: string): string {
  return slugifyBrandName(name) || "course";
}

function collisionSuffix(program: PublicCurriculumProgram, index: number): string {
  const id = program.id?.replace(/-/g, "") ?? "";
  if (id.length >= 8) return id.slice(0, 8);
  return String(index + 1);
}

/** Unique `/courses/:slug` values for a catalog (name slug; id suffix on collisions). */
export function publicCourseSlugs(programs: PublicCurriculumProgram[]): Map<string, string> {
  const used = new Set<string>();
  const slugs = new Map<string, string>();

  programs.forEach((program, index) => {
    let slug = baseSlug(program.name);
    if (used.has(slug)) {
      slug = `${slug}-${collisionSuffix(program, index)}`.slice(0, 72);
    }
    used.add(slug);
    slugs.set(programKey(program, index), slug);
  });

  return slugs;
}

export function publicCourseSlug(program: PublicCurriculumProgram, catalog: PublicCurriculumProgram[]): string {
  const index = catalog.indexOf(program);
  const resolvedIndex = index >= 0 ? index : catalog.findIndex((item) => item.id && item.id === program.id);
  const key = programKey(program, resolvedIndex >= 0 ? resolvedIndex : 0);
  return publicCourseSlugs(catalog).get(key) ?? baseSlug(program.name);
}

export function publicCoursePath(program: PublicCurriculumProgram, catalog: PublicCurriculumProgram[]): string {
  return `${PUBLIC_COURSE_PATH_PREFIX}/${publicCourseSlug(program, catalog)}`;
}

export function findPublicCourse(
  programs: PublicCurriculumProgram[],
  slug: string
): PublicCurriculumProgram | undefined {
  const needle = slug.trim().toLowerCase();
  if (!needle) return undefined;
  const slugs = publicCourseSlugs(programs);
  return programs.find((program, index) => slugs.get(programKey(program, index)) === needle);
}

export function matchPublishedProgramByName(
  programs: PublicCurriculumProgram[],
  name: string
): PublicCurriculumProgram | undefined {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  return programs.find((program) => program.name.trim().toLowerCase() === needle);
}
