import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:9000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /auth\.setup\.ts/,
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "pnpm --filter @edunudg/web preview",
    url: "http://127.0.0.1:9000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
