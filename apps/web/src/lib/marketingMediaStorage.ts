import { getSupabase } from "@/lib/supabase";
import { BRAND_ASSETS_BUCKET } from "@/lib/brandLogoStorage";
import { withMediaCacheBust } from "@/lib/mediaUrl";

export type MarketingUploadScope =
  | { kind: "platform" }
  | { kind: "platform-logo" }
  | { kind: "brand"; brandId: string };

const PLATFORM_LOGO_PREFIX = "platform-logo.";
const STABLE_BASENAME = "asset";

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

/** Folder prefix in `brand-assets` for a marketing media slot (one image/video per slot). */
export function marketingMediaFolder(scope: MarketingUploadScope, subdir: string): string | null {
  if (scope.kind === "platform-logo") return null;
  const slot = subdir.trim() || "misc";
  if (scope.kind === "platform") return `platform/marketing/${slot}`;
  return `${scope.brandId}/marketing/${slot}`;
}

/** Object path under `brand-assets` — stable name so re-upload replaces the slot. */
export function marketingMediaObjectPath(
  scope: MarketingUploadScope,
  subdir: string,
  file: File
): string {
  const ext = mediaExtension(file);
  if (scope.kind === "platform-logo") {
    return `${PLATFORM_LOGO_PREFIX}${ext}`;
  }
  const folder = marketingMediaFolder(scope, subdir);
  if (!folder) throw new Error("Invalid marketing media scope");
  return `${folder}/${STABLE_BASENAME}.${ext}`;
}

/** Removes prior files in a marketing media slot (any extension). */
export async function removeExistingMarketingMediaInSlot(
  scope: MarketingUploadScope,
  subdir: string
): Promise<void> {
  if (scope.kind === "platform-logo") {
    await removeExistingPlatformSiteLogos();
    return;
  }

  const folder = marketingMediaFolder(scope, subdir);
  if (!folder) return;

  const supabase = getSupabase();
  const { data: files, error } = await supabase.storage.from(BRAND_ASSETS_BUCKET).list(folder, { limit: 100 });
  if (error) throw error;

  const paths = (files ?? []).map((f) => `${folder}/${f.name}`);
  if (paths.length === 0) return;

  const { error: removeErr } = await supabase.storage.from(BRAND_ASSETS_BUCKET).remove(paths);
  if (removeErr) throw removeErr;
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

/** Upload marketing media; replaces prior slot file and returns a cache-busted public URL. */
export async function uploadMarketingMedia(
  scope: MarketingUploadScope,
  subdir: string,
  file: File
): Promise<string> {
  await removeExistingMarketingMediaInSlot(scope, subdir);

  const path = marketingMediaObjectPath(scope, subdir, file);
  const { error: uploadErr } = await getSupabase()
    .storage.from(BRAND_ASSETS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
      cacheControl: "300",
    });
  if (uploadErr) throw uploadErr;

  return withMediaCacheBust(marketingMediaPublicUrl(path));
}
