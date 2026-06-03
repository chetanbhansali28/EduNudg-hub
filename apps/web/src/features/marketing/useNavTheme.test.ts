import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNavTheme } from "./useNavTheme";

describe("useNavTheme", () => {
  beforeEach(() => {
    vi.stubGlobal("innerWidth", 1024);
    if (typeof document.elementsFromPoint !== "function") {
      document.elementsFromPoint = () => [];
    }
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("regression_uses_topmost_element_not_sticky_hero_bounds", () => {
    const hero = document.createElement("section");
    hero.setAttribute("data-nav-theme", "hero");
    document.body.appendChild(hero);

    const main = document.createElement("main");
    main.setAttribute("data-nav-theme", "light");
    const copy = document.createElement("p");
    copy.textContent = "Stronger mental math";
    main.appendChild(copy);
    document.body.appendChild(main);

    vi.spyOn(hero, "getBoundingClientRect").mockReturnValue({
      top: 0,
      bottom: 800,
      left: 0,
      right: 0,
      width: 0,
      height: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    vi.spyOn(main, "getBoundingClientRect").mockReturnValue({
      top: -600,
      bottom: 4000,
      left: 0,
      right: 0,
      width: 0,
      height: 4600,
      x: 0,
      y: -600,
      toJSON: () => ({}),
    } as DOMRect);

    vi.spyOn(document, "elementsFromPoint").mockReturnValue([copy, main, hero]);

    const { result } = renderHook(() => useNavTheme());

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe("light");
  });

  it("regression_bounds_fallback_prefers_light_when_both_overlap", () => {
    const hero = document.createElement("section");
    hero.setAttribute("data-nav-theme", "hero");
    document.body.appendChild(hero);

    const main = document.createElement("main");
    main.setAttribute("data-nav-theme", "light");
    document.body.appendChild(main);

    vi.spyOn(hero, "getBoundingClientRect").mockReturnValue({
      top: 0,
      bottom: 800,
      left: 0,
      right: 0,
      width: 0,
      height: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    vi.spyOn(main, "getBoundingClientRect").mockReturnValue({
      top: 40,
      bottom: 2000,
      left: 0,
      right: 0,
      width: 0,
      height: 1960,
      x: 0,
      y: 40,
      toJSON: () => ({}),
    } as DOMRect);

    vi.spyOn(document, "elementsFromPoint").mockReturnValue([]);

    const { result } = renderHook(() => useNavTheme());

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe("light");
  });
});
