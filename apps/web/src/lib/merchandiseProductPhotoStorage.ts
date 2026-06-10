import { getSupabase } from "@/lib/supabase";
import { withLogoCacheBust } from "@/lib/brandLogoCache";
import { BRAND_ASSETS_BUCKET } from "@/lib/brandLogoStorage";

export const MERCHANDISE_PHOTO_MAX_SLOTS = 5;
const PHOTO_FILE_PREFIX = "photo-";

function imageExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  const byType: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return byType[file.type] ?? "png";
}

/** `{brandId}/merchandise/{catalogItemId}` */
export function merchandiseProductPhotoFolder(brandId: string, catalogItemId: string): string {
  return `${brandId}/merchandise/${catalogItemId}`;
}

/** `{brandId}/merchandise/{catalogItemId}/photo-{slot}.{ext}` — slot is 1..5 */
export function merchandiseProductPhotoObjectPath(
  brandId: string,
  catalogItemId: string,
  slot: number,
  ext: string
): string {
  if (slot < 1 || slot > MERCHANDISE_PHOTO_MAX_SLOTS) {
    throw new Error(`Photo slot must be between 1 and ${MERCHANDISE_PHOTO_MAX_SLOTS}`);
  }
  return `${merchandiseProductPhotoFolder(brandId, catalogItemId)}/${PHOTO_FILE_PREFIX}${slot}.${ext}`;
}

export function merchandiseProductPhotoPublicUrl(
  brandId: string,
  catalogItemId: string,
  slot: number,
  ext: string
): string {
  const path = merchandiseProductPhotoObjectPath(brandId, catalogItemId, slot, ext);
  const { data } = getSupabase().storage.from(BRAND_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function slotFilePrefix(slot: number): string {
  return `${PHOTO_FILE_PREFIX}${slot}.`;
}

/** Removes any existing `photo-{slot}.*` objects for this catalog item. */
export async function removeExistingMerchandiseProductPhotoSlot(
  brandId: string,
  catalogItemId: string,
  slot: number
): Promise<void> {
  const folder = merchandiseProductPhotoFolder(brandId, catalogItemId);
  const supabase = getSupabase();
  const { data: files, error } = await supabase.storage.from(BRAND_ASSETS_BUCKET).list(folder);
  if (error) throw error;

  const prefix = slotFilePrefix(slot);
  const paths = (files ?? [])
    .filter((f) => f.name.startsWith(prefix))
    .map((f) => `${folder}/${f.name}`);
  if (paths.length === 0) return;

  const { error: removeErr } = await supabase.storage.from(BRAND_ASSETS_BUCKET).remove(paths);
  if (removeErr) throw removeErr;
}

/** Removes all merchandise photos for a catalog item (e.g. on delete). */
export async function removeAllMerchandiseProductPhotos(
  brandId: string,
  catalogItemId: string
): Promise<void> {
  const folder = merchandiseProductPhotoFolder(brandId, catalogItemId);
  const supabase = getSupabase();
  const { data: files, error } = await supabase.storage.from(BRAND_ASSETS_BUCKET).list(folder);
  if (error) throw error;

  const paths = (files ?? [])
    .filter((f) => f.name.startsWith(PHOTO_FILE_PREFIX))
    .map((f) => `${folder}/${f.name}`);
  if (paths.length === 0) return;

  const { error: removeErr } = await supabase.storage.from(BRAND_ASSETS_BUCKET).remove(paths);
  if (removeErr) throw removeErr;
}

export function normalizeMerchandisePhotoUrls(urls: string[] | null | undefined): string[] {
  const padded = [...(urls ?? [])];
  while (padded.length < MERCHANDISE_PHOTO_MAX_SLOTS) padded.push("");
  return padded.slice(0, MERCHANDISE_PHOTO_MAX_SLOTS);
}

export function activeMerchandisePhotoUrls(urls: string[] | null | undefined): string[] {
  return normalizeMerchandisePhotoUrls(urls).filter((url) => url.trim().length > 0);
}

/** Uploads to brand-assets, replaces prior file in the same slot, updates `photo_urls` on catalog row. */
export async function uploadMerchandiseProductPhoto(
  brandId: string,
  catalogItemId: string,
  slot: number,
  file: File
): Promise<string[]> {
  const ext = imageExtension(file);
  await removeExistingMerchandiseProductPhotoSlot(brandId, catalogItemId, slot);

  const path = merchandiseProductPhotoObjectPath(brandId, catalogItemId, slot, ext);
  const { error: uploadErr } = await getSupabase()
    .storage.from(BRAND_ASSETS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
      cacheControl: "300",
    });
  if (uploadErr) throw uploadErr;

  const publicUrl = withLogoCacheBust(merchandiseProductPhotoPublicUrl(brandId, catalogItemId, slot, ext));

  const { data: row, error: fetchErr } = await getSupabase()
    .from("merchandise_catalog")
    .select("photo_urls")
    .eq("id", catalogItemId)
    .eq("brand_id", brandId)
    .single();
  if (fetchErr) throw fetchErr;

  const photoUrls = normalizeMerchandisePhotoUrls(row.photo_urls as string[] | null);
  photoUrls[slot - 1] = publicUrl;

  const { error: updateErr } = await getSupabase()
    .from("merchandise_catalog")
    .update({ photo_urls: photoUrls })
    .eq("id", catalogItemId)
    .eq("brand_id", brandId);
  if (updateErr) throw updateErr;

  return photoUrls;
}

/** Clears a photo slot in storage and on the catalog row. */
export async function clearMerchandiseProductPhoto(
  brandId: string,
  catalogItemId: string,
  slot: number
): Promise<string[]> {
  await removeExistingMerchandiseProductPhotoSlot(brandId, catalogItemId, slot);

  const { data: row, error: fetchErr } = await getSupabase()
    .from("merchandise_catalog")
    .select("photo_urls")
    .eq("id", catalogItemId)
    .eq("brand_id", brandId)
    .single();
  if (fetchErr) throw fetchErr;

  const photoUrls = normalizeMerchandisePhotoUrls(row.photo_urls as string[] | null);
  photoUrls[slot - 1] = "";

  const { error: updateErr } = await getSupabase()
    .from("merchandise_catalog")
    .update({ photo_urls: photoUrls })
    .eq("id", catalogItemId)
    .eq("brand_id", brandId);
  if (updateErr) throw updateErr;

  return photoUrls;
}
