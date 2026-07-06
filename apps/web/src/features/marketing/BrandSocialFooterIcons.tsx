import type { BrandSocialConnect } from "@/lib/brandSocialConnect";
import { hasBrandSocialFooterIcons } from "@/lib/brandSocialConnect";
import type { MarketingTheme } from "@/types/homepage";

type Props = {
  socialConnect: BrandSocialConnect;
  variant: MarketingTheme;
};

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="currentColor"
        d="M14 8.5V7.2c0-.7.5-1.2 1.2-1.2H16V3h-1.4C12.8 3 12 4.5 12 6.2V8.5H10v2.8h2V21h2.8v-9.7H17l.4-2.8H14z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="currentColor"
        d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 4.8A4.2 4.2 0 1 0 16.2 12 4.2 4.2 0 0 0 12 7.8zm5.9-2.3a1 1 0 1 0-1 1 1 1 0 0 0 1-1z"
      />
    </svg>
  );
}

export function BrandSocialFooterIcons({ socialConnect, variant }: Props) {
  if (!hasBrandSocialFooterIcons(socialConnect)) return null;

  const className =
    variant === "spark-academy"
      ? "brand-social-footer-icons brand-social-footer-icons--spark"
      : variant === "abacus-classic"
        ? "brand-social-footer-icons brand-social-footer-icons--abacus"
        : "brand-social-footer-icons brand-social-footer-icons--novu";

  return (
    <div className={className} aria-label="Social media">
      {socialConnect.facebookUrl ? (
        <a href={socialConnect.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook">
          <FacebookIcon />
        </a>
      ) : null}
      {socialConnect.instagramUrl ? (
        <a href={socialConnect.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
          <InstagramIcon />
        </a>
      ) : null}
    </div>
  );
}
