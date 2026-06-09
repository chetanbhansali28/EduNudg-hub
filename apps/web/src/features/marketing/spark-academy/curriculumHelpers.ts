import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";

export function countProgramLessons(program: PublicCurriculumProgram): number {
  return program.levels.reduce(
    (acc, level) => acc + level.modules.reduce((mAcc, mod) => mAcc + mod.lessons.length, 0),
    0
  );
}

export function programLessonLabel(program: PublicCurriculumProgram): string {
  const count = countProgramLessons(program);
  if (count === 0) {
    const levelCount = program.levels.length;
    return levelCount > 0 ? `${levelCount} level${levelCount === 1 ? "" : "s"}` : "Program";
  }
  return `${count} lesson${count === 1 ? "" : "s"}`;
}
