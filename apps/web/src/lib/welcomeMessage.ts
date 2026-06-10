/** First token of a display name for greetings ("Priya Sharma" → "Priya"). */
export function firstNameFromDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] ?? "there";
}

/** Morning / afternoon / evening prefix for staff shell greeting. */
export function greetingForHour(hour: number): "Good morning" | "Good afternoon" | "Good evening" {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function buildWelcomeHeading(firstName: string, hour: number = new Date().getHours()): string {
  const greeting = greetingForHour(hour);
  const name = firstNameFromDisplayName(firstName);
  return `${greeting}, ${name} 👋`;
}

export function buildWelcomeSubtitle(portalLabel: string, actionHints: string[]): string {
  if (actionHints.length === 0) return portalLabel;
  return `${portalLabel} · ${actionHints.join(" · ")}`;
}

/** Two-letter initials for pipeline list avatars. */
export function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Compact relative timestamp for pipeline rows. */
export function formatRelativeWhen(iso: string, nowMs: number = Date.now()): string {
  const diffMs = nowMs - new Date(iso).getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
