import type { HomepageConfig } from "@/types/homepage";

/** Applies marketing font CSS variables from homepage config (platform + brand public sites). */
export function applyMarketingFontsFromConfig(config: HomepageConfig): void {
  document.documentElement.style.setProperty(
    "--novu-font-sans",
    `"${config.meta.fontSans}", system-ui, sans-serif`
  );
  document.documentElement.style.setProperty(
    "--novu-font-serif",
    `"${config.meta.fontSerif}", Georgia, serif`
  );
}

export function applyMarketingThemeVariables(config: HomepageConfig): void {
  document.documentElement.style.setProperty("--novu-yellow", config.theme.yellowGlow);
  document.documentElement.style.setProperty("--novu-radius-section", config.theme.radiusSection);
  applyMarketingFontsFromConfig(config);
}
