import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useAuth } from "@/bootstrap/AuthProvider";

export interface Membership {
  id: string;
  role_key: string;
  scope_type: string;
  brand_id: string | null;
  center_id: string | null;
}

export function useMembership() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["memberships", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const { data, error } = await getSupabase()
          .from("memberships")
          .select("id, role_key, scope_type, brand_id, center_id")
          .eq("user_id", user!.id)
          .eq("status", "active");
        return supabaseList(data, error) as Membership[];
      } catch {
        return [];
      }
    },
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
