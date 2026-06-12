import { learnPortalLoginUrl } from "@/lib/centerPublicNavUrls";

type Props = {
  brandSlug: string;
  isLightBg?: boolean;
  className?: string;
  inDropdown?: boolean;
  onNavigate?: () => void;
};

export function CenterPublicNavLogins({
  brandSlug,
  isLightBg,
  className,
  inDropdown,
  onNavigate,
}: Props) {
  const studentHref = learnPortalLoginUrl(brandSlug);

  const linkClass = inDropdown
    ? "novu-nav-bar__dropdown-link novu-nav-bar__dropdown-link--login"
    : `novu-nav-bar__link novu-nav-bar__link--login${isLightBg ? " novu-nav-bar__link--on-white" : ""}`;

  const close = () => onNavigate?.();

  return (
    <div className={className ?? "novu-nav-bar__logins"}>
      <a
        href={studentHref}
        className={linkClass}
        {...(inDropdown ? { role: "menuitem" } : {})}
        onClick={close}
      >
        Student Login
      </a>
    </div>
  );
}

export function centerPublicLoginHrefs(brandSlug: string) {
  return {
    studentLoginHref: learnPortalLoginUrl(brandSlug),
  };
}
