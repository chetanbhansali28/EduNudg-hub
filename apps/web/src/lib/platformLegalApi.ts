import { getSupabase } from "@/lib/supabase";
import { parseBrandLegalPagesRecord, type BrandLegalPages } from "@/lib/brandLegalPages";

const PLATFORM_LEGAL_KEY = "marketing_legal_pages";

export async function fetchPlatformLegalPages(): Promise<BrandLegalPages> {
  try {
    const { data, error } = await getSupabase()
      .from("platform_settings")
      .select("value")
      .eq("key", PLATFORM_LEGAL_KEY)
      .maybeSingle();

    if (error || !data?.value || typeof data.value !== "object") return {};
    return parseBrandLegalPagesRecord(data.value as Record<string, unknown>);
  } catch {
    return {};
  }
}

export async function savePlatformLegalPages(legalPages: BrandLegalPages): Promise<void> {
  const { error } = await getSupabase()
    .from("platform_settings")
    .upsert({ key: PLATFORM_LEGAL_KEY, value: legalPages }, { onConflict: "key" });

  if (error) throw new Error(error.message);
}
