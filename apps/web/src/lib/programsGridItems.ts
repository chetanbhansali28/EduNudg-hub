import type { HomepageProgramCard, HomepageProgramsSection } from "@/types/homepage";
import {
  programMarketingBenefits,
  type PublicCurriculumProgram,
} from "@/lib/brandCurriculumPublic";

export type ProgramsGridDisplayItem = {
  id: string;
  name: string;
  description: string | null;
  intro: string | null;
  ageLabel: string | null;
  imageUrl: string | null;
  benefits: string[];
  scholarshipHighlight: string | null;
};

function cardToDisplay(card: HomepageProgramCard): ProgramsGridDisplayItem {
  const benefits = (card.benefits ?? []).map((b) => b.trim()).filter(Boolean);
  return {
    id: card.id,
    name: card.name,
    description: card.description?.trim() || null,
    intro: card.intro?.trim() || null,
    ageLabel: card.ageLabel?.trim() || null,
    imageUrl: card.imageUrl?.trim() || null,
    benefits,
    scholarshipHighlight: card.scholarshipHighlight?.trim() || null,
  };
}

function curriculumToDisplay(program: PublicCurriculumProgram, index: number): ProgramsGridDisplayItem {
  return {
    id: `curriculum-${program.name}-${index}`,
    name: program.name,
    description: program.description?.trim() || program.whyTake?.trim() || null,
    intro: program.whyTake?.trim() || null,
    ageLabel: program.ageLabel?.trim() || null,
    imageUrl: program.marketingImageUrl?.trim() || null,
    benefits: programMarketingBenefits(program),
    scholarshipHighlight: program.scholarshipHighlight?.trim() || null,
  };
}

/** Keep Center sites program cards that match enabled curriculum names (case-insensitive).
 *  Empty kept-cards falls through to `resolveProgramsGridItems` curriculum list.
 */
export function restrictProgramsSectionToEnabledCurriculum(
  section: HomepageProgramsSection | undefined,
  curriculum: PublicCurriculumProgram[]
): HomepageProgramsSection | undefined {
  if (!section) return section;
  const enabledNames = new Set(
    curriculum.map((program) => program.name.trim().toLowerCase()).filter(Boolean)
  );
  const namedCards = (section.cards ?? []).filter((card) => card.name.trim().length > 0);
  const kept = namedCards.filter((card) => enabledNames.has(card.name.trim().toLowerCase()));
  return { ...section, cards: kept };
}

/** Homepage cards take precedence; otherwise fall back to published curriculum.
 *  When a homepage card has no image, fill from a curriculum program with the same name.
 */
export function resolveProgramsGridItems(
  programsSection: HomepageProgramsSection | undefined,
  curriculum: PublicCurriculumProgram[]
): ProgramsGridDisplayItem[] {
  const cards = programsSection?.cards ?? [];
  const namedCards = cards.filter((c) => c.name.trim().length > 0);
  if (namedCards.length > 0) {
    return namedCards.map((card) => {
      const display = cardToDisplay(card);
      if (display.imageUrl) return display;
      const match = curriculum.find(
        (program) => program.name.trim().toLowerCase() === card.name.trim().toLowerCase()
      );
      const curriculumImage = match?.marketingImageUrl?.trim() || null;
      return curriculumImage ? { ...display, imageUrl: curriculumImage } : display;
    });
  }
  return curriculum.map(curriculumToDisplay);
}

let nextProgramCardId = 0;

export function emptyHomepageProgramCard(id?: string): HomepageProgramCard {
  nextProgramCardId += 1;
  return {
    id: id ?? `program-card-${nextProgramCardId}`,
    name: "",
    description: "",
    intro: "",
    ageLabel: "",
    imageUrl: "",
    benefits: [],
    scholarshipHighlight: "",
  };
}

export function programsGridHasContent(
  programsSection: HomepageProgramsSection | undefined,
  curriculum: PublicCurriculumProgram[]
): boolean {
  return resolveProgramsGridItems(programsSection, curriculum).length > 0;
}

/** Map grid display items to public curriculum shape for Spark courses section. */
export function programsGridToPublicPrograms(
  programsSection: HomepageProgramsSection | undefined,
  curriculum: PublicCurriculumProgram[]
): PublicCurriculumProgram[] {
  return resolveProgramsGridItems(programsSection, curriculum).map((item) => ({
    name: item.name,
    description: item.description,
    whyTake: item.intro,
    whatYouLearn: item.benefits.length > 0 ? item.benefits.join("\n") : null,
    marketingVideoUrl: null,
    marketingImageUrl: item.imageUrl,
    ageLabel: item.ageLabel,
    marketingBenefits: item.benefits,
    scholarshipHighlight: item.scholarshipHighlight,
    versionNumber: 1,
    levels: [],
  }));
}

/** Spark “Courses designed for success” prefers published Curriculum syllabus.
 *  Homepage program cards are a fallback when no published courses exist.
 *  Matching card images fill in only when a syllabus course has no banner.
 */
export function resolveSparkCoursePrograms(
  programsSection: HomepageProgramsSection | undefined,
  curriculum: PublicCurriculumProgram[]
): PublicCurriculumProgram[] {
  if (curriculum.length === 0) {
    return programsGridToPublicPrograms(programsSection, curriculum);
  }

  const cards = programsSection?.cards ?? [];
  return curriculum.map((program) => {
    if (program.marketingImageUrl?.trim()) return program;
    const match = cards.find(
      (card) => card.name.trim().toLowerCase() === program.name.trim().toLowerCase()
    );
    const cardImage = match?.imageUrl?.trim();
    return cardImage ? { ...program, marketingImageUrl: cardImage } : program;
  });
}
