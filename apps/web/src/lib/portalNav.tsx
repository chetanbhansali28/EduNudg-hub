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

type NavDef = { path: string; label: string; icon: ReactNode; badge?: number };

function item(path: string, label: string, icon: ReactNode, pathname: string, badge?: number): ShellNavItem {
  const active =
    path === "/"
      ? pathname === "/" || pathname === "/admin"
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
        { path: "/admin/revenue", label: "Revenue & Usage", icon: <IconChart />, badge: 20 },
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
      "Features",
      [
        { path: "/app/curriculum", label: "Curriculum", icon: <IconBook /> },
        { path: "/app/centers", label: "Franchise Centers", icon: <IconBuilding /> },
        { path: "/app/royalties", label: "Royalties", icon: <IconWallet /> },
        { path: "/app/analytics", label: "Analytics", icon: <IconChart /> },
      ],
      pathname
    ),
    section("General", [{ path: "/app/settings", label: "Settings", icon: <IconSettings /> }], pathname),
  ];
}

export function centerNavSections(pathname: string): ShellNavSection[] {
  return [
    section("Main menu", [{ path: "/app", label: "Home", icon: <IconHome /> }], pathname),
    section(
      "Features",
      [
        { path: "/app/admissions", label: "Admissions", icon: <IconClipboard /> },
        { path: "/app/students", label: "Students", icon: <IconUsers /> },
        { path: "/app/batches", label: "Batches", icon: <IconGraduation /> },
        { path: "/app/attendance", label: "Attendance", icon: <IconChart /> },
        { path: "/app/fees", label: "Fees & Payments", icon: <IconWallet /> },
        { path: "/app/inventory", label: "Inventory", icon: <IconBuilding /> },
      ],
      pathname
    ),
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
