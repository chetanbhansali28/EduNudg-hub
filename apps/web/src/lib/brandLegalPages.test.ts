import { describe, expect, it } from "vitest";
import { hasBrandLegalPage, parseBrandLegalPages, parseBrandLegalPagesRecord } from "@/lib/brandLegalPages";

describe("brandLegalPages", () => {
  it("parseBrandLegalPages reads privacy and terms slots", () => {
    const pages = parseBrandLegalPages({
      legal_pages: {
        privacy: {
          fileName: "privacy.pdf",
          fileUrl: "https://cdn.example/privacy.pdf",
          mimeType: "application/pdf",
          uploadedAt: "2026-01-01",
        },
      },
    });
    expect(hasBrandLegalPage(pages, "privacy")).toBe(true);
    expect(hasBrandLegalPage(pages, "terms")).toBe(false);
  });

  it("parseBrandLegalPagesRecord supports legacy name/url keys", () => {
    const pages = parseBrandLegalPagesRecord({
      terms: { name: "terms.docx", url: "https://cdn.example/terms.docx", uploaded_at: "2026-02-01" },
    });
    expect(pages.terms?.fileName).toBe("terms.docx");
    expect(pages.terms?.fileUrl).toBe("https://cdn.example/terms.docx");
  });
});
