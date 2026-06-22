import { getSupabase } from "@/lib/supabase";
import type { LegalDocument } from "@/features/brand/settings/brandSettingsHelpers";

export const BRAND_ASSETS_BUCKET = "brand-assets";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
}

export function brandLegalObjectPath(brandId: string, fileName: string): string {
  return `${brandId}/legal/${Date.now()}-${sanitizeFileName(fileName)}`;
}

export async function uploadBrandLegalDocument(brandId: string, file: File): Promise<LegalDocument> {
  const path = brandLegalObjectPath(brandId, file.name);
  const { error: uploadErr } = await getSupabase()
    .storage.from(BRAND_ASSETS_BUCKET)
    .upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
      cacheControl: "3600",
    });
  if (uploadErr) throw uploadErr;

  const { data } = getSupabase().storage.from(BRAND_ASSETS_BUCKET).getPublicUrl(path);
  return {
    name: file.name,
    url: data.publicUrl,
    uploaded_at: new Date().toISOString(),
  };
}
