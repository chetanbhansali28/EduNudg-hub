import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Public lead forms:
 * - Abacus Classic / Spark Academy / EduLearn → <dialog> modals (LeadModalHashOpener)
 * - Novu → inline sections (#enroll-student, #register, #apply, #enroll)
 *
 * Seeded E2E brand `abacusworld` uses Novu. Franchise Novu labels are Phone /
 * Preferred city; modal themes use WhatsApp number / City.
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

async function fillByLabels(root: Locator, labels: string[], value: string) {
  for (const label of labels) {
    const field = root.getByLabel(label, { exact: true });
    if ((await field.count()) === 0) continue;
    if (!(await field.first().isVisible().catch(() => false))) continue;
    await field.first().fill(value);
    return;
  }
  await root.getByLabel(labels[0]!, { exact: true }).fill(value);
}

async function submitLeadForm(form: Locator) {
  const typed = form.locator('button[type="submit"]').first();
  if ((await typed.count()) > 0) {
    await typed.click();
    return;
  }
  await form.getByRole("button", { name: SUBMIT_NAME }).click();
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

export async function expectLeadReceived(page: Page, match = /received|contact you|thank|success/i) {
  const status = page.getByRole("status").filter({ hasText: match });
  const alert = page.getByRole("alert");
  await expect(status.or(alert).first()).toBeVisible({ timeout: 20_000 });
  if ((await status.isVisible().catch(() => false)) === false) {
    const detail = (await alert.textContent().catch(() => ""))?.trim() || "unknown error";
    throw new Error(`Lead submit did not succeed: ${detail}`);
  }
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
  const hash = deepLinkUrl ? new URL(deepLinkUrl).hash || "#enroll-student" : "#enroll-student";
  const form = deepLinkUrl ? await openLeadDeepLink(page, deepLinkUrl) : await expectLeadFormReady(page, hash);
  await form.getByLabel("Parent name").fill(fields.parentName);
  await fillByLabels(form, ["WhatsApp number", "Phone"], fields.whatsapp);
  await form.getByLabel("Email").fill(fields.email);
  await form.getByLabel("Child name").fill(fields.childName);
  await fillByLabels(form, ["City", "Preferred city"], fields.city);
  await fillByLabels(form, ["Pincode", "Pincode (optional)"], fields.pincode);
  await submitLeadForm(form);
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
  const form = deepLinkUrl ? await openLeadDeepLink(page, deepLinkUrl) : await expectLeadFormReady(page, hash);
  await form.getByLabel("Parent name").fill(fields.parentName);
  await fillByLabels(form, ["WhatsApp number", "Phone"], fields.whatsapp);
  await form.getByLabel("Email").fill(fields.email);
  await form.getByLabel("Child name").fill(fields.childName);
  await submitLeadForm(form);
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
  const form = deepLinkUrl ? await openLeadDeepLink(page, deepLinkUrl) : await expectLeadFormReady(page, hash);
  await form.getByLabel("Full name").fill(fields.fullName);
  await form.getByLabel("Email").fill(fields.email);
  await fillByLabels(form, ["WhatsApp number", "Phone"], fields.whatsapp);
  await fillByLabels(form, ["City", "Preferred city"], fields.city);
  if (fields.qualification) {
    const qual = form.getByLabel("Educational qualification", { exact: true });
    if ((await qual.count()) > 0 && (await qual.isVisible().catch(() => false))) {
      await qual.fill(fields.qualification);
    }
  }
  await submitLeadForm(form);
}
