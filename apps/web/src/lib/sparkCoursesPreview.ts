/** Matches `.sa-course-card` `flex-basis` in `spark-academy.css`. */
export const SPARK_COURSE_CARD_MIN_REM = 18;
/** Matches `.sa-courses__grid` `gap` in `spark-academy.css`. */
export const SPARK_COURSE_GRID_GAP_REM = 1.5;
/** Desktop row under `--sa-max: 1200px` (used when width is unknown / jsdom). */
export const SPARK_COURSES_PREVIEW_FALLBACK = 3;

/** How many course cards fit one wrapping row at the given content width. */
export function sparkCoursesHomepagePreviewLimit(
  contentWidthPx: number,
  rootFontPx = 16
): number {
  const min = SPARK_COURSE_CARD_MIN_REM * rootFontPx;
  const gap = SPARK_COURSE_GRID_GAP_REM * rootFontPx;
  if (contentWidthPx <= 0) return SPARK_COURSES_PREVIEW_FALLBACK;
  return Math.max(1, Math.floor((contentWidthPx + gap) / (min + gap)));
}
