import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSavedFlash } from "./useSavedFlash";

describe("useSavedFlash", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("flashes saved true then clears after duration", () => {
    const { result } = renderHook(() => useSavedFlash(3000));
    expect(result.current.saved).toBe(false);

    act(() => {
      result.current.flash();
    });
    expect(result.current.saved).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(result.current.saved).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.saved).toBe(false);
  });
});
