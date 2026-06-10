import type { ReactNode } from "react";
import type { ShellNavItem, ShellNavSection } from "@edunudg/ui";
import {
  IconBook,
  IconBuilding,
  IconChart,
  IconClipboard,
  IconGraduation,
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
        { path: "/app/centers", label: "Franchise Centers", icon: <IconBuilding /> },
        { path: "/app/royalties", label: "Royalties", icon: <IconWallet /> },
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
        { path: "/app/attendance", label: "Attendance", icon: <IconChart /> },
        { path: "/app/fees", label: "Fees & Payments", icon: <IconWallet /> },
        { path: "/app/inventory", label: "Inventory", icon: <IconBuilding /> },
        { path: "/app/merchandise", label: "Merchandise orders", icon: <IconBook /> },
        { path: "/app/campaigns", label: "Campaigns", icon: <IconChart /> },
        { path: "/app/assessments", label: "Assessments", icon: <IconClipboard /> },
        { path: "/app/reports", label: "Reports", icon: <IconChart /> },
      ],
      pathname
    ),
    section("General", [{ path: "/app/settings", label: "Settings", icon: <IconSettings /> }], pathname),
  ];
}

export function studentNavSections(pathname: string): ShellNavSection[] {
  return [
    section("Main menu", [{ path: "/", label: "Dashboard", icon: <IconHome /> }], pathname),
    section("General", [{ path: "/profile", label: "Profile", icon: <IconSettings /> }], pathname),
  ];
}

export function signOutNavItem(onSignOut: () => void): ShellNavItem {
  return {
    href: "#",
    label: "Log out",
    icon: <IconLogout />,
    danger: true,
    onClick: onSignOut,
  };
}
