import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { mergeSparkAcademyLandingConfig } from "@/lib/brandLandingDefaults";
import { MentorsSection } from "./MentorsSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { parseTestimonialAuthor } from "./testimonialHelpers";

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
    expect(document.querySelector(".sa-mentors")).toBeDefined();
  });
});

describe("TestimonialsSection", () => {
  it("regression_renders_badge_grid_and_author_roles", () => {
    const config = mergeSparkAcademyLandingConfig("Digitley");
    render(<TestimonialsSection testimonials={config.testimonials} />);

    expect(screen.getByText("Our Feedbacks")).toBeDefined();
    expect(screen.getByText("What Our Learners Are Saying")).toBeDefined();
    expect(screen.getByText(/Hear directly from our students/)).toBeDefined();
    expect(screen.getByText("John Matthews")).toBeDefined();
    expect(screen.getByText("Product Designer")).toBeDefined();
    expect(document.querySelectorAll(".sa-testimonial-card")).toHaveLength(6);
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
