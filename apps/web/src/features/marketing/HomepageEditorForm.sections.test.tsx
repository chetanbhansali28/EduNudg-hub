import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { HomepageEditorForm } from "./HomepageEditorForm";

describe("HomepageEditorForm section controls", () => {
  it("regression_toggle_disables_highlights_section_and_persists", () => {
    const onChange = vi.fn();
    const onPersist = vi.fn();

    render(
      <HomepageEditorForm
        config={DEFAULT_HOMEPAGE_CONFIG}
        onChange={onChange}
        onPersist={onPersist}
      />
    );

    const toggle = screen.getByLabelText("Show Highlight cards (horizontal scroller) on public site");
    fireEvent.click(toggle);

    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls.at(-1)?.[0];
    expect(next.sections?.highlights).toBe(false);
    expect(onPersist).toHaveBeenCalled();
  });

  it("regression_remove_highlight_card_reduces_showcase_cards", () => {
    const onChange = vi.fn();
    const onPersist = vi.fn();
    const config = {
      ...DEFAULT_HOMEPAGE_CONFIG,
      showcaseCards: DEFAULT_HOMEPAGE_CONFIG.showcaseCards.slice(0, 2),
    };

    render(
      <HomepageEditorForm config={config} onChange={onChange} onPersist={onPersist} />
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Remove this card" })[0]!);

    const next = onChange.mock.calls.at(-1)?.[0];
    expect(next.showcaseCards).toHaveLength(1);
    expect(onPersist).toHaveBeenCalled();
  });
});
