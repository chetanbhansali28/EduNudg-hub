import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { authStatePath, hasE2EBackend, type E2EPersona } from "./helpers/env";
import { loginOnPage } from "./helpers/auth";

const personas: E2EPersona[] = ["platform", "brand", "center", "student"];

function writeEmptyStates() {
  const authDir = path.dirname(authStatePath("platform"));
  fs.mkdirSync(authDir, { recursive: true });
  for (const persona of personas) {
    fs.writeFileSync(authStatePath(persona), JSON.stringify({ cookies: [], origins: [] }));
  }
}

setup("prepare auth storage states", async ({ browser }) => {
  writeEmptyStates();

  if (!hasE2EBackend()) {
    return;
  }

  for (const persona of personas) {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await loginOnPage(page, persona);

      if (persona === "platform") {
        await expect(page).toHaveURL(/\/admin/, { timeout: 30_000 });
      } else if (persona === "student") {
        await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
      } else {
        await expect(page).toHaveURL(/\/app/, { timeout: 30_000 });
      }

      await context.storageState({ path: authStatePath(persona) });
    } catch (err) {
      // Keep empty state so smoke specs still run; golden paths will fail clearly if auth required.
      console.warn(`[auth.setup] skipped storage for ${persona}:`, err);
    } finally {
      await context.close();
    }
  }
});
