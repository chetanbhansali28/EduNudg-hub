import { screen, waitFor } from "@testing-library/react";
import { expect } from "vitest";

/** Wait for post-login navigation; CI runners need a longer window than the default. */
export async function expectRedirectTo(text: string, timeout = 5000) {
  await waitFor(
    () => {
      expect(screen.getByText(text)).toBeDefined();
    },
    { timeout }
  );
}
