import { describe, expect, it, beforeEach, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { mergeAbacusClassicLandingConfig } from "@/lib/brandLandingDefaults";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { AbacusClassicNav } from "./AbacusClassicNav";
import { AbacusClassicHero } from "./AbacusClassicHero";
import { AbacusClassicContent } from "./AbacusClassicContent";
import { ProgramsGridSection } from "./ProgramsMarqueeSection";
import { FeatureGridSection } from "./FeatureGridSection";
import { LeadModalProvider } from "./LeadModalContext";
import { AbacusCtaButton, MarketingLeadModals } from "./MarketingLeadModals";

function sampleProgram(name: string, description = "Program overview"): PublicCurriculumProgram {
  return {
    name,
    description,
    whyTake: null,
    whatYouLearn: null,
    marketingVideoUrl: null,
    marketingImageUrl: null,
    ageLabel: "Age 6–14",
    marketingBenefits: ["Kids become superfast in math"],
    scholarshipHighlight: null,
    versionNumber: 1,
    levels: [],
  };
}

function polyfillDialog() {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
}

function wrapWithLeadModal(ui: ReactNode) {
  return <LeadModalProvider>{ui}</LeadModalProvider>;
}

function renderWithLeadModals(ui: ReactNode, brandSlug = "smart-brain-abacus") {
  return render(
    <LeadModalProvider>
      {ui}
      <MarketingLeadModals brandSlug={brandSlug} />
    </LeadModalProvider>
  );
}

describe("Abacus Classic Sprint 2 — nav and hero CTAs", () => {
  const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");

  it("renders dual nav CTAs with enroll and franchise labels", () => {
    render(
      wrapWithLeadModal(
        <MemoryRouter>
          <AbacusClassicNav config={config} />
        </MemoryRouter>
      )
    );

    expect(screen.getByRole("button", { name: "Book free demo" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Apply franchise" })).toBeDefined();
  });

  it("renders hero badge, headline, and dual CTAs", () => {
    render(wrapWithLeadModal(<AbacusClassicHero config={config} />));

    expect(screen.getByText("FOR AGED 6–14 YEARS")).toBeDefined();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/Make children super fast in/);
    expect(screen.getByRole("button", { name: "Book free demo" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Apply franchise" })).toBeDefined();
  });
});

describe("Abacus Classic Sprint 2 — lead modals", () => {
  beforeEach(() => {
    polyfillDialog();
  });

  it("opens enroll modal from AbacusCtaButton", () => {
    renderWithLeadModals(<AbacusCtaButton label="Book free demo" href="enroll" />);

    fireEvent.click(screen.getByRole("button", { name: "Book free demo" }));

    expect(screen.getByRole("heading", { level: 2, name: "Book a free demo class" })).toBeDefined();
    expect(screen.getByLabelText("Parent name")).toBeDefined();
  });

  it("opens franchise modal from AbacusCtaButton", () => {
    renderWithLeadModals(<AbacusCtaButton label="Apply franchise" href="apply" />);

    fireEvent.click(screen.getByRole("button", { name: "Apply franchise" }));

    expect(screen.getByRole("heading", { level: 2, name: "Apply for franchise" })).toBeDefined();
    expect(screen.getByLabelText("Full name")).toBeDefined();
  });

  it("renders regular anchor for non-modal hrefs", () => {
    renderWithLeadModals(<AbacusCtaButton label="FAQ" href="#faq" />);
    expect(screen.getByRole("link", { name: "FAQ" }).getAttribute("href")).toBe("#faq");
  });
});

describe("Abacus Classic — programs grid", () => {
  beforeEach(() => {
    polyfillDialog();
  });

  const programs = [sampleProgram("Abacus Level 1"), sampleProgram("Vedic Maths")];
  const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");

  it("returns null when curriculum is empty and no homepage cards", () => {
    const { container } = render(
      <ProgramsGridSection programs={[]} programsSection={{ cards: [] }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders homepage program cards with editable section headings", () => {
    const { container } = render(
      <ProgramsGridSection programs={programs} programsSection={config.programsSection} />
    );

    expect(container.querySelector("#programs.ac-programs-grid")).toBeTruthy();
    expect(screen.getByText("WHAT WE TEACH")).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: "World-Class Brain Development" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Abacus (Mental Math)" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Vedic Mathematics" })).toBeDefined();
    expect(screen.getAllByText("Age 6–14")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Know More →" })).toHaveLength(3);
  });

  it("opens program details modal with benefits and brand scholarship default", () => {
    render(<ProgramsGridSection programs={programs} programsSection={config.programsSection} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Know More →" })[0]!);

    expect(screen.getByRole("heading", { level: 2, name: "Abacus (Mental Math) Course Details" })).toBeDefined();
    expect(screen.getByText("Kids become superfast in math")).toBeDefined();
    expect(screen.getByText("1 Lakh Success Scholarship!")).toBeDefined();
  });

  it("falls back to curriculum programs when homepage cards are not configured", () => {
    render(
      <ProgramsGridSection
        programs={programs}
        programsSection={{ eyebrow: "WHAT WE TEACH", title: "Programs", cards: [] }}
      />
    );

    expect(screen.getByRole("heading", { level: 3, name: "Abacus Level 1" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Vedic Maths" })).toBeDefined();
  });
});

describe("Abacus Classic Sprint 2 — feature grid", () => {
  const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");

  it("returns null when no feature sections", () => {
    const { container } = render(<FeatureGridSection siteName="Smart Brain Abacus" sections={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders four default feature blocks with site-specific heading", () => {
    render(<FeatureGridSection siteName={config.meta.siteName} sections={config.featureSections} />);

    expect(screen.getByRole("heading", { level: 2, name: "Why Smart Brain Abacus" })).toBeDefined();
    expect(screen.getByText(/Complete abacus in/)).toBeDefined();
    expect(screen.getByText(/4 levels\./)).toBeDefined();
    expect(screen.getByText(/Vedic maths techniques/)).toBeDefined();
    expect(screen.getByText(/National level/)).toBeDefined();
    expect(screen.getByText(/Low investment/)).toBeDefined();
  });
});

describe("Abacus Classic Sprint 2 — content section order", () => {
  it("renders hero, programs, and features in document order", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    const programs = [sampleProgram("Junior Abacus")];

    render(wrapWithLeadModal(<AbacusClassicContent config={config} publicCurriculum={programs} />));

    const main = screen.getByRole("main");
    const sectionIds = Array.from(main.querySelectorAll("section[id]")).map((el) => el.id);

    expect(sectionIds.indexOf("hero")).toBeLessThan(sectionIds.indexOf("programs"));
    expect(sectionIds.indexOf("programs")).toBeLessThan(sectionIds.indexOf("features"));
    expect(screen.getByRole("heading", { level: 3, name: "Abacus (Mental Math)" })).toBeDefined();
  });
});
