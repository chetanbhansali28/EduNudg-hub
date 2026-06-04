import { getSupabase } from "@/lib/supabase";

/** Lowercase URL slug from a display name. */
export function slugifyBrandName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/** Returns a slug that is not used by another non-deleted brand. */
export async function uniqueBrandSlug(
  base: string,
  options?: { excludeBrandId?: string }
): Promise<string> {
  const supabase = getSupabase();
  let root = slugifyBrandName(base);
  if (!root) root = "brand";

  let candidate = root;
  let suffix = 2;
  for (;;) {
    let q = supabase.from("brands").select("id").eq("slug", candidate).is("deleted_at", null);
    if (options?.excludeBrandId) q = q.neq("id", options.excludeBrandId);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
    candidate = `${root}-${suffix++}`;
  }
}
