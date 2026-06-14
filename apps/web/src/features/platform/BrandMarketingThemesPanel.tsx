import { MARKETING_THEME_LABELS, MARKETING_THEMES } from "@/types/homepage";

export function marketingThemeSelectOptions() {
  return MARKETING_THEMES.map((theme) => ({
    value: theme,
    label: MARKETING_THEME_LABELS[theme],
  }));
}
