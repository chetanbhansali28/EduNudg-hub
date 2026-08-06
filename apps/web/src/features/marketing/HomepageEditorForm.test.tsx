import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import type { HomepageConfig } from "@/types/homepage";
import { HomepageEditorForm } from "./HomepageEditorForm";
import { HomepageEditorShell } from "./HomepageEditorShell";

vi.mock("@/lib/marketingMediaStorage", () => ({
  uploadMarketingMedia: vi.fn(async () => "https://cdn.example.com/uploaded.png"),
}));

describe("HomepageEditorForm", () => {
  it("regression_static_sections_and_collapsed_accordions", () => {
    const { container } = render(
      <HomepageEditorShell title="Homepage Configuration">
        <HomepageEditorForm config={DEFAULT_HOMEPAGE_CONFIG} onChange={() => undefined} />
      </HomepageEditorShell>
    );

    expect(container.querySelector(".ed-homepage-editor-shell")).toBeTruthy();
    expect(container.querySelector(".ed-editor-section-card")).toBeTruthy();

    const accordions = container.querySelectorAll(".ed-editor-accordion");
    expect(accordions.length).toBeGreaterThanOrEqual(5);
    expect(container.querySelector(".ed-editor-accordion--open")).toBeNull();

    expect(screen.getByRole("heading", { name: "Site Identity" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Navigation Management" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Pre-footer CTA & site footer" })).toBeDefined();
    expect(screen.getByText("Hero")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Hero.*Main banner content/i }));
    expect(screen.queryByLabelText("Hero background image URL")).toBeNull();
    expect(screen.getByLabelText("Hero side image")).toBeDefined();
    expect(screen.getAllByRole("button", { name: /Upload file|Replace file/i }).length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector(".ed-editable-form .ed-form-grid")).toBeTruthy();
  });

  it("critical_homepage_media_fields_use_visible_file_pickers", () => {
    render(
      <HomepageEditorShell title="Homepage Configuration">
        <HomepageEditorForm
          config={DEFAULT_HOMEPAGE_CONFIG}
          onChange={() => undefined}
          portalMode="platform"
        />
      </HomepageEditorShell>
    );

    fireEvent.click(screen.getByRole("button", { name: /Hero.*Main banner content/i }));

    expect(screen.getByLabelText("Hero side image").getAttribute("type")).toBe("file");
    expect(screen.queryByLabelText("Connectivity phone image")).toBeNull();
    expect(screen.getByLabelText("Pre-footer side image").getAttribute("type")).toBe("file");

    fireEvent.click(screen.getByRole("button", { name: /Connectivity showcase.*Phone showcase/i }));
    expect(screen.getByLabelText("Center phone image").getAttribute("type")).toBe("file");

    const uploadButtons = screen.getAllByRole("button", { name: /Upload file|Replace file/i });
    expect(uploadButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("regression_platform_connectivity_phone_image_lives_in_connectivity_section", () => {
    render(
      <HomepageEditorShell title="Homepage Configuration">
        <HomepageEditorForm
          config={DEFAULT_HOMEPAGE_CONFIG}
          onChange={() => undefined}
          portalMode="platform"
        />
      </HomepageEditorShell>
    );

    fireEvent.click(screen.getByRole("button", { name: /Hero.*Main banner content/i }));
    expect(screen.queryByLabelText("Connectivity phone image")).toBeNull();
    expect(screen.queryByLabelText("Phone frame image")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Connectivity showcase.*Phone showcase/i }));
    expect(screen.getByLabelText("Center phone image")).toBeDefined();
    expect(
      screen.getByText(/Center phone image appears beside the connectivity cards/i)
    ).toBeDefined();
  });

  it("critical_media_upload_stays_draft_until_page_save", async () => {
    const onChange = vi.fn();
    const onPersist = vi.fn();
    const { uploadMarketingMedia } = await import("@/lib/marketingMediaStorage");
    vi.mocked(uploadMarketingMedia).mockResolvedValue("https://cdn.example.com/draft-footer.png");

    render(
      <HomepageEditorShell title="Homepage Configuration">
        <HomepageEditorForm
          config={DEFAULT_HOMEPAGE_CONFIG}
          onChange={onChange}
          onPersist={onPersist}
          portalMode="platform"
        />
      </HomepageEditorShell>
    );

    const input = screen.getByLabelText("Pre-footer side image");
    const file = new File(["img"], "draft-footer.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
    const next = onChange.mock.calls.at(-1)?.[0] as HomepageConfig;
    expect(next.footerCta.backgroundImageUrl).toBe("https://cdn.example.com/draft-footer.png");
    expect(onPersist).not.toHaveBeenCalled();
  });

  it("critical_hero_media_upload_stays_draft_until_page_save", async () => {
    const onChange = vi.fn();
    const onPersist = vi.fn();
    const { uploadMarketingMedia } = await import("@/lib/marketingMediaStorage");
    vi.mocked(uploadMarketingMedia).mockResolvedValue("https://cdn.example.com/draft-hero.png");

    render(
      <HomepageEditorShell title="Homepage Configuration">
        <HomepageEditorForm
          config={DEFAULT_HOMEPAGE_CONFIG}
          onChange={onChange}
          onPersist={onPersist}
          portalMode="platform"
        />
      </HomepageEditorShell>
    );

    fireEvent.click(screen.getByRole("button", { name: /Hero.*Main banner content/i }));
    const input = screen.getByLabelText("Hero side image");
    const file = new File(["img"], "draft-hero.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
    const next = onChange.mock.calls.at(-1)?.[0] as HomepageConfig;
    expect(next.hero.backgroundImageUrl).toBe("https://cdn.example.com/draft-hero.png");
    expect(onPersist).not.toHaveBeenCalled();
  });

  it("regression_form_fields_expose_id_and_name_for_autofill", () => {
    const { container } = render(
      <HomepageEditorShell title="Homepage Configuration">
        <HomepageEditorForm config={DEFAULT_HOMEPAGE_CONFIG} onChange={() => undefined} />
      </HomepageEditorShell>
    );

    const fields = container.querySelectorAll(
      "input.ed-field__input, select.ed-field__input, textarea.ed-field__input"
    );
    expect(fields.length).toBeGreaterThan(0);
    fields.forEach((field) => {
      expect(field.getAttribute("id") || field.getAttribute("name")).toBeTruthy();
    });
  });

  it("regression_tolerates_partial_or_missing_config", () => {
    const onChange = vi.fn();
    render(
      <HomepageEditorShell title="Homepage Configuration">
        <HomepageEditorForm
          config={{ meta: { siteName: "Partial" } } as HomepageConfig}
          onChange={onChange}
        />
      </HomepageEditorShell>
    );
    expect(screen.getByRole("heading", { name: "Site Identity" })).toBeDefined();
    expect(screen.getByDisplayValue("Partial")).toBeDefined();
  });
});
