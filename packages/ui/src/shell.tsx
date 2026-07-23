import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  IconBolt,
  IconChevronLeft,
  IconChevronRight,
  IconMenu,
  IconSearch,
  IconShield,
  IconX,
} from "./icons";
import { readSidebarCollapsed, writeSidebarCollapsed } from "./shellSidebarState";
import { readAdminTheme, writeAdminTheme, type AdminTheme } from "./themePreference";

export { readAdminTheme, writeAdminTheme, type AdminTheme } from "./themePreference";

export type ShellNavItem = {
  href: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
};

export type ShellNavSection = {
  title: string;
  items: ShellNavItem[];
};

const DESKTOP_NAV_MQ = "(min-width: 1024px)";

type ThemeContextValue = {
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useAdminTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAdminTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({
  children,
  theme: themeOverride,
}: {
  children: ReactNode;
  theme?: AdminTheme;
}) {
  const [theme, setThemeState] = useState<AdminTheme>(() => themeOverride ?? readAdminTheme());

  useEffect(() => {
    if (themeOverride) setThemeState(themeOverride);
  }, [themeOverride]);

  const setTheme = useCallback((next: AdminTheme) => {
    setThemeState(next);
    writeAdminTheme(next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <div data-theme={theme} className="ed-theme">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function SidebarNavLink({
  item,
  onNavigate,
  collapsed,
}: {
  item: ShellNavItem;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const className = [
    "ed-nav-link",
    item.active ? "ed-nav-link--active" : "",
    item.danger ? "ed-nav-link--danger" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleActivate = () => {
    item.onClick?.();
    onNavigate?.();
  };

  const content = (
    <>
      {item.icon && <span className="ed-nav-link__icon">{item.icon}</span>}
      <span className="ed-nav-link__label">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span className="ed-nav-link__badge">{item.badge}</span>
      )}
    </>
  );

  if (item.onClick && item.href === "#") {
    return (
      <button
        type="button"
        className={`${className} ed-nav-link--button`}
        onClick={handleActivate}
        title={collapsed ? item.label : undefined}
      >
        {content}
      </button>
    );
  }

  return (
    <Link to={item.href} className={className} onClick={handleActivate} title={collapsed ? item.label : undefined}>
      {content}
    </Link>
  );
}

function BrandMark({
  logoUrl,
  className,
}: {
  logoUrl?: string | null;
  className?: string;
}) {
  if (logoUrl) {
    return <img src={logoUrl} alt="" className={className} />;
  }
  return (
    <span className="ed-sidebar__logo" aria-hidden>
      <IconBolt width={18} height={18} />
    </span>
  );
}

function SidebarPanel({
  productName,
  logoUrl,
  portalTagline,
  navSections,
  footerItems,
  showUpgradeCard,
  shellVariant,
  collapsed,
  onToggleCollapse,
  onNavigate,
  onClose,
}: {
  productName: string;
  logoUrl?: string | null;
  portalTagline?: string | null;
  navSections: ShellNavSection[];
  footerItems: ShellNavItem[];
  showUpgradeCard: boolean;
  shellVariant: "staff" | "student";
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="ed-sidebar__top">
        <Link to="/" className="ed-sidebar__brand" onClick={onNavigate} title={productName}>
          <BrandMark logoUrl={logoUrl} className="ed-sidebar__logo-img" />
          <span className="ed-sidebar__brand-text">
            <span className="ed-sidebar__name">{productName}</span>
            {portalTagline && !collapsed ? (
              <span className="ed-sidebar__tagline">{portalTagline}</span>
            ) : null}
          </span>
        </Link>
        <div className="ed-sidebar__top-actions">
          {shellVariant !== "student" && (
            <button
              type="button"
              className="ed-sidebar__collapse"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              {collapsed ? <IconChevronRight width={18} height={18} /> : <IconChevronLeft width={18} height={18} />}
            </button>
          )}
          {onClose && (
            <button type="button" className="ed-sidebar__close" onClick={onClose} aria-label="Close menu">
              <IconX width={20} height={20} />
            </button>
          )}
        </div>
      </div>

      <nav className="ed-sidebar__nav" aria-label="Main navigation">
        {navSections.map((section) => (
          <div key={section.title} className="ed-sidebar__section">
            <div className="ed-sidebar__section-title">{section.title}</div>
            {section.items.map((navItem) => (
              <SidebarNavLink
                key={`${section.title}-${navItem.label}`}
                item={navItem}
                onNavigate={onNavigate}
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}
      </nav>

      {showUpgradeCard && (
        <div className="ed-sidebar__upgrade">
          <div className="ed-sidebar__upgrade-title">Starter Plan</div>
          <button type="button" className="ed-sidebar__upgrade-btn">
            Upgrade Plan
          </button>
        </div>
      )}

      {footerItems.length > 0 && (
        <div className="ed-sidebar__footer">
          {footerItems.map((navItem) => (
            <SidebarNavLink key={navItem.label} item={navItem} onNavigate={onNavigate} collapsed={collapsed} />
          ))}
        </div>
      )}
    </>
  );
}

export function AppShell({
  productName = "EduNudg",
  logoUrl,
  portalLabel,
  portalTagline,
  welcomeName,
  welcomeHeading,
  welcomeSubtitle,
  user,
  navSections,
  footerItems = [],
  showUpgradeCard = true,
  showWelcome = true,
  shellVariant = "staff",
  surface = "backend",
  mobileBarTitle,
  mobileBarEnd,
  mobileNavMode = "drawer",
  mobileChrome,
  shellClassName,
  children,
}: {
  productName?: string;
  logoUrl?: string | null;
  portalLabel: string;
  /** Short label under product name in sidebar (e.g. Student portal). */
  portalTagline?: string | null;
  welcomeName?: string;
  /** Full greeting line; defaults to "Welcome back, {name} 👋". */
  welcomeHeading?: string;
  /** Context line under greeting; defaults to portalLabel. */
  welcomeSubtitle?: string;
  user?: { name: string; email?: string; subtitle?: string; avatarUrl?: string | null };
  navSections: ShellNavSection[];
  footerItems?: ShellNavItem[];
  showUpgradeCard?: boolean;
  /** When false, hides the welcome block in the header (student dashboard uses in-page welcome). */
  showWelcome?: boolean;
  /** Student portal uses compact header with search toolbar. */
  shellVariant?: "staff" | "student";
  /** Staff portal chrome (admin / brand / center). Applies compact dashboard KPI styling. */
  surface?: "backend" | "marketing";
  /** Overrides product name in the mobile top bar. */
  mobileBarTitle?: string;
  /** Optional trailing control in the mobile top bar (e.g. notifications). */
  mobileBarEnd?: ReactNode;
  /** Mobile nav: drawer (hamburger sidebar) or bottom tab bar (hides hamburger). */
  mobileNavMode?: "drawer" | "bottom";
  /** Fixed bottom navigation rendered outside the scrolling content column. */
  mobileChrome?: ReactNode;
  /** Extra class on the shell root (e.g. ed-shell--commerce). */
  shellClassName?: string;
  children: ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readSidebarCollapsed());
  const closeNav = useCallback(() => setNavOpen(false), []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      writeSidebarCollapsed(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNav();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen, closeNav]);

  useEffect(() => {
    document.body.classList.toggle("ed-nav-open", navOpen);
    return () => document.body.classList.remove("ed-nav-open");
  }, [navOpen]);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_NAV_MQ);
    const onChange = () => {
      if (mq.matches) closeNav();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [closeNav]);

  const displayName = welcomeName ?? user?.name ?? "there";
  const heading = welcomeHeading ?? `Welcome back, ${displayName} 👋`;
  const subtitle = welcomeSubtitle ?? portalLabel;
  const initials = (user?.name ?? displayName)
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const shellClass = [
    "ed-shell",
    surface === "backend" ? "ed-shell--backend" : "",
    shellVariant === "student" ? "ed-shell--student" : "",
    shellClassName ?? "",
    mobileNavMode === "bottom" ? "ed-shell--bottom-nav" : "",
    mobileChrome ? "ed-shell--mobile-chrome" : "",
    navOpen ? "ed-shell--nav-open" : "",
    sidebarCollapsed ? "ed-shell--sidebar-collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const mobileTitle = mobileBarTitle ?? productName;
  const titleOnlyMobileBar = mobileNavMode === "bottom" || mobileChrome != null;

  return (
    <div className={shellClass}>
      <button
        type="button"
        className="ed-shell__backdrop"
        aria-label="Close menu"
        onClick={closeNav}
        tabIndex={navOpen ? 0 : -1}
      />

      <aside id="app-sidebar" className="ed-sidebar" aria-label="Sidebar">
        <SidebarPanel
          productName={productName}
          logoUrl={logoUrl}
          portalTagline={portalTagline}
          navSections={navSections}
          footerItems={footerItems}
          showUpgradeCard={showUpgradeCard}
          shellVariant={shellVariant}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          onNavigate={closeNav}
          onClose={closeNav}
        />
      </aside>

      <div className="ed-main">
        <div className="ed-mobile-bar">
          {!titleOnlyMobileBar ? (
            <button
              type="button"
              className="ed-mobile-bar__menu"
              aria-expanded={navOpen}
              aria-controls="app-sidebar"
              onClick={() => setNavOpen((open) => !open)}
            >
              <IconMenu width={22} height={22} />
              <span className="ed-sr-only">{navOpen ? "Close menu" : "Open menu"}</span>
            </button>
          ) : null}
          <span className="ed-mobile-bar__title">{mobileTitle}</span>
          {!titleOnlyMobileBar && mobileBarEnd ? (
            <div className="ed-mobile-bar__end">{mobileBarEnd}</div>
          ) : !titleOnlyMobileBar && shellVariant === "student" && user ? (
            <div className="ed-mobile-bar__profile">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="ed-header__avatar ed-header__avatar--img" />
              ) : (
                <span className="ed-header__avatar" aria-hidden>
                  {initials}
                </span>
              )}
            </div>
          ) : !titleOnlyMobileBar ? (
            <button
              type="button"
              className="ed-mobile-bar__collapse"
              onClick={toggleSidebarCollapsed}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <IconChevronRight width={20} height={20} /> : <IconChevronLeft width={20} height={20} />}
            </button>
          ) : null}
        </div>

        <header className="ed-header">
          {showWelcome ? (
            <div className="ed-header__intro">
              <h1 className="ed-header__welcome">{heading}</h1>
              <p className="ed-header__welcome-sub">{subtitle}</p>
            </div>
          ) : shellVariant !== "student" ? (
            <div className="ed-header__intro ed-header__intro--hidden" aria-hidden />
          ) : null}
          {shellVariant === "student" && (
            <div className="ed-header__toolbar">
              <label className="ed-header__search">
                <IconSearch width={16} height={16} aria-hidden />
                <input
                  type="search"
                  placeholder="Search courses, badges, analytics…"
                  aria-label="Search"
                  disabled
                />
              </label>
            </div>
          )}
          {user && (
            <div className="ed-header__actions">
              <div className="ed-header__profile">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="ed-header__avatar ed-header__avatar--img" />
                ) : (
                  <span className="ed-header__avatar" aria-hidden>
                    {initials}
                  </span>
                )}
                <div className="ed-header__profile-text">
                  <p className="ed-header__profile-name">{user.name}</p>
                  <p className="ed-header__profile-email">{user.subtitle ?? user.email}</p>
                </div>
              </div>
            </div>
          )}
        </header>
        <div className="ed-content">
          {titleOnlyMobileBar ? <div className="ed-mobile-page-body">{children}</div> : children}
        </div>
        {mobileChrome ? <div className="ed-shell__mobile-chrome">{mobileChrome}</div> : null}
      </div>
    </div>
  );
}

export type LoginBrandingProps = {
  productName: string;
  logoUrl?: string | null;
  headline: string;
  subtext: string;
  accountTitle?: string;
  accountSubtitle?: string;
};

export type LoginFooterLink = {
  label: string;
  href: string;
};

function LoginBrandMark({ logoUrl, productName }: { logoUrl?: string | null; productName: string }) {
  if (logoUrl) {
    return <img src={logoUrl} alt="" className="ed-login-brand__logo" />;
  }

  const initial = (productName.trim()[0] ?? "E").toUpperCase();
  return (
    <span className="ed-login-brand" aria-hidden>
      <span className="ed-login-brand__half ed-login-brand__half--dark">
        <IconBolt width={16} height={16} />
      </span>
      <span className="ed-login-brand__half ed-login-brand__half--light">{initial}</span>
    </span>
  );
}

function useMinWidth(minWidth: number) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [minWidth]);

  return matches;
}

export function LoginLayout({
  branding,
  children,
  hint,
  footerLinks,
}: {
  branding: LoginBrandingProps;
  children: ReactNode;
  hint?: ReactNode;
  footerLinks?: LoginFooterLink[];
}) {
  const accountTitle = branding.accountTitle ?? "Welcome back!";
  const accountSubtitle =
    branding.accountSubtitle ?? `Log in to your ${branding.productName} account`;
  const links = footerLinks ?? [
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
    { label: "Help", href: "/help" },
  ];
  const isDesktopLogin = useMinWidth(960);

  return (
    <div className="ed-login-page">
      <div className="ed-login-page__frame">
        <aside className="ed-login-hero" aria-hidden={false}>
          <div className="ed-login-hero__inner">
            <div className="ed-login-hero__emblem">
              <LoginBrandMark logoUrl={branding.logoUrl} productName={branding.productName} />
            </div>
            <h1 className="ed-login-hero__headline">{branding.headline}</h1>
            <p className="ed-login-hero__subtext">{branding.subtext}</p>
          </div>
          <div className="ed-login-hero__dots" aria-hidden>
            <span className="ed-login-hero__dot ed-login-hero__dot--active" />
            <span className="ed-login-hero__dot" />
            <span className="ed-login-hero__dot" />
          </div>
        </aside>

        <div className="ed-login-panel">
          {!isDesktopLogin ? (
            <header className="ed-login-panel__mobile-head">
              <LoginBrandMark logoUrl={branding.logoUrl} productName={branding.productName} />
              <h1 className="ed-login-panel__title">{accountTitle}</h1>
              <p className="ed-login-panel__subtitle">{accountSubtitle}</p>
            </header>
          ) : null}

          <div className="ed-login-card">
            {isDesktopLogin ? (
              <header className="ed-login-card__head">
                <h2 className="ed-login-card__title">{accountTitle}</h2>
                <p className="ed-login-card__subtitle">{accountSubtitle}</p>
              </header>
            ) : null}
            {hint ? <div className="ed-login__hint">{hint}</div> : null}
            {children}
          </div>

          <nav className="ed-login-footer" aria-label="Legal and help">
            {links.map((link, index) => (
              <span key={`${link.label}:${link.href}`} className="ed-login-footer__item">
                {index > 0 ? <span className="ed-login-footer__sep" aria-hidden /> : null}
                <a href={link.href}>{link.label}</a>
              </span>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

export function ComingSoonPage({
  portalLabel,
  productName,
  logoUrl,
  message = "This portal is coming in a later release.",
}: {
  portalLabel: string;
  productName?: string;
  logoUrl?: string | null;
  message?: string;
}) {
  const title = productName ?? portalLabel;

  return (
    <div className="ed-coming-soon">
      <div className="ed-coming-soon__card">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="ed-sidebar__logo-img" />
        ) : (
          <span className="ed-sidebar__logo" aria-hidden>
            <IconBolt width={18} height={18} />
          </span>
        )}
        <h1>{title}</h1>
        <p className="ed-muted">{portalLabel}</p>
        <p>{message}</p>
      </div>
    </div>
  );
}
