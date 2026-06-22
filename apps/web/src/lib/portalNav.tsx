import type { ReactNode } from "react";
import type { ShellNavItem, ShellNavSection } from "@edunudg/ui";
import {
  IconBook,
  IconBuilding,
  IconChart,
  IconClipboard,
  IconGraduation,
  IconHelp,
  IconHome,
  IconLogout,
  IconSettings,
  IconUsers,
  IconWallet,
} from "@edunudg/ui";

export const BRAND_FEATURE_FLAGS: Record<string, string> = {
  "/app/leads": "student_leads",
  "/app/franchise-applications": "franchise_applications",
  "/app/billing": "brand_billing",
  "/app/campaigns": "campaigns",
  "/app/merchandise": "merchandise",
  "/app/kits": "merchandise",
};

export const CENTER_FEATURE_FLAGS: Record<string, string> = {
  "/app/merchandise": "merchandise",
  "/app/kits": "merchandise",
  "/app/campaigns": "campaigns",
};

export function filterNavByFeatureFlags(
  sections: ShellNavSection[],
  flags: Record<string, boolean>,
  flagMap: Record<string, string>
): ShellNavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const key = flagMap[item.href];
        if (!key) return true;
        return flags[key] ?? false;
      }),
    }))
    .filter((section) => section.items.length > 0);
}

type NavDef = { path: string; label: string; icon: ReactNode; badge?: number };

function item(path: string, label: string, icon: ReactNode, pathname: string, badge?: number): ShellNavItem {
  const active =
    path === "/"
      ? pathname === "/" || pathname === "/admin"
      : path === "/admin"
        ? pathname === "/admin" || pathname === "/admin/"
        : path === "/app"
          ? pathname === "/app" || pathname === "/app/"
          : pathname === path || pathname.startsWith(`${path}/`);
  return { href: path, label, icon, active, badge };
}

function section(title: string, defs: NavDef[], pathname: string): ShellNavSection {
  return {
    title,
    items: defs.map((d) => item(d.path, d.label, d.icon, pathname, d.badge)),
  };
}

export function platformNavSections(pathname: string): ShellNavSection[] {
  return [
    section("Main menu", [{ path: "/admin", label: "Home", icon: <IconHome /> }], pathname),
    section(
      "Features",
      [
        { path: "/admin/brands", label: "Brands", icon: <IconBuilding /> },
        { path: "/admin/subscriptions", label: "Subscriptions", icon: <IconWallet /> },
        { path: "/admin/revenue", label: "Revenue & Usage", icon: <IconChart /> },
        { path: "/admin/audit", label: "Audit Logs", icon: <IconClipboard /> },
      ],
      pathname
    ),
    section(
      "General",
      [
        { path: "/admin/settings", label: "Settings", icon: <IconSettings /> },
        { path: "/admin/homepage", label: "Homepage", icon: <IconBook /> },
      ],
      pathname
    ),
  ];
}

export function brandNavSections(pathname: string): ShellNavSection[] {
  return [
    section("Main menu", [{ path: "/app", label: "Home", icon: <IconHome /> }], pathname),
    section(
      "Leads",
      [
        { path: "/app/franchise-applications", label: "Franchise leads", icon: <IconClipboard /> },
        { path: "/app/leads", label: "Student leads", icon: <IconUsers /> },
      ],
      pathname
    ),
    section(
      "Features",
      [
        { path: "/app/curriculum", label: "Curriculum", icon: <IconBook /> },
        { path: "/app/centers", label: "Franchise Management", icon: <IconBuilding /> },
        { path: "/app/analytics", label: "Analytics", icon: <IconChart /> },
        { path: "/app/campaigns", label: "Campaigns", icon: <IconChart /> },
        { path: "/app/success-stories", label: "Success stories", icon: <IconUsers /> },
        { path: "/app/merchandise", label: "Merchandise", icon: <IconBook /> },
      ],
      pathname
    ),
    section(
      "General",
      [
        { path: "/app/homepage", label: "Homepage", icon: <IconBook /> },
        { path: "/app/billing", label: "Billing", icon: <IconWallet /> },
        { path: "/app/settings", label: "Settings", icon: <IconSettings /> },
      ],
      pathname
    ),
  ];
}

export function centerNavSections(pathname: string): ShellNavSection[] {
  return [
    section("Main menu", [{ path: "/app", label: "Home", icon: <IconHome /> }], pathname),
    section(
      "Features",
      [
        { path: "/app/leads", label: "Leads", icon: <IconClipboard /> },
        { path: "/app/students", label: "Students", icon: <IconUsers /> },
        { path: "/app/batches", label: "Batches", icon: <IconGraduation /> },
        { path: "/app/curriculum", label: "Curriculum", icon: <IconBook /> },
        { path: "/app/fees", label: "Fees & Payments", icon: <IconWallet /> },
        { path: "/app/inventory", label: "Inventory", icon: <IconBuilding /> },
        { path: "/app/merchandise", label: "Merchandise", icon: <IconBook /> },
        { path: "/app/campaigns", label: "Campaigns", icon: <IconChart /> },
        { path: "/app/reports", label: "Reports", icon: <IconChart /> },
      ],
      pathname
    ),
    section("General", [{ path: "/app/settings", label: "Settings", icon: <IconSettings /> }], pathname),
  ];
}

const STUDENT_MAIN_NAV: NavDef[] = [
  { path: "/", label: "Home", icon: <IconHome /> },
  { path: "/progress", label: "Progress", icon: <IconChart /> },
  { path: "/competitions", label: "Events", icon: <IconGraduation /> },
  { path: "/activity", label: "Activity", icon: <IconClipboard /> },
];

const STUDENT_PROFILE_NAV: NavDef = {
  path: "/profile",
  label: "Profile",
  icon: <IconSettings />,
};

function studentNavActive(path: string, pathname: string): boolean {
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

function studentNavId(path: string): string {
  const ids: Record<string, string> = {
    "/": "home",
    "/progress": "progress",
    "/competitions": "events",
    "/activity": "activity",
    "/profile": "profile",
  };
  return ids[path] ?? path.replace(/^\//, "");
}

export function studentBottomNavItems(pathname: string) {
  return [...STUDENT_MAIN_NAV, STUDENT_PROFILE_NAV].map((nav) => ({
    id: studentNavId(nav.path),
    href: nav.path,
    label: nav.label,
    active: studentNavActive(nav.path, pathname),
  }));
}

/** Flatten sidebar sections into bottom-nav links (excludes logout / action-only items). */
export function staffBottomNavFromSections(sections: ShellNavSection[]): ShellNavItem[] {
  return sections.flatMap((section) => section.items.filter((item) => item.href !== "#"));
}

export function studentNavSections(pathname: string): ShellNavSection[] {
  return [
    section("Main menu", STUDENT_MAIN_NAV, pathname),
    section("General", [STUDENT_PROFILE_NAV], pathname),
  ];
}

export function supportNavItem(): ShellNavItem {
  return { href: "/profile", label: "Support", icon: <IconHelp /> };
}

export function signOutNavItem(onSignOut: () => void): ShellNavItem {
  return {
    href: "#",
    label: "Logout",
    icon: <IconLogout />,
    danger: true,
    onClick: onSignOut,
  };
}
