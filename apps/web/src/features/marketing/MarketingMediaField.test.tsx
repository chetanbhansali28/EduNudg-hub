import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MarketingMediaField } from "./MarketingMediaField";

vi.mock("@/lib/marketingMediaStorage", () => ({
  uploadMarketingMedia: vi.fn(async () => "https://cdn.example.com/uploaded.png"),
}));

describe("MarketingMediaField", () => {
  it("critical_default_layout_exposes_upload_file_picker_button", () => {
    render(
      <MarketingMediaField
        label="Hero side image"
        value=""
        onChange={() => undefined}
        mediaType="image"
        uploadSubdir="hero-background"
        uploadScope={{ kind: "platform" }}
      />
    );

    expect(screen.getByRole("button", { name: /Upload file/i })).toBeDefined();
    expect(screen.getByLabelText("Hero side image").getAttribute("type")).toBe("file");
  });

  it("regression_required_photo_shows_asterisk_and_hint_when_empty", () => {
    render(
      <MarketingMediaField
        label="Site logo"
        value=""
        onChange={() => undefined}
        mediaType="image"
        uploadSubdir=""
        uploadScope={{ kind: "platform" }}
        layout="logo"
        required
      />
    );

    expect(document.querySelector(".ed-field__required")).toBeDefined();
    expect(screen.getByText("This photo is required.")).toBeDefined();
  });

  it("regression_optional_photo_omits_required_hint", () => {
    render(
      <MarketingMediaField
        label="Phone frame image"
        value=""
        onChange={() => undefined}
        mediaType="image"
        uploadSubdir="hero-phone-frame"
        uploadScope={{ kind: "platform" }}
      />
    );

    expect(document.querySelector(".ed-field__required")).toBeNull();
    expect(screen.queryByText("This photo is required.")).toBeNull();
  });

  it("critical_hero_layout_exposes_replace_file_picker_when_value_set", () => {
    render(
      <MarketingMediaField
        label="Hero side image"
        value="https://cdn.example.com/hero.png"
        onChange={() => undefined}
        mediaType="image"
        uploadSubdir="hero-background"
        uploadScope={{ kind: "platform" }}
        layout="hero"
      />
    );

    expect(screen.getByRole("button", { name: /Replace file/i })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /Replace file/i }));
    expect(screen.getByLabelText("Hero side image").getAttribute("type")).toBe("file");
  });
});
