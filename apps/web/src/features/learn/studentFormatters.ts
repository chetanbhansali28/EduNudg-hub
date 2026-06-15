export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "Date TBD";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function levelStatusLabel(status: string): string {
  switch (status) {
    case "failed":
      return "Fail";
    case "in_progress":
      return "In progress";
    case "not_started":
      return "Not started";
    case "completed":
      return "Completed";
    case "passed":
      return "Pass";
    default:
      return status.replaceAll("_", " ");
  }
}

export function assessmentResultLabel(passed: boolean | null | undefined): string | null {
  if (passed === true) return "Pass";
  if (passed === false) return "Fail";
  return null;
}

export function studentGreeting(name: string): string {
  const hour = new Date().getHours();
  const salutation = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = name.trim().split(/\s+/)[0] ?? name;
  return `${salutation}, ${first}`;
}

export function studentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}
