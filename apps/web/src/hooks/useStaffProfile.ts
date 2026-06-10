import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/bootstrap/AuthProvider";
import { getSupabase } from "@/lib/supabase";
import { resolveStaffDisplayName } from "@/lib/portalUser";

export function useStaffProfile() {
  const { user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["staff-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("profiles")
        .select("full_name, email")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const display = resolveStaffDisplayName(profileQuery.data, user);

  return {
    ...display,
    isLoading: profileQuery.isLoading,
  };
}
