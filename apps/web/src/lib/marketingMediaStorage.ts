import { getSupabase } from "@/lib/supabase";
import { BRAND_ASSETS_BUCKET } from "@/lib/brandLogoStorage";
import { withLogoCacheBust } from "@/lib/brandLogoCache";

export type MarketingUploadScope =
  | { kind: "platform" }
  | { kind: "platform-logo" }
  | { kind: "brand"; brandId: string };

const PLATFORM_LOGO_PREFIX = "platform-logo.";

function mediaExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  const byType: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return byType[file.type] ?? "bin";
}

function sanitizeFileStem(name: string): string {
  const stem = name.replace(/\.[^.]+$/, "").toLowerCase();
  const safe = stem.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return safe.slice(0, 48) || "asset";
}

/** Object path under `brand-assets` for a marketing image or video. */
export function marketingMediaObjectPath(
  scope: MarketingUploadScope,
  subdir: string,
  file: File
): string {
  const ext = mediaExtension(file);
  if (scope.kind === "platform-logo") {
    return `${PLATFORM_LOGO_PREFIX}${ext}`;
  }
  const stem = sanitizeFileStem(file.name);
  const fileName = `${Date.now()}-${stem}.${ext}`;
  if (scope.kind === "platform") {
    return fileName;
  }
  return `${scope.brandId}/marketing/${subdir}/${fileName}`;
}

/** Removes prior `platform-logo.*` objects at the bucket root. */
export async function removeExistingPlatformSiteLogos(): Promise<void> {
  const supabase = getSupabase();
  const { data: files, error } = await supabase.storage.from(BRAND_ASSETS_BUCKET).list("", { limit: 200 });
  if (error) throw error;

  const paths = (files ?? [])
    .filter((f) => f.name.startsWith(PLATFORM_LOGO_PREFIX))
    .map((f) => f.name);
  if (paths.length === 0) return;

  const { error: removeErr } = await supabase.storage.from(BRAND_ASSETS_BUCKET).remove(paths);
  if (removeErr) throw removeErr;
}

export function marketingMediaPublicUrl(path: string): string {
  const { data } = getSupabase().storage.from(BRAND_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload marketing media to public `brand-assets` storage; returns the public URL. */
export async function uploadMarketingMedia(
  scope: MarketingUploadScope,
  subdir: string,
  file: File
): Promise<string> {
  if (scope.kind === "platform-logo") {
    await removeExistingPlatformSiteLogos();
  }

  const path = marketingMediaObjectPath(scope, subdir, file);
  const { error: uploadErr } = await getSupabase()
    .storage.from(BRAND_ASSETS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
      cacheControl: "300",
    });
  if (uploadErr) throw uploadErr;

  const publicUrl = marketingMediaPublicUrl(path);
  return scope.kind === "platform-logo" ? withLogoCacheBust(publicUrl) : publicUrl;
}
