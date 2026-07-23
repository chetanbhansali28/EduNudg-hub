import { vi } from "vitest";

/**
 * Vitest ≥4 required on Node 24: jsdom + Vitest 2/3 replaces AbortSignal such that
 * undici (Node 24) rejects React Router navigations with
 * "Expected signal to be an instance of AbortSignal".
 * @see https://github.com/vitest-dev/vitest/issues/8374
 */

// jsdom does not implement scrollIntoView; unhandled throws fail the suite exit code.
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
