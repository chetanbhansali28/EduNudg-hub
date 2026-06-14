/** Human-readable relative time, e.g. "2 hours ago". */
export function formatRelativeTime(iso: string | Date): string {
  const then = typeof iso === "string" ? new Date(iso).getTime() : iso.getTime();
  const diffSec = Math.round((Date.now() - then) / 1000);
  const abs = Math.abs(diffSec);

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (abs < 60) return rtf.format(-diffSec, "second");
  if (abs < 3600) return rtf.format(-Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(-Math.round(diffSec / 3600), "hour");
  if (abs < 604800) return rtf.format(-Math.round(diffSec / 86400), "day");
  return rtf.format(-Math.round(diffSec / 604800), "week");
}

export function formatLastSavedLabel(updatedAt: string | null | undefined): string | null {
  if (!updatedAt) return null;
  const parsed = new Date(updatedAt);
  if (Number.isNaN(parsed.getTime())) return null;
  return `Last saved: ${formatRelativeTime(parsed)}`;
}
