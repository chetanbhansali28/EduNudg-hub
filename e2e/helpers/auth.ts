import type { Page } from "@playwright/test";
import { E2E_USERS, type E2EPersona } from "./env";
import { brandUrl, centerUrl, learnUrl, platformUrl } from "./portal";

export async function loginOnPage(
  page: Page,
  persona: E2EPersona,
  opts?: { brandSlug?: string; centerSlug?: string }
) {
  const user = E2E_USERS[persona];
  let loginUrl: string;
  if (persona === "platform") {
    loginUrl = platformUrl("/login");
  } else if (persona === "brand") {
    loginUrl = brandUrl(opts?.brandSlug ?? "abacusworld", "/login");
  } else if (persona === "center") {
    loginUrl = centerUrl(
      opts?.brandSlug ?? "abacusworld",
      opts?.centerSlug ?? "koramangala",
      "/login"
    );
  } else {
    loginUrl = learnUrl(opts?.brandSlug ?? "abacusworld", "/login");
  }

  await page.goto(loginUrl);
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.locator('input[type="password"][name="password"]').fill(user.password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
}

/** Unique 10-digit Indian mobile suffix for WhatsApp merge isolation. */
export function uniqueWhatsApp(): string {
  const n = Date.now() % 10_000_000_000;
  return `9${String(n).padStart(9, "0").slice(-9)}`;
}
