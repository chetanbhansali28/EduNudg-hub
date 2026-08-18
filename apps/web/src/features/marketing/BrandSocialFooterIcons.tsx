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

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="currentColor"
        d="M23 12.2s0-3.4-.4-5c-.2-1.1-1.1-2-2.2-2.2C18.6 4.6 12 4.6 12 4.6s-6.6 0-8.4.4C2.5 5.2 1.6 6.1 1.4 7.2.9 8.8.9 12.2.9 12.2s0 3.4.5 5c.2 1.1 1.1 2 2.2 2.2 1.8.4 8.4.4 8.4.4s6.6 0 8.4-.4c1.1-.2 2-1.1 2.2-2.2.4-1.6.4-5 .4-5zM9.8 15.6V8.8l6.4 3.4-6.4 3.4z"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.7 14.4c-.2.7-1.2 1.2-2 1.4-.5.1-1.2.2-3.5-.8-2.9-1.2-4.8-4.2-4.9-4.4-.2-.2-1.3-1.7-1.3-3.3 0-1.5.8-2.3 1.1-2.6.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.4.7c-.1.2-.2.3-.1.5.1.2.6 1 1.3 1.6.9.8 1.6 1 1.8 1.1.2.1.4.1.5-.1l.7-.8c.2-.2.4-.2.6-.1l2 .9c.2.1.4.2.4.5 0 .2 0 .7-.2 1.4z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="currentColor"
        d="M6.5 9H4V20h2.5V9zM5.2 4A1.6 1.6 0 1 0 5.2 7.2 1.6 1.6 0 0 0 5.2 4zM20 20h-2.5v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V20H11V9h2.4v1.5h.1c.3-.6 1.2-1.8 2.9-1.8 3.1 0 3.6 2 3.6 4.7V20z"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="currentColor"
        d="M17.8 3H21l-6.6 7.5L22 21h-6.3l-4.9-6.4L5.6 21H2.4l7-8L2 3h6.5l4.4 5.8L17.8 3zm-1.1 16.2h1.8L7.4 4.7H5.5l11.2 14.5z"
      />
    </svg>
  );
}

export function BrandSocialFooterIcons({ socialConnect, variant }: Props) {
  if (!hasBrandSocialFooterIcons(socialConnect)) return null;

  const className =
    variant === "spark-academy"
      ? "brand-social-footer-icons brand-social-footer-icons--spark"
      : variant === "edu-learn"
        ? "brand-social-footer-icons brand-social-footer-icons--edu-learn"
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
      {socialConnect.youtubeUrl ? (
        <a href={socialConnect.youtubeUrl} target="_blank" rel="noreferrer" aria-label="YouTube">
          <YouTubeIcon />
        </a>
      ) : null}
      {socialConnect.whatsappUrl ? (
        <a href={socialConnect.whatsappUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp">
          <WhatsAppIcon />
        </a>
      ) : null}
      {socialConnect.linkedinUrl ? (
        <a href={socialConnect.linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn">
          <LinkedInIcon />
        </a>
      ) : null}
      {socialConnect.xUrl ? (
        <a href={socialConnect.xUrl} target="_blank" rel="noreferrer" aria-label="X">
          <XIcon />
        </a>
      ) : null}
    </div>
  );
}
