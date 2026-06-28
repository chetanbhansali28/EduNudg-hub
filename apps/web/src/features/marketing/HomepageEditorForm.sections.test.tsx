import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { HomepageEditorForm } from "./HomepageEditorForm";

describe("HomepageEditorForm section controls", () => {
  it("regression_toggle_disables_highlights_section_and_persists", () => {
    const onChange = vi.fn();
    const onPersist = vi.fn();

    const config = {
      ...DEFAULT_HOMEPAGE_CONFIG,
      sections: { ...DEFAULT_HOMEPAGE_CONFIG.sections, highlights: true },
    };

    render(
      <HomepageEditorForm
        config={config}
        onChange={onChange}
        onPersist={onPersist}
        portalMode="brand"
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Highlight cards \(horizontal scroller\)/i })
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
      <HomepageEditorForm config={config} onChange={onChange} onPersist={onPersist} portalMode="brand" />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Highlight cards \(horizontal scroller\)/i })
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

    fireEvent.click(screen.getByRole("button", { name: /Testimonials/i }));
    fireEvent.click(screen.getAllByRole("button", { name: "Move down" })[0]!);

    const next = onChange.mock.calls.at(-1)?.[0];
    expect(next.testimonials.items).toEqual([
      { quote: "Second quote with enough characters to pass the minimum length check.", author: "B" },
      { quote: "First quote with enough characters to pass the minimum length check.", author: "A" },
    ]);
    expect(onPersist).toHaveBeenCalled();
  });

  it("regression_testimonials_split_layout_and_character_hint", () => {
    const config = {
      ...DEFAULT_HOMEPAGE_CONFIG,
      testimonials: {
        ...DEFAULT_HOMEPAGE_CONFIG.testimonials,
        items: [{ quote: "Short", author: "A" }],
      },
    };

    const { container } = render(
      <HomepageEditorForm config={config} onChange={() => undefined} />
    );

    fireEvent.click(screen.getByRole("button", { name: /Testimonials/i }));

    expect(container.querySelector(".ed-editor-accordion__split")).toBeTruthy();
    expect(screen.getByText(/Editor tip/i)).toBeDefined();
    expect(screen.getByText(/5 \/ 100 characters/)).toBeDefined();
  });
});
