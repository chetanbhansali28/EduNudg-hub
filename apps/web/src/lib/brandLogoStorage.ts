import { getSupabase } from "@/lib/supabase";
import { withLogoCacheBust } from "@/lib/brandLogoCache";

export const BRAND_ASSETS_BUCKET = "brand-assets";

const LOGO_FILE_PREFIX = "logo.";

function logoExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  const byType: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/gif": "gif",
  };
  return byType[file.type] ?? "png";
}

export function brandLogoObjectPath(brandId: string, ext: string): string {
  return `${brandId}/logo.${ext}`;
}

export function brandLogoPublicUrl(brandId: string, ext: string): string {
  const path = brandLogoObjectPath(brandId, ext);
  const { data } = getSupabase().storage.from(BRAND_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Removes any existing `logo.*` objects under the brand folder. */
export async function removeExistingBrandLogos(brandId: string): Promise<void> {
  const supabase = getSupabase();
  const { data: files, error } = await supabase.storage.from(BRAND_ASSETS_BUCKET).list(brandId);
  if (error) throw error;

  const paths = (files ?? [])
    .filter((f) => f.name.startsWith(LOGO_FILE_PREFIX))
    .map((f) => `${brandId}/${f.name}`);
  if (paths.length === 0) return;

  const { error: removeErr } = await supabase.storage.from(BRAND_ASSETS_BUCKET).remove(paths);
  if (removeErr) throw removeErr;
}

/** Uploads logo to `brand-assets`, replaces prior logo files, updates `brands.logo_url`. */
export async function uploadBrandLogo(brandId: string, file: File): Promise<string> {
  const ext = logoExtension(file);
  await removeExistingBrandLogos(brandId);

  const path = brandLogoObjectPath(brandId, ext);
  const { error: uploadErr } = await getSupabase()
    .storage.from(BRAND_ASSETS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
      cacheControl: "300",
    });
  if (uploadErr) throw uploadErr;

  const publicUrl = withLogoCacheBust(brandLogoPublicUrl(brandId, ext));
  const { error: updateErr } = await getSupabase().from("brands").update({ logo_url: publicUrl }).eq("id", brandId);
  if (updateErr) throw updateErr;

  return publicUrl;
}
