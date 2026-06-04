import { getSupabase } from "@/lib/supabase";
import { BRAND_ASSETS_BUCKET } from "@/lib/brandLogoStorage";

export type MarketingUploadScope =
  | { kind: "platform" }
  | { kind: "brand"; brandId: string };

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
  const stem = sanitizeFileStem(file.name);
  const fileName = `${Date.now()}-${stem}.${ext}`;
  const folder =
    scope.kind === "platform"
      ? `platform/marketing/${subdir}`
      : `${scope.brandId}/marketing/${subdir}`;
  return `${folder}/${fileName}`;
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
  const path = marketingMediaObjectPath(scope, subdir, file);
  const { error: uploadErr } = await getSupabase()
    .storage.from(BRAND_ASSETS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (uploadErr) throw uploadErr;
  return marketingMediaPublicUrl(path);
}
