import type { ReactNode } from "react";
import { BottomNav } from "@edunudg/ui";
import type { ShellNavItem } from "@edunudg/ui";

export function StaffBottomNav({
  items,
  ariaLabel,
}: {
  items: ShellNavItem[];
  ariaLabel: string;
}) {
  return (
    <BottomNav
      navLabel={ariaLabel}
      scrollable={items.length > 5}
      items={items.map((item) => ({
        href: item.href,
        label: item.label,
        icon: item.icon ?? null,
        active: item.active,
      }))}
    />
  );
}
