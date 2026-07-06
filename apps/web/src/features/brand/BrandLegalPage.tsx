import { Link, Navigate, useOutletContext, useParams } from "react-router-dom";
import { BrandLegalPageContent } from "@/features/brand/BrandLegalPageContent";
import type { BrandLandingOutletContext } from "@/features/brand/BrandPublicLayout";
import {
  BRAND_LEGAL_PAGE_LABELS,
  hasBrandLegalPage,
  type BrandLegalPageKind,
} from "@/lib/brandLegalPages";

function parseLegalKind(value: string | undefined): BrandLegalPageKind | null {
  if (value === "privacy" || value === "terms") return value;
  return null;
}

export function BrandLegalPage() {
  const { kind: rawKind } = useParams();
  const kind = parseLegalKind(rawKind);
  const ctx = useOutletContext<BrandLandingOutletContext>();

  if (!kind) {
    return <Navigate to="/" replace />;
  }

  const doc = ctx.legalPages[kind];
  if (!hasBrandLegalPage(ctx.legalPages, kind) || !doc) {
    return (
      <div className="marketing-legal-page">
        <div className="marketing-legal-page__inner">
          <h1>{BRAND_LEGAL_PAGE_LABELS[kind]}</h1>
          <p>This document has not been published yet. Upload it under Homepage Configuration → Privacy &amp; Terms, then save.</p>
          <Link to="/">Back to homepage</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="marketing-legal-page">
      <div className="marketing-legal-page__inner">
        <header className="marketing-legal-page__head">
          <h1>{BRAND_LEGAL_PAGE_LABELS[kind]}</h1>
          <p className="marketing-legal-page__meta">
            Last updated {new Date(doc.uploadedAt).toLocaleDateString()}
          </p>
          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="marketing-legal-page__download">
            Download original ({doc.fileName})
          </a>
        </header>

        <BrandLegalPageContent doc={doc} title={BRAND_LEGAL_PAGE_LABELS[kind]} />
      </div>
    </div>
  );
}
