import { EditorAccordion, EditorSectionNote } from "@/features/marketing/HomepageEditorShell";
import { BrandLegalSlotUpload } from "@/features/brand/settings/BrandLegalSlotUpload";
import type { BrandLegalPages } from "@/lib/brandLegalPages";

type Props = {
  brandId: string | null;
  legalPages: BrandLegalPages;
  onLegalPagesChange: (next: BrandLegalPages) => void;
};

export function FooterLegalPagesEditor({ brandId, legalPages, onLegalPagesChange }: Props) {
  const updateSlot = (kind: "privacy" | "terms", doc: BrandLegalPages["privacy"]) => {
    const next = { ...legalPages };
    if (doc) next[kind] = doc;
    else delete next[kind];
    onLegalPagesChange(next);
  };

  return (
    <EditorAccordion
      sectionId="legalPages"
      title="Privacy & Terms"
      description="Upload documents shown on /legal/privacy and /legal/terms"
    >
      <EditorSectionNote>
        Upload a PDF or Word (.docx) file for each page. Word documents are converted to HTML for visitors.
        Click <strong>Save</strong> on this panel after uploading so the public site can load them.
      </EditorSectionNote>
      <div className="ed-brand-settings-legal-grid ed-homepage-editor-legal-grid">
        <BrandLegalSlotUpload
          brandId={brandId}
          kind="privacy"
          document={legalPages.privacy}
          onUploaded={(doc) => updateSlot("privacy", doc)}
          compact
        />
        <BrandLegalSlotUpload
          brandId={brandId}
          kind="terms"
          document={legalPages.terms}
          onUploaded={(doc) => updateSlot("terms", doc)}
          compact
        />
      </div>
    </EditorAccordion>
  );
}
