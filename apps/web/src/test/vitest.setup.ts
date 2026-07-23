import { vi } from "vitest";

// jsdom does not implement scrollIntoView; unhandled throws fail the suite exit code.
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
