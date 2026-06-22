import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  PlatformSettingsCard,
  PlatformSettingsPageHeader,
  PlatformSettingsShell,
  PlatformSettingsToggleRow,
  ThemeProvider,
} from "@edunudg/ui";

describe("Platform settings UI theme", () => {
  it("renders header and toggle row", () => {
    render(
      <ThemeProvider>
        <PlatformSettingsShell>
          <PlatformSettingsPageHeader
            title="Platform Settings"
            subtitle="Configure global security, commerce, and brand visibility."
          />
          <PlatformSettingsCard>
            <PlatformSettingsToggleRow
              title="Email & Password"
              description="Standard login method"
              checked
              onChange={() => undefined}
            />
          </PlatformSettingsCard>
        </PlatformSettingsShell>
      </ThemeProvider>
    );

    expect(screen.getByText("Platform Settings")).toBeDefined();
    expect(screen.getByText("Email & Password")).toBeDefined();
    expect(document.querySelector(".ed-pfset")).toBeTruthy();
  });
});
