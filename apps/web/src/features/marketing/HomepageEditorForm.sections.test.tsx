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

    const toggle = screen.getByLabelText("Highlight cards (horizontal scroller) visible on site");
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

  it("regression_testimonials_move_up_down_reorders", () => {
    const onChange = vi.fn();
    const onPersist = vi.fn();
    const config = {
      ...DEFAULT_HOMEPAGE_CONFIG,
      testimonials: {
        ...DEFAULT_HOMEPAGE_CONFIG.testimonials,
        items: [
          { quote: "First quote with enough characters to pass the minimum length check.", author: "A" },
          { quote: "Second quote with enough characters to pass the minimum length check.", author: "B" },
        ],
      },
    };

    render(<HomepageEditorForm config={config} onChange={onChange} onPersist={onPersist} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Move down" })[0]!);

    const next = onChange.mock.calls.at(-1)?.[0];
    expect(next.testimonials.items).toEqual([
      { quote: "Second quote with enough characters to pass the minimum length check.", author: "B" },
      { quote: "First quote with enough characters to pass the minimum length check.", author: "A" },
    ]);
    expect(onPersist).toHaveBeenCalled();
  });

  it("regression_testimonials_character_count_hint", () => {
    const config = {
      ...DEFAULT_HOMEPAGE_CONFIG,
      testimonials: {
        ...DEFAULT_HOMEPAGE_CONFIG.testimonials,
        items: [{ quote: "Short", author: "A" }],
      },
    };

    render(<HomepageEditorForm config={config} onChange={() => undefined} />);

    expect(screen.getByText(/5 \/ 100 characters/)).toBeDefined();
    expect(screen.getByText(/shorter than recommended/)).toBeDefined();
  });
});
