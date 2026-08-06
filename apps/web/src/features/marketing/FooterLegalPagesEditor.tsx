import { EditorAccordion, EditorSectionNote } from "@/features/marketing/HomepageEditorShell";
import { LegalSlotUpload, type LegalSlotUploadScope } from "@/features/marketing/LegalSlotUpload";
import type { BrandLegalPages } from "@/lib/brandLegalPages";
import { BRAND_LEGAL_PAGE_KINDS } from "@/lib/brandLegalPages";

type Props = {
  uploadScope: LegalSlotUploadScope;
  legalPages: BrandLegalPages;
  onLegalPagesChange: (next: BrandLegalPages) => void;
};

export function FooterLegalPagesEditor({ uploadScope, legalPages, onLegalPagesChange }: Props) {
  const updateSlot = (kind: (typeof BRAND_LEGAL_PAGE_KINDS)[number], doc: BrandLegalPages["privacy"]) => {
    const next = { ...legalPages };
    if (doc) next[kind] = doc;
    else delete next[kind];
    onLegalPagesChange(next);
  };

  return (
    <EditorAccordion
      sectionId="legalPages"
      title="Privacy, Terms & Refund"
      description="Upload documents shown on /legal/privacy, /legal/terms, and /legal/refund"
    >
      <EditorSectionNote>
        Upload a PDF or Word (.docx) file for each policy page. Word documents are converted to HTML for visitors.
        Click <strong>Save</strong> on this panel after uploading so the public site and footer links can load them.
      </EditorSectionNote>
      <div className="ed-brand-settings-legal-grid ed-homepage-editor-legal-grid">
        {BRAND_LEGAL_PAGE_KINDS.map((kind) => (
          <LegalSlotUpload
            key={kind}
            scope={uploadScope}
            kind={kind}
            document={legalPages[kind]}
            onUploaded={(doc) => updateSlot(kind, doc)}
            compact
          />
        ))}
      </div>
    </EditorAccordion>
  );
}
