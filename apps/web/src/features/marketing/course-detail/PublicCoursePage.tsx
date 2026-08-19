import { useEffect } from "react";
import { Navigate, useLocation, useOutletContext, useParams } from "react-router-dom";
import type { BrandLandingOutletContext } from "@/features/brand/BrandPublicLayout";
import type { CenterLandingOutletContext } from "@/features/center/CenterPublicLayout";
import { CourseDetailContent } from "@/features/marketing/course-detail/CourseDetailContent";
import { findPublicCourse } from "@/lib/publicCourseSlug";
import { scrollPublicPageToTop } from "@/lib/marketingPublicSite";

type PublicCourseOutlet = Pick<BrandLandingOutletContext, "config" | "marketingTheme" | "publicCurriculum"> &
  Partial<Pick<CenterLandingOutletContext, "centerSlug">>;

/** Brand or center public `/courses/:slug` — same layout chrome as `/`. */
export function PublicCoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const { hash } = useLocation();
  const { config, marketingTheme, publicCurriculum } = useOutletContext<PublicCourseOutlet>();
  const program = findPublicCourse(publicCurriculum, slug ?? "");

  useEffect(() => {
    if (!program) return;
    scrollPublicPageToTop(hash);
  }, [program, hash, slug]);

  if (!program) {
    return <Navigate to="/" replace />;
  }

  return (
    <CourseDetailContent
      program={program}
      marketingTheme={marketingTheme}
      enrollHref={config.nav.ctaHref}
    />
  );
}
