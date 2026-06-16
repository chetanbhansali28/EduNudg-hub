import type { ShellNavSection } from "@edunudg/ui";
import { StaffBottomNav } from "@/features/shared/StaffBottomNav";
import { staffBottomNavFromSections } from "@/lib/portalNav";

export function StaffMobileChrome({
  sections,
  ariaLabel,
}: {
  sections: ShellNavSection[];
  ariaLabel: string;
}) {
  const items = staffBottomNavFromSections(sections);
  if (items.length === 0) return null;

  return <StaffBottomNav ariaLabel={ariaLabel} items={items} />;
}
