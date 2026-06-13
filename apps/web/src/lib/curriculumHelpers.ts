export const DEFAULT_UNITS_MODULE_TITLE = "Units";

export function topicsToString(topics: string[] | unknown): string {
  return Array.isArray(topics) ? topics.filter((t) => typeof t === "string").join(", ") : "";
}

export function parseTopicsComma(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
