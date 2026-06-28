import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import { MarketingBackgroundMedia } from "../MarketingBackgroundMedia";

type Props = {
  config: HomepageConfig;
};

function PreFooterCtaButton({ href, label }: { href: string; label: string }) {
  if (href.startsWith("#")) {
    return (
      <a href={href} className="ent-btn ent-btn--primary">
        {label}
      </a>
    );
  }

  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link to={href} className="ent-btn ent-btn--primary">
        {label}
      </Link>
    );
  }

  return (
    <a href={href} className="ent-btn ent-btn--primary" target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

export function EnterprisePreFooterCta({ config }: Props) {
  const cta = config.footerCta;

  return (
    <section className="ent-prefooter ent-reveal">
      <div className="ent-prefooter__grid">
        <div>
          <h2>{cta.title}</h2>
          <p>{cta.subtitle}</p>
          <PreFooterCtaButton href={cta.ctaHref} label={cta.ctaLabel} />
        </div>
        <div className="ent-prefooter__visual">
          <MarketingBackgroundMedia src={cta.backgroundImageUrl ?? config.hero.backgroundImageUrl} />
        </div>
      </div>
    </section>
  );
}
