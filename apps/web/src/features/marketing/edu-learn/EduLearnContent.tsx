import type { HomepageConfig } from "@/types/homepage";
import type { PortalMode } from "@/lib/portalMode";
import type { CenterPublicProfile } from "@/lib/centerLandingApi";
import type { PublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import type { BrandPublicStats } from "@/lib/brandLandingBundle";
import { isEduLearnSectionEnabled } from "@/lib/homepageSections";
import { visiblePublicFounders } from "@/lib/centerLandingDefaults";
import { resolveSparkCoursePrograms, sparkShouldShowCoursesSection } from "@/lib/programsGridItems";
import { resolveVisibleUpcomingEvents } from "@/lib/upcomingEvents";
import { UpcomingEventsSection } from "../UpcomingEventsSection";
import { EduLearnHero } from "./EduLearnHero";
import { EduLearnCourses } from "./EduLearnCourses";
import { EduLearnFeatures } from "./EduLearnFeatures";
import { EduLearnStats } from "./EduLearnStats";
import { EduLearnTestimonials } from "./EduLearnTestimonials";
import { EduLearnResources, galleryPhotos } from "./EduLearnResources";
import { EduLearnFaq } from "./EduLearnFaq";
import { EduLearnMentors } from "./EduLearnMentors";
import { EduLearnCtaBand } from "./EduLearnCtaBand";

type Props = {
  config: HomepageConfig;
  portalMode: PortalMode;
  brandSlug?: string | null;
  centerSlug?: string | null;
  centerProfile?: CenterPublicProfile | null;
  publicCurriculum?: PublicCurriculumProgram[];
  publicStats?: BrandPublicStats;
};

export function EduLearnContent({
  config,
  portalMode,
  publicCurriculum = [],
  publicStats = { centersCount: 0, studentsCount: 0 },
}: Props) {
  const showHero = isEduLearnSectionEnabled(config, "hero");
  const programItems = resolveSparkCoursePrograms(config.programsSection, publicCurriculum);
  const showPrograms = sparkShouldShowCoursesSection(
    isEduLearnSectionEnabled(config, "programsGrid"),
    isEduLearnSectionEnabled(config, "curriculumSyllabus"),
    publicCurriculum.length,
    programItems.length
  );
  const showFeatures = isEduLearnSectionEnabled(config, "featureGrid") && config.featureSections.length > 0;
  const showStats = isEduLearnSectionEnabled(config, "trustMedia") && Boolean(config.trustMedia);
  const founders = visiblePublicFounders(config.founders);
  const showFounders = isEduLearnSectionEnabled(config, "founders") && founders.length > 0;
  const showTestimonials = isEduLearnSectionEnabled(config, "testimonials");
  const showFaq = isEduLearnSectionEnabled(config, "faq") && config.faq.length > 0;
  const upcomingEvents = resolveVisibleUpcomingEvents(config.upcomingEvents);
  const showUpcomingEvents =
    isEduLearnSectionEnabled(config, "upcomingEvents") && upcomingEvents.length > 0;
  const galleryImages = config.gallery ? galleryPhotos(config.gallery) : [];
  const showGallery = isEduLearnSectionEnabled(config, "gallery") && galleryImages.length > 0;
  const showCta = isEduLearnSectionEnabled(config, "footerCta") && Boolean(config.footerCta?.title?.trim());
  const enrollHref = config.hero.ctaHref || config.nav.ctaHref || "enroll";
  const programsTitle = config.programsSection?.title?.trim() || "";

  return (
    <main className="el-main">
      {showHero ? <EduLearnHero config={config} showFranchiseCta={portalMode !== "center"} /> : null}
      {showPrograms ? (
        <EduLearnCourses programs={programItems} ctaHref={enrollHref} title={programsTitle} />
      ) : null}
      {showFeatures ? (
        <EduLearnFeatures
          sections={config.featureSections}
          title={config.featuresShowcase?.title}
          ctaHref={enrollHref}
        />
      ) : null}
      {showStats && config.trustMedia ? (
        <EduLearnStats trust={config.trustMedia} publicStats={publicStats} />
      ) : null}
      {showFounders ? <EduLearnMentors founders={founders} /> : null}
      {showUpcomingEvents && config.upcomingEvents ? (
        <UpcomingEventsSection section={config.upcomingEvents} events={upcomingEvents} useLeadModals />
      ) : null}
      {showTestimonials ? <EduLearnTestimonials testimonials={config.testimonials} /> : null}
      {showFaq ? <EduLearnFaq items={config.faq} /> : null}
      {showGallery && config.gallery ? (
        <EduLearnResources gallery={config.gallery} ctaHref={enrollHref} />
      ) : null}
      {showCta ? <EduLearnCtaBand config={config} /> : null}
    </main>
  );
}
