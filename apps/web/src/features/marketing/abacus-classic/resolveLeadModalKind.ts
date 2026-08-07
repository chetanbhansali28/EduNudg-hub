import type { LeadModalKind } from "./LeadModalContext";

/** Map marketing CTA / deep-link hrefs to lead modal kinds. */
export function resolveLeadModalKind(href: string): Exclude<LeadModalKind, null> | null {
  const normalized = href.replace(/^#/, "").trim().toLowerCase();
  if (normalized === "apply") return "apply";
  if (
    normalized === "enroll" ||
    normalized === "enroll-student" ||
    normalized === "register"
  ) {
    return "enroll";
  }
  return null;
}
