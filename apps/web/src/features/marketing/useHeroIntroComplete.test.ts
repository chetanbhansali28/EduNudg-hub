import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { HERO_INTRO_COMPLETE_MS, useHeroIntroComplete } from "./useHeroIntroComplete";

describe("useHeroIntroComplete", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("regression_completes_after_hero_intro_duration", () => {
    const { result } = renderHook(() => useHeroIntroComplete());
    expect(result.current).toBe(false);
    act(() => {
      vi.advanceTimersByTime(HERO_INTRO_COMPLETE_MS + 300);
    });
    expect(result.current).toBe(true);
  });
});
