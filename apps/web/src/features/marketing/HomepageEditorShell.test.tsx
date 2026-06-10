import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import {
  EditorAccordion,
  EditorFieldsGrid,
  EditorItemList,
  EditorItemPanel,
  HomepageEditorPanel,
  HomepageEditorSections,
  HomepageEditorShell,
} from "./HomepageEditorShell";
import { Input } from "@edunudg/ui";

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

describe("Homepage editor layout helpers", () => {
  it("regression_editor_fields_grid_and_item_panel_render_shared_classes", () => {
    const { container } = render(
      <EditorItemList onAdd={vi.fn()} addLabel="+ Add item">
        <EditorItemPanel title="Item 1" onRemove={vi.fn()} removeLabel="Remove item">
          <EditorFieldsGrid>
            <Input label="Field A" value="" onChange={() => undefined} />
            <Input label="Field B" value="" onChange={() => undefined} />
          </EditorFieldsGrid>
        </EditorItemPanel>
      </EditorItemList>
    );

    expect(container.querySelector(".ed-editable-form .ed-form-grid")).toBeTruthy();
    expect(container.querySelector(".ed-editor-item-panel")).toBeTruthy();
    expect(container.querySelector(".ed-editor-item-list__add .ed-btn--primary")).toBeTruthy();
    expect(container.querySelector(".ed-editor-item-panel__remove .ed-btn--danger")).toBeTruthy();
    expect(screen.getByRole("button", { name: "+ Add item" })).toBeDefined();
  });
});
