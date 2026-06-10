import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  IconBolt,
  IconChevronLeft,
  IconChevronRight,
  IconMenu,
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
  toggleTheme: () => void;
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

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "light" ? "dark" : "light";
      writeAdminTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <div data-theme={theme} className="ed-theme">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useAdminTheme();
  return (
    <button
      type="button"
      className="ed-theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? "Dark mode" : "Light mode"}
    </button>
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
  navSections,
  footerItems,
  showUpgradeCard,
  collapsed,
  onToggleCollapse,
  onNavigate,
  onClose,
}: {
  productName: string;
  logoUrl?: string | null;
  navSections: ShellNavSection[];
  footerItems: ShellNavItem[];
  showUpgradeCard: boolean;
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
          <span className="ed-sidebar__name">{productName}</span>
        </Link>
        <div className="ed-sidebar__top-actions">
          <button
            type="button"
            className="ed-sidebar__collapse"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <IconChevronRight width={18} height={18} /> : <IconChevronLeft width={18} height={18} />}
          </button>
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

      {footerItems.map((navItem) => (
        <SidebarNavLink key={navItem.label} item={navItem} onNavigate={onNavigate} collapsed={collapsed} />
      ))}
    </>
  );
}

export function AppShell({
  productName = "EduNudg",
  logoUrl,
  portalLabel,
  welcomeName,
  welcomeHeading,
  welcomeSubtitle,
  user,
  navSections,
  footerItems = [],
  showUpgradeCard = true,
  surface = "backend",
  children,
}: {
  productName?: string;
  logoUrl?: string | null;
  portalLabel: string;
  welcomeName?: string;
  /** Full greeting line; defaults to "Welcome back, {name} 👋". */
  welcomeHeading?: string;
  /** Context line under greeting; defaults to portalLabel. */
  welcomeSubtitle?: string;
  user?: { name: string; email: string };
  navSections: ShellNavSection[];
  footerItems?: ShellNavItem[];
  showUpgradeCard?: boolean;
  /** Staff portal chrome (admin / brand / center). Applies compact dashboard KPI styling. */
  surface?: "backend" | "marketing";
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
    navOpen ? "ed-shell--nav-open" : "",
    sidebarCollapsed ? "ed-shell--sidebar-collapsed" : "",
  ]
    .filter(Boolean)
    .join(" ");

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
          navSections={navSections}
          footerItems={footerItems}
          showUpgradeCard={showUpgradeCard}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          onNavigate={closeNav}
          onClose={closeNav}
        />
      </aside>

      <div className="ed-main">
        <div className="ed-mobile-bar">
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
          <span className="ed-mobile-bar__title">{productName}</span>
          <button
            type="button"
            className="ed-mobile-bar__collapse"
            onClick={toggleSidebarCollapsed}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <IconChevronRight width={20} height={20} /> : <IconChevronLeft width={20} height={20} />}
          </button>
        </div>

        <header className="ed-header">
          <div className="ed-header__intro">
            <h1 className="ed-header__welcome">{heading}</h1>
            <p className="ed-header__welcome-sub">{subtitle}</p>
          </div>
          {user && (
            <div className="ed-header__actions">
              <ThemeToggle />
              <div className="ed-header__profile">
                <span className="ed-header__avatar" aria-hidden>
                  {initials}
                </span>
                <div className="ed-header__profile-text">
                  <p className="ed-header__profile-name">{user.name}</p>
                  <p className="ed-header__profile-email">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </header>
        <div className="ed-content">{children}</div>
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

export function LoginLayout({
  branding,
  children,
  hint,
  legal,
}: {
  branding: LoginBrandingProps;
  children: ReactNode;
  hint?: ReactNode;
  legal?: ReactNode;
}) {
  const accountTitle = branding.accountTitle ?? "Welcome back!";
  const accountSubtitle =
    branding.accountSubtitle ?? `Log in to your ${branding.productName} account`;

  return (
    <div className="ed-login-split">
      <aside className="ed-login-split__hero" aria-hidden={false}>
        <div className="ed-login-split__hero-grid" aria-hidden />
        <div className="ed-login-split__hero-inner">
          <div className="ed-login-split__emblem">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="" className="ed-login-split__emblem-img" />
            ) : (
              <span className="ed-login-split__emblem-icon">
                <IconShield width={48} height={48} />
                <IconBolt width={28} height={28} />
              </span>
            )}
          </div>
          <h1 className="ed-login-split__headline">{branding.headline}</h1>
          <p className="ed-login-split__subtext">{branding.subtext}</p>
        </div>
      </aside>

      <div className="ed-login-split__form-wrap">
        <div className="ed-login-split__card">
          <div className="ed-login-split__card-brand">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="" className="ed-login-split__card-logo" />
            ) : (
              <span className="ed-login-split__card-mark" aria-hidden>
                <IconBolt width={20} height={20} />
              </span>
            )}
          </div>
          <h2 className="ed-login-split__title">{accountTitle}</h2>
          <p className="ed-login-split__subtitle">{accountSubtitle}</p>
          {hint && <div className="ed-login__hint">{hint}</div>}
          {children}
        </div>
        {legal && <div className="ed-login-split__legal">{legal}</div>}
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
