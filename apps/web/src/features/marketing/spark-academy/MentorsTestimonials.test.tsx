import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { mergeSparkAcademyLandingConfig } from "@/lib/brandLandingDefaults";
import { MentorsSection } from "./MentorsSection";
import { TestimonialsSection } from "./TestimonialsSection";
import {
  SPARK_TESTIMONIALS_AUTOSCROLL_MS,
  nextCarouselIndex,
  parseTestimonialAuthor,
  shouldAutoScrollTestimonials,
} from "./testimonialHelpers";

describe("MentorsSection", () => {
  it("regression_renders_badge_title_and_horizontal_track", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(<MentorsSection founders={config.founders!} />);

    expect(screen.getByText("Our Mentors")).toBeDefined();
    expect(screen.getByText("Meet Our Expert Mentors")).toBeDefined();
    expect(screen.getByText(/Learn from the best in the industry/)).toBeDefined();
    expect(screen.getByText("Sarah Johnson")).toBeDefined();
    expect(screen.getByText("AI Expert & Data Scientist")).toBeDefined();
    expect(document.querySelector(".sa-mentors__track")).toBeDefined();
    expect(document.querySelector(".sa-mentors__track--center")).toBeDefined();
    expect(document.querySelector(".sa-mentors")).toBeDefined();
  });

  it("regression_spark_mentors_center_in_track", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(<MentorsSection founders={[config.founders![0]]} />);

    expect(document.querySelector(".sa-mentors__track--center")).toBeDefined();
    expect(screen.getByText("Sarah Johnson")).toBeDefined();
  });
});

describe("TestimonialsSection", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("regression_renders_badge_grid_and_author_roles", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(<TestimonialsSection testimonials={config.testimonials} />);

    expect(screen.getByText("Our Feedbacks")).toBeDefined();
    expect(screen.getByText("What Our Learners Are Saying")).toBeDefined();
    expect(screen.getByText(/Hear directly from our students/)).toBeDefined();
    expect(screen.getByText("John Matthews")).toBeDefined();
    expect(screen.getByText("Product Designer")).toBeDefined();
    expect(document.querySelectorAll(".sa-testimonial-card")).toHaveLength(6);
    expect(document.querySelector(".sa-testimonials__grid--center")).toBeDefined();
    expect(document.querySelector(".sa-testimonials__carousel")).toBeDefined();
  });

  it("regression_spark_testimonials_mobile_carousel_markup", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(
      <TestimonialsSection
        testimonials={{ ...config.testimonials, title: "Success stories" }}
      />
    );

    const track = document.querySelector(".sa-testimonials__carousel");
    expect(track).toBeDefined();
    expect(track?.getAttribute("role")).toBe("region");
    expect(track?.getAttribute("aria-roledescription")).toBe("carousel");
    expect(track?.getAttribute("aria-label")).toBe("Success stories");
  });

  it("regression_spark_testimonials_mobile_autoscroll_advances", () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("767px"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );

    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(<TestimonialsSection testimonials={config.testimonials} />);
    const track = document.querySelector(".sa-testimonials__carousel") as HTMLElement;
    const scrollTo = vi.fn();
    track.scrollTo = scrollTo;

    vi.advanceTimersByTime(SPARK_TESTIMONIALS_AUTOSCROLL_MS);
    expect(scrollTo).toHaveBeenCalled();
  });

  it("regression_spark_testimonials_center_in_grid", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(
      <TestimonialsSection
        testimonials={{
          ...config.testimonials,
          title: "Success stories",
          items: config.testimonials.items.slice(0, 1),
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Success stories" })).toBeDefined();
    expect(document.querySelector(".sa-testimonials__grid--center")).toBeDefined();
    expect(document.querySelectorAll(".sa-testimonial-card")).toHaveLength(1);
  });
});

describe("testimonial carousel helpers", () => {
  it("regression_spark_testimonials_auto_scroll_advances_index", () => {
    expect(nextCarouselIndex(0, 3)).toBe(1);
    expect(nextCarouselIndex(2, 3)).toBe(0);
    expect(nextCarouselIndex(0, 1)).toBe(0);
  });

  it("regression_spark_testimonials_auto_scroll_skips_reduced_motion", () => {
    expect(
      shouldAutoScrollTestimonials({ isMobile: true, prefersReducedMotion: true, itemCount: 4 })
    ).toBe(false);
    expect(
      shouldAutoScrollTestimonials({ isMobile: false, prefersReducedMotion: false, itemCount: 4 })
    ).toBe(false);
    expect(
      shouldAutoScrollTestimonials({ isMobile: true, prefersReducedMotion: false, itemCount: 1 })
    ).toBe(false);
    expect(
      shouldAutoScrollTestimonials({ isMobile: true, prefersReducedMotion: false, itemCount: 4 })
    ).toBe(true);
  });
});

describe("Spark testimonials carousel CSS", () => {
  const css = readFileSync(resolve(__dirname, "spark-academy.css"), "utf8");

  it("regression_spark_testimonials_mobile_carousel_css", () => {
    expect(css).toMatch(/@media \(max-width: 767px\)/);
    expect(css).toMatch(/\.sa-testimonials__carousel\s*\{[^}]*scroll-snap-type:\s*x mandatory/s);
    expect(css).toMatch(/prefers-reduced-motion: reduce/);
  });
});

describe("parseTestimonialAuthor", () => {
  it("uses explicit role when provided", () => {
    expect(parseTestimonialAuthor({ quote: "Great", author: "Jane Doe", role: "Designer" })).toEqual({
      name: "Jane Doe",
      role: "Designer",
    });
  });

  it("parses author with middle dot separator", () => {
    expect(parseTestimonialAuthor({ quote: "Great", author: "Jane Doe · Designer" })).toEqual({
      name: "Jane Doe",
      role: "Designer",
    });
  });
});
