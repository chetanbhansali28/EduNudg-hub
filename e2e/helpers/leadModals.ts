import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Public lead forms:
 * - Abacus Classic / Spark Academy → <dialog> modals (LeadModalHashOpener)
 * - Novu → inline sections (#enroll-student, #register, #apply, #enroll)
 *
 * Seeded E2E brand `abacusworld` uses Novu, so helpers must support both.
 */
export function leadDialog(page: Page): Locator {
  return page.locator("dialog[open]").first();
}

function sectionIdFromHash(hash: string): string {
  const raw = hash.replace(/^#/, "").trim().toLowerCase() || "enroll-student";
  if (raw === "enroll") return "enroll-student";
  return raw;
}

export function leadInlineSection(page: Page, hash: string): Locator {
  return page.locator(`#${sectionIdFromHash(hash)}`);
}

/** Visible lead form: open dialog (modal themes) or inline section (Novu). */
export async function expectLeadFormReady(page: Page, hash = "#enroll-student"): Promise<Locator> {
  const dialog = leadDialog(page);
  const section = leadInlineSection(page, hash);

  await expect(dialog.or(section).first()).toBeVisible({ timeout: 20_000 });

  if (await dialog.isVisible().catch(() => false)) {
    await expect(dialog.getByLabel("Parent name").or(dialog.getByLabel("Full name"))).toBeVisible({
      timeout: 5_000,
    });
    return dialog;
  }

  await expect(section).toBeVisible({ timeout: 5_000 });
  await expect(section.getByLabel("Parent name").or(section.getByLabel("Full name"))).toBeVisible({
    timeout: 5_000,
  });
  return section;
}

/** @deprecated Prefer expectLeadFormReady — kept for specs that still name this. */
export async function expectLeadDialogOpen(page: Page, hash = "#enroll-student") {
  return expectLeadFormReady(page, hash);
}

/** Navigate so hash openers / scroll targets always resolve after landing HTML is ready. */
export async function openLeadDeepLink(page: Page, url: string) {
  const target = new URL(url);
  const hash = target.hash || "#enroll-student";
  await page.goto(`${target.origin}${target.pathname}${target.search}`);
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate((nextHash) => {
    if (window.location.hash === nextHash) {
      window.location.hash = "";
    }
    window.location.hash = nextHash;
  }, hash);
  return expectLeadFormReady(page, hash);
}

const SUBMIT_NAME =
  /book free demo|request a free trial|register for a free trial|submit|apply|enroll|register/i;

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
  const hash = deepLinkUrl ? new URL(deepLinkUrl).hash || "#enroll-student" : "#enroll-student";
  if (deepLinkUrl) await openLeadDeepLink(page, deepLinkUrl);
  else await expectLeadFormReady(page, hash);
  const form = (await leadDialog(page).isVisible().catch(() => false))
    ? leadDialog(page)
    : leadInlineSection(page, hash);
  await form.getByLabel("Parent name").fill(fields.parentName);
  await form.getByLabel("WhatsApp number").fill(fields.whatsapp);
  await form.getByLabel("Email").fill(fields.email);
  await form.getByLabel("Child name").fill(fields.childName);
  await form.getByLabel("City", { exact: true }).fill(fields.city);
  await form.getByLabel("Pincode", { exact: true }).fill(fields.pincode);
  await form.getByRole("button", { name: SUBMIT_NAME }).click();
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
  const hash = deepLinkUrl ? new URL(deepLinkUrl).hash || "#register" : "#register";
  if (deepLinkUrl) await openLeadDeepLink(page, deepLinkUrl);
  else await expectLeadFormReady(page, hash);
  const form = (await leadDialog(page).isVisible().catch(() => false))
    ? leadDialog(page)
    : leadInlineSection(page, hash);
  await form.getByLabel("Parent name").fill(fields.parentName);
  await form.getByLabel("WhatsApp number").fill(fields.whatsapp);
  await form.getByLabel("Email").fill(fields.email);
  await form.getByLabel("Child name").fill(fields.childName);
  await form.getByRole("button", { name: SUBMIT_NAME }).click();
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
  const hash = deepLinkUrl ? new URL(deepLinkUrl).hash || "#apply" : "#apply";
  if (deepLinkUrl) await openLeadDeepLink(page, deepLinkUrl);
  else await expectLeadFormReady(page, hash);
  const form = (await leadDialog(page).isVisible().catch(() => false))
    ? leadDialog(page)
    : leadInlineSection(page, hash);
  await form.getByLabel("Full name").fill(fields.fullName);
  await form.getByLabel("Email").fill(fields.email);
  await form.getByLabel("WhatsApp number").fill(fields.whatsapp);
  await form.getByLabel("City", { exact: true }).fill(fields.city);
  if (fields.qualification) {
    await form.getByLabel("Educational qualification").fill(fields.qualification);
  }
  await form.getByRole("button", { name: /apply for franchise|submit|apply/i }).click();
}
