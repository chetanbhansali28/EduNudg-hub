import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/bootstrap/AuthProvider";

export interface Membership {
  id: string;
  role_key: string;
  scope_type: string;
  brand_id: string | null;
  center_id: string | null;
}

/** Activate invited rows, then load active staff memberships for the signed-in user. */
export async function fetchActiveMemberships(userId: string): Promise<Membership[]> {
  const sb = getSupabase();
  try {
    await sb.rpc("accept_own_invited_memberships");
  } catch {
    // Login must still work for already-active members if the RPC is not applied yet.
  }
  const { data, error } = await sb
    .from("memberships")
    .select("id, role_key, scope_type, brand_id, center_id")
    .eq("user_id", userId)
    .eq("status", "active");
  if (error) throw error;
  return (data ?? []) as Membership[];
}

export function useMembership() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["memberships", user?.id],
    enabled: !!user,
    queryFn: () => fetchActiveMemberships(user!.id),
  });
}

export function primaryRole(memberships: Membership[] | undefined): string {
  if (!memberships?.length) return "guest";
  const platform = memberships.find((m) => m.scope_type === "platform");
  if (platform) return platform.role_key;
  const brand = memberships.find((m) => m.scope_type === "brand");
  if (brand) return brand.role_key;
  return memberships[0].role_key;
}
