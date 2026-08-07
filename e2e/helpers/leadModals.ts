import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Spark Academy / Abacus Classic put public lead forms in <dialog> modals.
 * Deep links (#enroll-student, #register, #apply) open them via LeadModalHashOpener.
 * Prefer dialog-scoped locators so closed/hidden dialog inputs are never filled.
 */
export function leadDialog(page: Page): Locator {
  return page.locator("dialog[open]").first();
}

export async function expectLeadDialogOpen(page: Page) {
  const dialog = leadDialog(page);
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await expect(dialog.getByLabel("Parent name").or(dialog.getByLabel("Full name"))).toBeVisible({
    timeout: 5_000,
  });
  return dialog;
}

/** Navigate so hash openers always fire (same-hash goto is a no-op for React Router). */
export async function openLeadDeepLink(page: Page, url: string) {
  const target = new URL(url);
  const hash = target.hash || "#enroll";
  await page.goto(`${target.origin}${target.pathname}${target.search}`);
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate((nextHash) => {
    if (window.location.hash === nextHash) {
      window.location.hash = "";
    }
    window.location.hash = nextHash;
  }, hash);
  return expectLeadDialogOpen(page);
}

export async function fillBrandStudentLead(
  page: Page,
  fields: {
    parentName: string;
    whatsapp: string;
    email: string;
    city: string;
    pincode: string;
    childName: string;
  },
  deepLinkUrl?: string
) {
  if (deepLinkUrl) await openLeadDeepLink(page, deepLinkUrl);
  else await expectLeadDialogOpen(page);
  const dialog = leadDialog(page);
  await dialog.getByLabel("Parent name").fill(fields.parentName);
  await dialog.getByLabel("WhatsApp number").fill(fields.whatsapp);
  await dialog.getByLabel("Email").fill(fields.email);
  await dialog.getByLabel("Child name").fill(fields.childName);
  await dialog.getByLabel("City", { exact: true }).fill(fields.city);
  await dialog.getByLabel("Pincode", { exact: true }).fill(fields.pincode);
  await dialog.getByRole("button", { name: /book free demo|submit|apply|enroll/i }).click();
}

export async function fillCenterStudentRegistration(
  page: Page,
  fields: {
    parentName: string;
    whatsapp: string;
    email: string;
    childName: string;
  },
  deepLinkUrl?: string
) {
  if (deepLinkUrl) await openLeadDeepLink(page, deepLinkUrl);
  else await expectLeadDialogOpen(page);
  const dialog = leadDialog(page);
  await dialog.getByLabel("Parent name").fill(fields.parentName);
  await dialog.getByLabel("WhatsApp number").fill(fields.whatsapp);
  await dialog.getByLabel("Email").fill(fields.email);
  await dialog.getByLabel("Child name").fill(fields.childName);
  await dialog.getByRole("button", { name: /register|submit/i }).click();
}

export async function fillFranchiseApplication(
  page: Page,
  fields: {
    fullName: string;
    email: string;
    whatsapp: string;
    city: string;
    qualification?: string;
  },
  deepLinkUrl?: string
) {
  if (deepLinkUrl) await openLeadDeepLink(page, deepLinkUrl);
  else await expectLeadDialogOpen(page);
  const dialog = leadDialog(page);
  await dialog.getByLabel("Full name").fill(fields.fullName);
  await dialog.getByLabel("Email").fill(fields.email);
  await dialog.getByLabel("WhatsApp number").fill(fields.whatsapp);
  await dialog.getByLabel("City", { exact: true }).fill(fields.city);
  if (fields.qualification) {
    await dialog.getByLabel("Educational qualification").fill(fields.qualification);
  }
  await dialog.getByRole("button", { name: /apply for franchise|submit|apply/i }).click();
}
