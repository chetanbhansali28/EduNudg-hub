import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BRAND_ASSETS_BUCKET,
  BRAND_LEGAL_DOCX_MIME,
  BRAND_LEGAL_HTML_MIME,
  BRAND_LEGAL_PDF_MIME,
  brandLegalObjectPath,
  uploadBrandLegalPage,
} from "./brandLegalStorage";

const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    storage: {
      from: () => ({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
      }),
    },
  }),
}));

vi.mock("mammoth", () => ({
  convertToHtml: vi.fn().mockResolvedValue({ value: "<p>Privacy policy</p>" }),
}));

describe("brandLegalStorage", () => {
  beforeEach(() => {
    uploadMock.mockReset();
    getPublicUrlMock.mockReset();
    uploadMock.mockResolvedValue({ error: null });
    getPublicUrlMock.mockImplementation((path: string) => ({
      data: { publicUrl: `https://cdn.example/${path}` },
    }));
  });

  it("brandLegalObjectPath nests under brand legal folder", () => {
    expect(brandLegalObjectPath("brand-1", "privacy", "Privacy Policy.docx")).toMatch(
      /^brand-1\/legal\/privacy\/\d+-Privacy-Policy\.docx$/
    );
  });

  it("uses brand-assets bucket constant", () => {
    expect(BRAND_ASSETS_BUCKET).toBe("brand-assets");
  });

  it("regression_uploadBrandLegalPage_docx_uses_supported_mime_and_stores_html", async () => {
    const file = new File(["docx"], "Privacy-Policy.docx", { type: BRAND_LEGAL_DOCX_MIME });
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => new TextEncoder().encode("docx").buffer,
    });
    const doc = await uploadBrandLegalPage("brand-1", "privacy", file);

    expect(uploadMock).toHaveBeenCalledTimes(2);
    expect(uploadMock.mock.calls[0][2]).toMatchObject({ contentType: BRAND_LEGAL_DOCX_MIME });
    expect(uploadMock.mock.calls[1][2]).toMatchObject({ contentType: BRAND_LEGAL_HTML_MIME });
    expect(doc.mimeType).toBe(BRAND_LEGAL_DOCX_MIME);
    expect(doc.htmlUrl).toContain("brand-1/legal/privacy/");
    expect(doc.fileUrl).toContain("Privacy-Policy.docx");
  });

  it("regression_uploadBrandLegalPage_pdf_uses_pdf_mime", async () => {
    const file = new File(["pdf"], "terms.pdf", { type: BRAND_LEGAL_PDF_MIME });
    const doc = await uploadBrandLegalPage("brand-1", "terms", file);

    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(uploadMock.mock.calls[0][2]).toMatchObject({ contentType: BRAND_LEGAL_PDF_MIME });
    expect(doc.htmlUrl).toBeUndefined();
  });
});
