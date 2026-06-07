import { Link } from "react-router-dom";
import type { HomepageConfig } from "@/types/homepage";
import type { BrandPublicStats } from "@/lib/brandLandingBundle";

type Props = {
  config: HomepageConfig;
  publicStats: BrandPublicStats;
};

function formatStatValue(value: number): string {
  if (value >= 1000) return `${Math.floor(value / 1000)}k+`.replace("kk+", "k+");
  if (value > 0) return `${value}+`;
  return "0";
}

export function AbacusClassicFooter({ config, publicStats }: Props) {
  const rich = config.footer.rich;
  const showLive = rich?.showLiveStats !== false;

  const stats: { value: string; label: string }[] = [];

  if (showLive && publicStats.centersCount > 0) {
    stats.push({ value: formatStatValue(publicStats.centersCount), label: "Franchises" });
  }
  if (showLive && publicStats.studentsCount > 0) {
    stats.push({ value: formatStatValue(publicStats.studentsCount), label: "Students" });
  }
  for (const custom of rich?.customStats ?? []) {
    if (custom.value.trim() && custom.label.trim()) {
      stats.push({ value: custom.value.trim(), label: custom.label.trim() });
    }
  }

  return (
    <footer className="ac-footer">
      <div className="ac-footer__wave" aria-hidden />
      <div className="ac-footer__inner">
        <div className="ac-footer__grid">
          <div className="ac-footer__brand">
            {config.meta.logoUrl ? (
              <img src={config.meta.logoUrl} alt="" className="ac-footer__logo" width={56} height={56} />
            ) : (
              <span className="ac-footer__logo-fallback">{config.meta.siteName.charAt(0)}</span>
            )}
            {rich?.description ? <p>{rich.description}</p> : null}
            {rich?.badges && rich.badges.length > 0 ? (
              <div className="ac-footer__badges">
                {rich.badges.map((badge, i) => (
                  <span key={`${badge.label}-${i}`} className="ac-footer__badge">
                    {badge.label}
                  </span>
                ))}
              </div>
            ) : null}
            {stats.length > 0 ? (
              <div className="ac-footer__stats">
                {stats.map((stat, i) => (
                  <div key={`${stat.label}-${i}`} className="ac-footer__stat">
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {rich?.socialLinks && rich.socialLinks.length > 0 ? (
              <div className="ac-footer__social">
                {rich.socialLinks.map((link, i) => (
                  <a key={`${link.platform}-${i}`} href={link.url} target="_blank" rel="noreferrer">
                    {link.platform}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <h3>Quick links</h3>
            <ul>
              {config.footer.productLinks.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("/") ? <Link to={link.href}>{link.label}</Link> : <a href={link.href}>{link.label}</a>}
                </li>
              ))}
            </ul>
          </div>

          {rich?.presence && rich.presence.length > 0 ? (
            <div>
              <h3>Our presence</h3>
              {rich.presence.map((region, i) => (
                <div key={`${region.region}-${i}`} className="ac-footer__presence">
                  <strong>{region.region}</strong>
                  <p>{region.cities.join(", ")}</p>
                </div>
              ))}
            </div>
          ) : null}

          {rich?.headOffice ? (
            <div>
              <h3>Head office</h3>
              <address className="ac-footer__office">
                <p>{rich.headOffice.address}</p>
                <p>{rich.headOffice.phone}</p>
                <p>{rich.headOffice.website}</p>
              </address>
            </div>
          ) : null}
        </div>

        <div className="ac-footer__bottom">
          <span>{config.footer.copyright}</span>
          <div className="ac-footer__legal">
            <a href={config.footer.privacyHref}>Privacy Policy</a>
            <a href={config.footer.termsHref}>Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
