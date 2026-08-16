import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeadModalProvider } from "@/features/marketing/abacus-classic/LeadModalContext";
import {
  mergeAbacusClassicLandingConfig,
  mergeSparkAcademyLandingConfig,
} from "@/lib/brandLandingDefaults";
import { createPublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import { exactAccessibleName } from "@/test/exactAccessibleName";
import { SparkAcademyContent } from "./SparkAcademyContent";

describe("SparkAcademyContent", () => {
  it("regression_renders_hero_courses_and_faq_from_homepage_config", () => {
    const config = mergeSparkAcademyLandingConfig("Educat Demo");
    render(
      <LeadModalProvider>
        <SparkAcademyContent
          config={config}
          portalMode="brand"
          brandSlug="educat-demo"
          publicCurriculum={[
            createPublicCurriculumProgram({
              name: "Abacus Junior",
              description: "Foundations for young learners",
              levels: [
                {
                  name: "Level 1",
                  levelCode: "L1",
                  topicsCovered: [],
                  whyTake: null,
                  whatYouLearn: null,
                  marketingVideoUrl: null,
                  modules: [],
                },
              ],
            }),
          ]}
          publicStats={{ centersCount: 10, studentsCount: 5000 }}
        />
      </LeadModalProvider>
    );

    expect(screen.getByRole("main")).toBeDefined();
    expect(screen.getByText(/Shape your future with/)).toBeDefined();
    expect(screen.getByText("Courses designed for success")).toBeDefined();
    expect(document.querySelector(".sa-courses .sa-section-head--center")).toBeDefined();
    expect(document.querySelector(".sa-courses__grid--center")).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Abacus Junior" })).toBeDefined();
    expect(screen.getByText("Our Journey to Excellence")).toBeDefined();
    expect(screen.getByText("What Our Learners Are Saying")).toBeDefined();
    expect(screen.getByText("What age group is suitable?")).toBeDefined();
    expect(screen.queryByText("Own an abacus center in your city")).toBeNull();
    expect(screen.queryByText("Give your child a head start in mental math")).toBeNull();
  });

  it("regression_spark_course_cards_center_in_grid", () => {
    const config = mergeSparkAcademyLandingConfig("Educat Demo");
    render(
      <LeadModalProvider>
        <SparkAcademyContent
          config={config}
          portalMode="brand"
          brandSlug="educat-demo"
          publicCurriculum={[
            createPublicCurriculumProgram({
              name: "Abacus Junior",
              description: "Foundations for young learners",
              levels: [],
            }),
          ]}
        />
      </LeadModalProvider>
    );

    expect(document.querySelector(".sa-courses__grid--center")).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Abacus Junior" })).toBeDefined();
  });

  it("regression_spark_courses_use_published_curriculum_over_homepage_cards", () => {
    const abacus = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    const config = mergeSparkAcademyLandingConfig("Smart Brain Abacus", {
      programsSection: abacus.programsSection,
    });

    render(
      <LeadModalProvider>
        <SparkAcademyContent
          config={config}
          portalMode="brand"
          brandSlug="smart-brain-abacus"
          publicCurriculum={[
            createPublicCurriculumProgram({
              name: "Junior Abacus Path",
              description: "From published syllabus",
              whyTake: "Build number sense early",
              ageLabel: "Age 5–8",
              levels: [
                {
                  name: "Level 1",
                  levelCode: "L1",
                  topicsCovered: [],
                  whyTake: null,
                  whatYouLearn: null,
                  marketingVideoUrl: null,
                  modules: [
                    {
                      title: "Foundations",
                      lessons: [{ title: "Bead basics", durationMinutes: 15, contentType: "video" }],
                    },
                  ],
                },
              ],
            }),
          ]}
        />
      </LeadModalProvider>
    );

    expect(screen.getByText("Courses designed for success")).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Junior Abacus Path" })).toBeDefined();
    expect(screen.getByText("From published syllabus")).toBeDefined();
    expect(screen.getByText("Age 5–8")).toBeDefined();
    expect(screen.getByText("⏱ 1 lesson")).toBeDefined();
    expect(screen.queryByRole("heading", { level: 3, name: "Abacus (Mental Math)" })).toBeNull();
    expect(screen.queryByRole("heading", { level: 3, name: "Vedic Mathematics" })).toBeNull();
    expect(screen.queryByRole("heading", { level: 3, name: "Handwriting" })).toBeNull();
  });

  it("regression_spark_course_card_keeps_enroll_now_and_centers_rating_below", () => {
    const config = mergeSparkAcademyLandingConfig("Smart Brain Abacus");
    const { container } = render(
      <LeadModalProvider>
        <SparkAcademyContent
          config={config}
          portalMode="brand"
          brandSlug="smart-brain-abacus"
          publicCurriculum={[
            createPublicCurriculumProgram({
              name: "Junior Abacus Path",
              description: "From published syllabus",
              levels: [
                {
                  name: "Level 1",
                  levelCode: "L1",
                  topicsCovered: [],
                  whyTake: null,
                  whatYouLearn: null,
                  marketingVideoUrl: null,
                  modules: [],
                },
              ],
            }),
          ]}
        />
      </LeadModalProvider>
    );

    const enrollNow = screen.getByRole("button", { name: exactAccessibleName("Enroll now") });
    const rating = screen.getByLabelText("Rated 5 out of 5");
    expect(enrollNow).toBeDefined();
    expect(screen.queryByText("Enroll", { exact: true })).toBeNull();
    expect(enrollNow.compareDocumentPosition(rating) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(rating.classList.contains("sa-course-card__rating")).toBe(true);
    expect(rating.parentElement?.classList.contains("sa-course-card__actions")).toBe(true);
    expect(container.querySelector(".sa-course-card__price")).toBeNull();
  });

  it("regression_spark_courses_section_has_no_curriculum_tabs", () => {
    const config = mergeSparkAcademyLandingConfig("Smart Brain Abacus");
    render(
      <LeadModalProvider>
        <SparkAcademyContent
          config={config}
          portalMode="brand"
          brandSlug="smart-brain-abacus"
          publicCurriculum={[
            createPublicCurriculumProgram({
              name: "Abacus",
              description: "Mental math",
            }),
            createPublicCurriculumProgram({
              name: "Handwriting (Cursive, Script Writing, Devnagari)",
              description: "Writing skills",
            }),
          ]}
        />
      </LeadModalProvider>
    );

    expect(screen.getByText("Courses designed for success")).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Abacus" })).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 3, name: "Handwriting (Cursive, Script Writing, Devnagari)" })
    ).toBeDefined();
    expect(screen.queryByRole("tablist", { name: "Course categories" })).toBeNull();
    expect(screen.queryByRole("tab", { name: exactAccessibleName("All courses") })).toBeNull();
    expect(screen.queryByRole("tab", { name: exactAccessibleName("Abacus") })).toBeNull();
  });

  it("regression_spark_courses_show_published_syllabus_even_if_programs_grid_off", () => {
    const config = mergeSparkAcademyLandingConfig("Smart Brain Abacus");
    config.sections = { ...config.sections, programsGrid: false, curriculumSyllabus: false };

    render(
      <LeadModalProvider>
        <SparkAcademyContent
          config={config}
          portalMode="brand"
          brandSlug="smart-brain-abacus"
          publicCurriculum={[
            createPublicCurriculumProgram({
              name: "Junior Abacus Path",
              description: "From published syllabus",
            }),
          ]}
        />
      </LeadModalProvider>
    );

    expect(screen.getByText("Courses designed for success")).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Junior Abacus Path" })).toBeDefined();
  });

  it("regression_spark_photo_gallery_renders_homepage_images", () => {
    const config = mergeSparkAcademyLandingConfig("Smart Brain Abacus", {
      gallery: {
        title: "Campus moments",
        images: [
          { url: "https://cdn.example.com/gallery-a.jpg", alt: "Annual day" },
          { url: "https://cdn.example.com/gallery-b.jpg", alt: "Classroom" },
        ],
      },
    });
    config.sections = { ...config.sections, gallery: false };
    const { container } = render(
      <LeadModalProvider>
        <SparkAcademyContent config={config} portalMode="brand" brandSlug="smart-brain-abacus" />
      </LeadModalProvider>
    );

    expect(container.querySelector("#gallery")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Campus moments" })).toBeDefined();
    expect(screen.getByAltText("Annual day")).toBeDefined();
    expect(screen.getByAltText("Classroom")).toBeDefined();
    const sectionIds = [...container.querySelectorAll("section[id]")].map((el) => el.id);
    expect(sectionIds.indexOf("faq")).toBeLessThan(sectionIds.indexOf("gallery"));
  });

  it("regression_spark_homepage_omits_about_teaser_sections", () => {
    const config = mergeSparkAcademyLandingConfig("Smart Brain Abacus");
    config.sections = { ...config.sections, about: true };

    render(
      <LeadModalProvider>
        <SparkAcademyContent
          config={config}
          portalMode="brand"
          brandSlug="smart-brain-abacus"
        />
      </LeadModalProvider>
    );

    expect(document.getElementById("about")).toBeNull();
    expect(screen.queryByRole("heading", { name: /ABOUT SMART BRAIN ABACUS/i })).toBeNull();
    expect(screen.queryByRole("heading", { name: /WHAT MAKES US DIFFERENT/i })).toBeNull();
  });

  it("regression_spark_section_headings_use_shared_title_class", () => {
    const config = mergeSparkAcademyLandingConfig("Smart Brain Abacus", {
      gallery: {
        title: "Campus moments",
        images: [{ url: "https://cdn.example.com/gallery-a.jpg", alt: "Annual day" }],
      },
    });
    const { container } = render(
      <LeadModalProvider>
        <SparkAcademyContent
          config={config}
          portalMode="brand"
          brandSlug="smart-brain-abacus"
          publicCurriculum={[
            createPublicCurriculumProgram({
              name: "Junior Abacus Path",
              description: "From published syllabus",
            }),
          ]}
        />
      </LeadModalProvider>
    );

    const sectionH2s = container.querySelectorAll(
      ".sa-courses h2, .sa-features h2, .sa-journey h2, .sa-mentors h2, .sa-testimonials h2, .sa-faq h2, .sa-gallery h2"
    );
    expect(sectionH2s.length).toBeGreaterThanOrEqual(6);
    sectionH2s.forEach((heading) => {
      expect(heading.classList.contains("sa-section-title")).toBe(true);
    });

    const itemH3s = container.querySelectorAll(
      ".sa-course-card h3, .sa-features__item h3, .sa-journey__row h3, .sa-mentor-card h3"
    );
    expect(itemH3s.length).toBeGreaterThan(0);
    itemH3s.forEach((heading) => {
      expect(heading.classList.contains("sa-item-title")).toBe(true);
    });
  });
});
