/** Known platform_settings rows edited via structured forms (not raw JSON). */

export type PlatformSettingField = {
  name: string;
  label: string;
  type: "text" | "timezone";
  placeholder?: string;
};

export type PlatformSettingDefinition = {
  key: string;
  label: string;
  description: string;
  fields: PlatformSettingField[];
};

export const PLATFORM_SETTING_DEFINITIONS: PlatformSettingDefinition[] = [
  {
    key: "defaults",
    label: "Platform defaults",
    description: "Defaults applied platform-wide when a brand or center has no override.",
    fields: [
      {
        name: "timezone",
        label: "Default timezone (IANA)",
        type: "timezone",
        placeholder: "Asia/Kolkata",
      },
    ],
  },
];

export const PLATFORM_SETTING_TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
] as const;

export function platformSettingDefinition(key: string): PlatformSettingDefinition | undefined {
  return PLATFORM_SETTING_DEFINITIONS.find((d) => d.key === key);
}

export function valuesFromPlatformSetting(
  definition: PlatformSettingDefinition,
  value: Record<string, unknown> | undefined
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of definition.fields) {
    out[field.name] = String(value?.[field.name] ?? "");
  }
  return out;
}

export function patchFromPlatformSettingForm(
  definition: PlatformSettingDefinition,
  existing: Record<string, unknown> | undefined,
  form: Record<string, string>
): Record<string, unknown> {
  const next = { ...(existing ?? {}) };
  for (const field of definition.fields) {
    const raw = form[field.name]?.trim() ?? "";
    next[field.name] = raw || null;
  }
  return next;
}
