import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBrandMerchMobile } from "./useBrandMerchBreakpoint";

describe("useBrandMerchMobile", () => {
  const listeners: Array<() => void> = [];
  let matches = false;

  beforeEach(() => {
    matches = false;
    vi.stubGlobal("matchMedia", vi.fn().mockImplementation(() => ({
      get matches() {
        return matches;
      },
      addEventListener: (_: string, fn: () => void) => listeners.push(fn),
      removeEventListener: (_: string, fn: () => void) => {
        const index = listeners.indexOf(fn);
        if (index >= 0) listeners.splice(index, 1);
      },
    })));
  });

  afterEach(() => {
    listeners.length = 0;
    vi.unstubAllGlobals();
  });

  it("returns true when viewport is mobile width", () => {
    matches = true;
    const { result } = renderHook(() => useBrandMerchMobile());
    expect(result.current).toBe(true);
  });

  it("updates when media query changes", () => {
    matches = false;
    const { result } = renderHook(() => useBrandMerchMobile());
    expect(result.current).toBe(false);

    act(() => {
      matches = true;
      listeners.forEach((fn) => fn());
    });

    expect(result.current).toBe(true);
  });
});
