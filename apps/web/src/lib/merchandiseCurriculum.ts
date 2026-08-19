/** Curriculum links for merchandise catalog SKUs. */

export type CatalogCurriculumLink = {
  programId: string;
  levelId: string | null;
};

export type BrandProgramOption = {
  id: string;
  name: string;
  levels: { id: string; name: string; sortOrder: number }[];
};

export function curriculumLinkKey(link: CatalogCurriculumLink): string {
  return `${link.programId}::${link.levelId ?? ""}`;
}

export function uniqueProgramIds(links: CatalogCurriculumLink[]): string[] {
  return [...new Set(links.map((link) => link.programId))];
}

export function catalogVisibleToCenter(programIds: string[], enabledProgramIds: string[]): boolean {
  if (programIds.length === 0) return false;
  const enabled = new Set(enabledProgramIds);
  return programIds.some((id) => enabled.has(id));
}

export function filterCatalogForCenter<T extends { programIds: string[] }>(
  items: T[],
  enabledProgramIds: string[]
): T[] {
  return items.filter((item) => catalogVisibleToCenter(item.programIds, enabledProgramIds));
}

export function catalogCurriculumLabel(programNames: string[]): string {
  const names = programNames.map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) return "Not tied to curriculum — hidden from franchise shops";
  if (names.length === 1) return `Curriculum: ${names[0]}`;
  return `Curriculum: ${names.join(", ")}`;
}

export function catalogLinkDisplayName(programName: string, levelName: string | null | undefined): string {
  const course = programName.trim() || "Curriculum";
  const level = levelName?.trim();
  return level ? `${course} · ${level}` : course;
}

export function uniqueTrimmedNames(values: string[]): string[] {
  const names: string[] = [];
  for (const value of values) {
    const next = value.trim();
    if (!next || names.includes(next)) continue;
    names.push(next);
  }
  return names;
}

/** Center shop/inventory copy: course as Curriculum, level (or course) as Program. */
export function formatCenterSkuCurriculum(
  courseNames: string[] | null | undefined,
  levelNames: string[] | null | undefined
): { curriculum: string | null; program: string | null } {
  const courses = uniqueTrimmedNames(courseNames ?? []);
  const levels = uniqueTrimmedNames(levelNames ?? []);
  if (courses.length === 0 && levels.length === 0) return { curriculum: null, program: null };
  return {
    curriculum: courses.length > 0 ? courses.join(", ") : null,
    program: (levels.length > 0 ? levels : courses).join(", ") || null,
  };
}

export function catalogHasCurriculum(programIds: string[]): boolean {
  return programIds.length > 0;
}

export function catalogFormNeedsCurriculum(isActive: boolean, links: CatalogCurriculumLink[]): boolean {
  return isActive && links.length === 0;
}

export function isProgramFullySelected(links: CatalogCurriculumLink[], program: BrandProgramOption): boolean {
  if (links.some((link) => link.programId === program.id && link.levelId === null)) return true;
  if (program.levels.length === 0) return false;
  return program.levels.every((level) =>
    links.some((link) => link.programId === program.id && link.levelId === level.id)
  );
}

export function isProgramPartiallySelected(links: CatalogCurriculumLink[], programId: string): boolean {
  return links.some((link) => link.programId === programId);
}

export function isLevelSelected(links: CatalogCurriculumLink[], programId: string, levelId: string): boolean {
  return links.some((link) => link.programId === programId && link.levelId === levelId);
}

export function toggleProgramSelection(
  links: CatalogCurriculumLink[],
  program: BrandProgramOption
): CatalogCurriculumLink[] {
  const withoutProgram = links.filter((link) => link.programId !== program.id);
  if (isProgramFullySelected(links, program)) return withoutProgram;
  if (program.levels.length === 0) {
    return [...withoutProgram, { programId: program.id, levelId: null }];
  }
  return [
    ...withoutProgram,
    ...program.levels.map((level) => ({ programId: program.id, levelId: level.id })),
  ];
}

export function toggleLevelSelection(
  links: CatalogCurriculumLink[],
  programId: string,
  levelId: string
): CatalogCurriculumLink[] {
  if (isLevelSelected(links, programId, levelId)) {
    return links.filter((link) => !(link.programId === programId && link.levelId === levelId));
  }
  const withoutWholeProgram = links.filter(
    (link) => !(link.programId === programId && link.levelId === null)
  );
  return [...withoutWholeProgram, { programId, levelId }];
}

export function toSyncCurriculumLinks(links: CatalogCurriculumLink[]): { program_id: string; level_id: string | null }[] {
  const seen = new Set<string>();
  const next: { program_id: string; level_id: string | null }[] = [];
  for (const link of links) {
    const key = curriculumLinkKey(link);
    if (seen.has(key)) continue;
    seen.add(key);
    next.push({ program_id: link.programId, level_id: link.levelId });
  }
  return next;
}
