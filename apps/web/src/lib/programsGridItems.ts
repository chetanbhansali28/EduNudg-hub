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

/** Homepage cards take precedence; otherwise fall back to published brand curriculum. */
export function resolveProgramsGridItems(
  programsSection: HomepageProgramsSection | undefined,
  curriculum: PublicCurriculumProgram[]
): ProgramsGridDisplayItem[] {
  const cards = programsSection?.cards ?? [];
  const namedCards = cards.filter((c) => c.name.trim().length > 0);
  if (namedCards.length > 0) {
    return namedCards.map(cardToDisplay);
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
