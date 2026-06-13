import { getSupabase } from "@/lib/supabase";
import { withLogoCacheBust } from "@/lib/brandLogoCache";
import { BRAND_ASSETS_BUCKET } from "@/lib/brandLogoStorage";

const PHOTO_FILE_PREFIX = "photo.";

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

/** `{brandId}/students/{studentId}` */
export function studentPhotoFolder(brandId: string, studentId: string): string {
  return `${brandId}/students/${studentId}`;
}

/** `{brandId}/students/{studentId}/photo.{ext}` */
export function studentPhotoObjectPath(brandId: string, studentId: string, ext: string): string {
  return `${studentPhotoFolder(brandId, studentId)}/${PHOTO_FILE_PREFIX}${ext}`;
}

export function studentPhotoPublicUrl(brandId: string, studentId: string, ext: string): string {
  const path = studentPhotoObjectPath(brandId, studentId, ext);
  const { data } = getSupabase().storage.from(BRAND_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Removes any existing `photo.*` objects for this student. */
export async function removeExistingStudentPhotos(brandId: string, studentId: string): Promise<void> {
  const folder = studentPhotoFolder(brandId, studentId);
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

/** Uploads student photo to brand-assets and returns cache-busted public URL. */
export async function uploadStudentPhoto(brandId: string, studentId: string, file: File): Promise<string> {
  const ext = imageExtension(file);
  await removeExistingStudentPhotos(brandId, studentId);

  const path = studentPhotoObjectPath(brandId, studentId, ext);
  const { error: uploadErr } = await getSupabase()
    .storage.from(BRAND_ASSETS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
      cacheControl: "300",
    });
  if (uploadErr) throw uploadErr;

  return withLogoCacheBust(studentPhotoPublicUrl(brandId, studentId, ext));
}
