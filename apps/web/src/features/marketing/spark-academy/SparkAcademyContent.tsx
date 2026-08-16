import type { HomepageConfig } from "@/types/homepage";
import type { PortalMode } from "@/lib/portalMode";
import type { CenterPublicProfile } from "@/lib/centerLandingApi";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import type { BrandPublicStats } from "@/lib/brandLandingBundle";
import { isSparkSectionEnabled } from "@/lib/homepageSections";
import { visiblePublicFounders } from "@/lib/centerLandingDefaults";
import { resolveSparkCoursePrograms, sparkShouldShowCoursesSection } from "@/lib/programsGridItems";
import { SparkAcademyHero } from "./SparkAcademyHero";
import { CoursesSection } from "./CoursesSection";
import { FeaturesSection } from "./FeaturesSection";
import { JourneySection } from "./JourneySection";
import { MentorsSection } from "./MentorsSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { FaqSection } from "./FaqSection";
import { UpcomingEventsSection } from "../UpcomingEventsSection";
import { resolveVisibleUpcomingEvents } from "@/lib/upcomingEvents";
import { useScrollReveal } from "../useScrollReveal";
import { GallerySection, galleryPhotos } from "./GallerySection";

type Props = {
  config: HomepageConfig;
  portalMode: PortalMode;
  brandSlug?: string | null;
  centerSlug?: string | null;
  centerProfile?: CenterPublicProfile | null;
  publicCurriculum?: PublicCurriculumProgram[];
  publicStats?: BrandPublicStats;
};

export function SparkAcademyContent({
  config,
  publicCurriculum = [],
  publicStats = { centersCount: 0, studentsCount: 0 },
}: Props) {
  const showHero = isSparkSectionEnabled(config, "hero");
  const programItems = resolveSparkCoursePrograms(config.programsSection, publicCurriculum);
  const showPrograms = sparkShouldShowCoursesSection(
    isSparkSectionEnabled(config, "programsGrid"),
    isSparkSectionEnabled(config, "curriculumSyllabus"),
    publicCurriculum.length,
    programItems.length
  );
  const showFeatures = isSparkSectionEnabled(config, "featureGrid") && config.featureSections.length > 0;
  const showJourney = isSparkSectionEnabled(config, "trustMedia") && config.trustMedia;
  const founders = visiblePublicFounders(config.founders);
  const showFounders = isSparkSectionEnabled(config, "founders") && founders.length > 0;
  const showTestimonials = isSparkSectionEnabled(config, "testimonials");
  const showFaq = isSparkSectionEnabled(config, "faq") && config.faq.length > 0;
  const upcomingEvents = resolveVisibleUpcomingEvents(config.upcomingEvents);
  const showUpcomingEvents =
    isSparkSectionEnabled(config, "upcomingEvents") && upcomingEvents.length > 0;
  const galleryImages = config.gallery ? galleryPhotos(config.gallery) : [];
  const showGallery = galleryImages.length > 0;

  const featureImageFallback =
    config.hero.backgroundImageUrl?.trim() ||
    config.gallery?.images[0]?.url?.trim() ||
    founders[0]?.photoUrl?.trim() ||
    "";
  const programsTitle = config.programsSection?.title?.trim() || "";
  const coursesTitle = /course/i.test(programsTitle) ? programsTitle : undefined;

  useScrollReveal(true, ".sa-reveal", { threshold: 0.16, rootMargin: "0px 0px -12% 0px" });

  return (
    <main className="sa-main">
      {showHero ? (
        <SparkAcademyHero
          config={config}
          featuredProgram={publicCurriculum[0] ?? null}
          programCount={publicCurriculum.length}
        />
      ) : null}

      {showPrograms ? (
        <CoursesSection
          programs={programItems}
          ctaHref={config.nav.ctaHref}
          title={coursesTitle}
        />
      ) : null}

      {showFeatures ? (
        <FeaturesSection
          sections={config.featureSections}
          showcase={config.featuresShowcase}
          imageUrlFallback={featureImageFallback || undefined}
        />
      ) : null}

      {showJourney && config.trustMedia ? (
        <JourneySection
          trust={config.trustMedia}
          rich={config.footer.rich}
          highlightFounder={founders[0] ?? null}
        />
      ) : null}

      {showFounders ? <MentorsSection founders={founders} /> : null}

      {showUpcomingEvents && config.upcomingEvents ? (
        <div className="sa-reveal">
          <UpcomingEventsSection section={config.upcomingEvents} events={upcomingEvents} useLeadModals />
        </div>
      ) : null}

      {showTestimonials ? <TestimonialsSection testimonials={config.testimonials} /> : null}

      {showFaq ? <FaqSection items={config.faq} /> : null}

      {showGallery && config.gallery ? <GallerySection gallery={config.gallery} /> : null}
    </main>
  );
}
