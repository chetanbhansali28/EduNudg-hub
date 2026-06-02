import { useCallback, useEffect, useRef, useState } from "react";
import type { HomepageConfig, HomepageFeatureSection } from "@/types/homepage";

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
        v.play().catch(() => undefined);
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [activeIndex]);

  return (
    <div className="novu-phone-stage">
      <div className="novu-phone-stage__glow" aria-hidden />
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
                  loop
                  preload="metadata"
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

export function FeatureScrollSection({ sections, phoneFrameUrl }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);

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
    const onChange = () => {
      if (mq.matches) updateIndex();
    };
    onChange();
    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange);
    mq.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
      mq.removeEventListener("change", onChange);
    };
  }, [updateIndex]);

  const mobilePrev = () => setMobileIndex((i) => Math.max(0, i - 1));
  const mobileNext = () => setMobileIndex((i) => Math.min(sections.length - 1, i + 1));

  const desktopIndex = activeIndex;

  return (
    <section id="features" className="novu-features-panel" ref={wrapRef}>
      {/* Desktop: scroll-driven 3-column */}
      <div className="novu-features-panel__desktop">
        <div className="novu-features-scroll">
          <div className="novu-features-scroll__grid">
            <div className="novu-features-scroll__col novu-features-scroll__col--left">
              <div className="novu-features-scroll__slot">
                <FeatureCopy section={sections[0]} visible={desktopIndex === 0} />
              </div>
              <div className="novu-features-scroll__slot novu-features-scroll__slot--spacer" />
              <div className="novu-features-scroll__slot">
                <FeatureCopy section={sections[1]} visible={desktopIndex === 1} />
              </div>
              <div className="novu-features-scroll__slot novu-features-scroll__slot--spacer" />
            </div>

            <div className="novu-features-scroll__col novu-features-scroll__col--center">
              <div className="novu-features-scroll__sticky">
                <PhoneStage sections={sections} phoneFrameUrl={phoneFrameUrl} activeIndex={desktopIndex} />
              </div>
            </div>

            <div className="novu-features-scroll__col novu-features-scroll__col--right">
              <div className="novu-features-scroll__slot novu-features-scroll__slot--spacer" />
              <div className="novu-features-scroll__slot">
                <FeatureCopy section={sections[2]} visible={desktopIndex === 2} />
              </div>
              <div className="novu-features-scroll__slot novu-features-scroll__slot--spacer" />
              <div className="novu-features-scroll__slot">
                <FeatureCopy section={sections[3]} visible={desktopIndex === 3} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: sticky carousel */}
      <div className="novu-features-panel__mobile">
        <div className="novu-features-mobile">
          <div className="novu-features-mobile__sticky">
            <PhoneStage sections={sections} phoneFrameUrl={phoneFrameUrl} activeIndex={mobileIndex} />
            <div className="novu-features-mobile__copy">
              <FeatureCopy section={sections[mobileIndex]} visible />
            </div>
            <div className="novu-features-mobile__controls">
              <button type="button" onClick={mobilePrev} disabled={mobileIndex === 0} aria-label="Previous card">
                ←
              </button>
              <button
                type="button"
                onClick={mobileNext}
                disabled={mobileIndex === sections.length - 1}
                aria-label="Next card"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
