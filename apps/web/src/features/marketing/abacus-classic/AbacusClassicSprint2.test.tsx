import { describe, expect, it, beforeEach, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { mergeAbacusClassicLandingConfig } from "@/lib/brandLandingDefaults";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { AbacusClassicNav } from "./AbacusClassicNav";
import { AbacusClassicHero } from "./AbacusClassicHero";
import { AbacusClassicContent } from "./AbacusClassicContent";
import { ProgramsMarqueeSection } from "./ProgramsMarqueeSection";
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

describe("Abacus Classic Sprint 2 — programs marquee", () => {
  const programs = [sampleProgram("Abacus Level 1"), sampleProgram("Vedic Maths")];

  it("returns null when curriculum is empty", () => {
    const { container } = render(<ProgramsMarqueeSection programs={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders program cards and duplicates list for marquee loop", () => {
    render(<ProgramsMarqueeSection programs={programs} />);

    expect(screen.getByRole("heading", { level: 2, name: "Explore Our Core Learning Programs" })).toBeDefined();
    expect(screen.getAllByRole("heading", { level: 3, name: "Abacus Level 1" })).toHaveLength(2);
    expect(screen.getAllByRole("heading", { level: 3, name: "Vedic Maths" })).toHaveLength(2);
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
    expect(screen.getAllByRole("heading", { level: 3, name: "Junior Abacus" })).toHaveLength(2);
  });
});
