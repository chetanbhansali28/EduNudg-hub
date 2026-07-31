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
