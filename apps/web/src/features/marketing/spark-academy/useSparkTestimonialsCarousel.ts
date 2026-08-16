import { useEffect, type RefObject } from "react";
import {
  SPARK_TESTIMONIALS_AUTOSCROLL_MS,
  SPARK_TESTIMONIALS_MOBILE_MQ,
  carouselIndexFromScroll,
  nextCarouselIndex,
  scrollTestimonialsCarouselToIndex,
  shouldAutoScrollTestimonials,
} from "./testimonialHelpers";

export function useSparkTestimonialsCarousel(
  trackRef: RefObject<HTMLElement | null>,
  itemCount: number
): void {
  useEffect(() => {
    const track = trackRef.current;
    if (!track || itemCount <= 1 || typeof window.matchMedia !== "function") return;

    const mobileMq = window.matchMedia(SPARK_TESTIMONIALS_MOBILE_MQ);
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let index = 0;
    let timer: number | undefined;
    let resumeTimer: number | undefined;
    let programmatic = false;

    const canRun = () =>
      shouldAutoScrollTestimonials({
        isMobile: mobileMq.matches,
        prefersReducedMotion: reduceMq.matches,
        itemCount,
      });

    const clearTimer = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    const start = () => {
      clearTimer();
      if (!canRun()) return;
      timer = window.setInterval(() => {
        if (!canRun()) return;
        index = nextCarouselIndex(index, itemCount);
        programmatic = true;
        scrollTestimonialsCarouselToIndex(track, index);
        window.setTimeout(() => {
          programmatic = false;
        }, 450);
      }, SPARK_TESTIMONIALS_AUTOSCROLL_MS);
    };

    const pauseThenResume = () => {
      if (programmatic) return;
      index = carouselIndexFromScroll(track);
      clearTimer();
      if (resumeTimer !== undefined) window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(start, SPARK_TESTIMONIALS_AUTOSCROLL_MS);
    };

    const onMq = () => {
      if (canRun()) start();
      else clearTimer();
    };

    start();
    mobileMq.addEventListener("change", onMq);
    reduceMq.addEventListener("change", onMq);
    track.addEventListener("pointerdown", pauseThenResume);
    track.addEventListener("scroll", pauseThenResume, { passive: true });

    return () => {
      clearTimer();
      if (resumeTimer !== undefined) window.clearTimeout(resumeTimer);
      mobileMq.removeEventListener("change", onMq);
      reduceMq.removeEventListener("change", onMq);
      track.removeEventListener("pointerdown", pauseThenResume);
      track.removeEventListener("scroll", pauseThenResume);
    };
  }, [trackRef, itemCount]);
}
