import { useCallback, useEffect, useRef, useState } from "react";
import type { HomepageFeatureSection } from "@/types/homepage";

type Props = {
  sections: HomepageFeatureSection[];
  phoneFrameUrl: string;
};

function FeatureCopy({ section, visible }: { section: HomepageFeatureSection; visible: boolean }) {
  return (
    <div className={`novu-feature-copy ${visible ? "novu-feature-copy--visible" : ""}`}>
      <h2 className="novu-feature-copy__title">
        {section.title}
        <br />
        <span className="serif">{section.titleSerif}</span>
      </h2>
      <p className="novu-feature-copy__body">{section.body}</p>
    </div>
  );
}

function PhoneStage({
  sections,
  phoneFrameUrl,
  activeIndex,
}: {
  sections: HomepageFeatureSection[];
  phoneFrameUrl: string;
  activeIndex: number;
}) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === activeIndex) {
        void v.play().catch(() => undefined);
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [activeIndex]);

  return (
    <div className="novu-phone-stage">
      <div className="novu-phone-stage__device">
        <div className="novu-phone-stage__bezel" aria-hidden />
        <div className="novu-phone-stage__screen">
          {sections.map((s, i) => (
            <div
              key={s.id}
              className={`novu-phone-stage__video-wrap ${i === activeIndex ? "is-active" : ""}`}
            >
              {s.videoUrl ? (
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                  }}
                  src={s.videoUrl}
                  className="novu-phone-stage__video"
                  muted
                  playsInline
                  autoPlay={i === activeIndex}
                  loop
                  preload={i === activeIndex ? "auto" : "metadata"}
                />
              ) : null}
            </div>
          ))}
        </div>
        <img src={phoneFrameUrl} alt="" className="novu-phone-stage__frame" />
      </div>
    </div>
  );
}

function PhoneStageSingle({
  section,
  phoneFrameUrl,
  isActive,
}: {
  section: HomepageFeatureSection;
  phoneFrameUrl: string;
  isActive: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      void v.play().catch(() => undefined);
    } else {
      v.pause();
    }
  }, [isActive]);

  return (
    <div className="novu-phone-stage novu-phone-stage--compact">
      <div className="novu-phone-stage__device">
        <div className="novu-phone-stage__bezel" aria-hidden />
        <div className="novu-phone-stage__screen">
          {section.videoUrl ? (
            <div className={`novu-phone-stage__video-wrap ${isActive ? "is-active" : ""}`}>
              <video
                ref={videoRef}
                src={section.videoUrl}
                className="novu-phone-stage__video"
                muted
                playsInline
                loop
                preload="auto"
              />
            </div>
          ) : null}
        </div>
        <img src={phoneFrameUrl} alt="" className="novu-phone-stage__frame" />
      </div>
    </div>
  );
}

export function FeatureScrollSection({ sections, phoneFrameUrl }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stackItemRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateIndex = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scrollable = el.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
    const idx = Math.min(sections.length - 1, Math.floor(progress * sections.length));
    setActiveIndex(idx);
  }, [sections.length]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onScroll = () => {
      if (mq.matches) updateIndex();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    mq.addEventListener("change", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mq.removeEventListener("change", onScroll);
    };
  }, [updateIndex]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");

    const observer = new IntersectionObserver(
      (entries) => {
        if (mq.matches) return;
        let best: { index: number; ratio: number } | null = null;
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.featureIndex);
          if (Number.isNaN(index) || entry.intersectionRatio <= 0) continue;
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { index, ratio: entry.intersectionRatio };
          }
        }
        if (best) setActiveIndex(best.index);
      },
      { root: null, rootMargin: "-20% 0px -35% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    const attach = () => {
      if (mq.matches) return;
      stackItemRefs.current
        .filter((item): item is HTMLElement => item != null)
        .forEach((item) => observer.observe(item));
    };

    const frame = requestAnimationFrame(attach);
    const onMq = () => {
      observer.disconnect();
      if (!mq.matches) attach();
      else updateIndex();
    };
    mq.addEventListener("change", onMq);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mq.removeEventListener("change", onMq);
    };
  }, [sections.length, updateIndex]);

  return (
    <section id="features" data-nav-theme="light" className="novu-features-panel" ref={wrapRef}>
      <div className="novu-features-stack">
        {sections.map((section, i) => (
          <article
            key={section.id}
            ref={(el) => {
              stackItemRefs.current[i] = el;
            }}
            className="novu-features-stack__item"
            data-feature-index={i}
          >
            <PhoneStageSingle
              section={section}
              phoneFrameUrl={phoneFrameUrl}
              isActive={activeIndex === i}
            />
            <FeatureCopy section={section} visible />
          </article>
        ))}
      </div>

      <div className="novu-features-scroll">
        <div className="novu-features-scroll__grid">
          <div className="novu-features-scroll__col novu-features-scroll__col--left">
            <div className="novu-features-scroll__slot">
              <FeatureCopy section={sections[0]} visible={activeIndex === 0} />
            </div>
            <div className="novu-features-scroll__slot novu-features-scroll__slot--spacer" />
            <div className="novu-features-scroll__slot">
              <FeatureCopy section={sections[1]} visible={activeIndex === 1} />
            </div>
            <div className="novu-features-scroll__slot novu-features-scroll__slot--spacer" />
          </div>

          <div className="novu-features-scroll__col novu-features-scroll__col--center">
            <div className="novu-features-scroll__sticky">
              <PhoneStage sections={sections} phoneFrameUrl={phoneFrameUrl} activeIndex={activeIndex} />
            </div>
          </div>

          <div className="novu-features-scroll__col novu-features-scroll__col--right">
            <div className="novu-features-scroll__slot novu-features-scroll__slot--spacer" />
            <div className="novu-features-scroll__slot">
              <FeatureCopy section={sections[2]} visible={activeIndex === 2} />
            </div>
            <div className="novu-features-scroll__slot novu-features-scroll__slot--spacer" />
            <div className="novu-features-scroll__slot">
              <FeatureCopy section={sections[3]} visible={activeIndex === 3} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
