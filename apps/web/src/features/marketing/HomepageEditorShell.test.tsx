import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import {
  EditorAccordion,
  HomepageEditorPanel,
  HomepageEditorSections,
  HomepageEditorShell,
} from "./HomepageEditorShell";

describe("HomepageEditorShell", () => {
  it("regression_save_button_lives_in_hero_card", () => {
    const { container } = render(
      <HomepageEditorShell title="Marketing & theming" subtitle="Edit the public site." onSave={vi.fn()}>
        <p>Form</p>
      </HomepageEditorShell>
    );
    const hero = container.querySelector(".ed-editor-hero-card");
    const btn = hero?.querySelector(".ed-editor-hero-card__save");
    expect(btn?.textContent).toContain("Save changes");
  });

  it("regression_sticky_save_bar_on_mobile_when_onSave_provided", () => {
    const { container } = render(
      <HomepageEditorShell title="Marketing homepage" onSave={vi.fn()}>
        <p>Form</p>
      </HomepageEditorShell>
    );
    expect(container.querySelector(".ed-homepage-editor-shell--has-save")).toBeTruthy();
    expect(container.querySelector(".ed-editor-save-bar--mobile")).toBeTruthy();
  });

  it("regression_panel_hero_save_button", () => {
    const onSave = vi.fn();
    render(
      <HomepageEditorShell title="Marketing pages">
        <HomepageEditorPanel title="Brand site" description="Franchise recruitment" onSave={onSave}>
          <p>Editor fields</p>
        </HomepageEditorPanel>
      </HomepageEditorShell>
    );
    expect(screen.getByText("Brand site")).toBeDefined();
    expect(screen.getByRole("button", { name: /Save changes/i })).toBeDefined();
  });
});

describe("EditorAccordion", () => {
  function renderAccordion(ui: ReactElement) {
    return render(<HomepageEditorSections>{ui}</HomepageEditorSections>);
  }

  it("regression_collapsed_by_default", () => {
    const { container } = renderAccordion(
      <EditorAccordion sectionId="hero" title="Hero">
        <p>Form fields</p>
      </EditorAccordion>
    );
    expect(container.querySelector(".ed-editor-accordion--open")).toBeNull();
    expect(screen.getByRole("button", { name: /Hero/i })).toBeDefined();
  });

  it("regression_single_open_accordion", () => {
    renderAccordion(
      <>
        <EditorAccordion sectionId="hero" title="Hero">
          <p>Hero fields</p>
        </EditorAccordion>
        <EditorAccordion sectionId="faq" title="FAQ">
          <p>FAQ fields</p>
        </EditorAccordion>
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: /Hero/i }));
    expect(screen.getByText("Hero fields")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /FAQ/i }));
    expect(screen.queryByText("Hero fields")).toBeNull();
    expect(screen.getByText("FAQ fields")).toBeDefined();
  });

  it("regression_shows_icon_subtitle_and_visibility_when_open", () => {
    const { container } = renderAccordion(
      <EditorAccordion sectionId="faq" title="FAQ" enabled onEnabledChange={() => undefined}>
        <p>Form fields</p>
      </EditorAccordion>
    );

    expect(screen.getByText("Common questions and answers")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /FAQ/i }));
    expect(screen.getByText("Visible on site")).toBeDefined();
    expect(container.querySelector(".ed-editor-accordion--open")).toBeTruthy();
  });
});
