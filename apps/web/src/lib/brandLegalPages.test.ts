import { describe, expect, it } from "vitest";
import {
  hasBrandLegalPage,
  parseBrandLegalPages,
  parseBrandLegalPagesRecord,
  parseLegalPageKind,
} from "@/lib/brandLegalPages";

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

  it("parseBrandLegalPagesRecord supports legacy name/url keys and refund slot", () => {
    const pages = parseBrandLegalPagesRecord({
      terms: { name: "terms.docx", url: "https://cdn.example/terms.docx", uploaded_at: "2026-02-01" },
      refund: {
        fileName: "refund.pdf",
        fileUrl: "https://cdn.example/refund.pdf",
        mimeType: "application/pdf",
        uploadedAt: "2026-03-01",
      },
    });
    expect(pages.terms?.fileName).toBe("terms.docx");
    expect(pages.terms?.fileUrl).toBe("https://cdn.example/terms.docx");
    expect(pages.refund?.fileName).toBe("refund.pdf");
  });

  it("parseLegalPageKind accepts privacy terms and refund", () => {
    expect(parseLegalPageKind("privacy")).toBe("privacy");
    expect(parseLegalPageKind("terms")).toBe("terms");
    expect(parseLegalPageKind("refund")).toBe("refund");
    expect(parseLegalPageKind("other")).toBeNull();
  });
});
