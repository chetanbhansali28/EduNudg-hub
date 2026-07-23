import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeatureScrollSection, splitFeatureSectionIndices } from "./FeatureScrollSection";
import type { HomepageFeatureSection } from "@/types/homepage";

const PHONE = "https://example.com/phone.png";

const twoSections: HomepageFeatureSection[] = [
  {
    id: "a",
    title: "First block",
    titleSerif: "alpha.",
    body: "First body",
  },
  {
    id: "b",
    title: "Second block",
    titleSerif: "beta.",
    body: "Second body",
  },
];

function mockMatchMedia(desktop: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: desktop && query.includes("1024px"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

describe("splitFeatureSectionIndices", () => {
  it("splits four sections like legacy desktop layout", () => {
    expect(splitFeatureSectionIndices(4)).toEqual({ left: [0, 1], right: [2, 3] });
  });

  it("regression_split_feature_sections_two_blocks", () => {
    expect(splitFeatureSectionIndices(2)).toEqual({ left: [0], right: [1] });
  });

  it("handles single section on left column only", () => {
    expect(splitFeatureSectionIndices(1)).toEqual({ left: [0], right: [] });
  });

  it("handles three sections", () => {
    expect(splitFeatureSectionIndices(3)).toEqual({ left: [0, 1], right: [2] });
  });
});

describe("FeatureScrollSection", () => {
  beforeEach(() => {
    mockMatchMedia(true);
    class MockIntersectionObserver {
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
      takeRecords = vi.fn();
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("regression_feature_scroll_two_sections_renders", () => {
    render(<FeatureScrollSection sections={twoSections} phoneFrameUrl={PHONE} />);
    expect(screen.getAllByText("First block").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Second block").length).toBeGreaterThan(0);
  });

  it("sets scroll height css variable from section count", () => {
    const { container } = render(
      <FeatureScrollSection sections={twoSections} phoneFrameUrl={PHONE} />
    );
    const panel = container.querySelector(".novu-features-panel") as HTMLElement;
    expect(panel.style.getPropertyValue("--feature-section-count")).toBe("2");
  });

  it("returns null when no sections", () => {
    const { container } = render(<FeatureScrollSection sections={[]} phoneFrameUrl={PHONE} />);
    expect(container.firstChild).toBeNull();
  });
});
