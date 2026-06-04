import { useQuery } from "@tanstack/react-query";
import { Badge, Card, PageTitle } from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useMembership, primaryRole } from "@/hooks/useMembership";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";

export function StudentDashboardPage() {
  const { user } = useAuth();
  const { data: memberships } = useMembership();
  const role = primaryRole(memberships);

  const enrollments = useQuery({
    queryKey: ["student-enrollments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("student_enrollments")
        .select("id, status, center_id, franchise_centers(name, display_name)")
        .eq("status", "active")
        .limit(5);
      if (error) throw error;
      return supabaseList(data, error) as {
        id: string;
        status: string;
        franchise_centers: { name: string; display_name: string | null } | { name: string; display_name: string | null }[] | null;
      }[];
    },
  });

  return (
    <>
      <PageTitle>Dashboard</PageTitle>
      <Card title="Your learning">
        <p className="ed-text-sm ed-muted">
          Signed in as <Badge>{role}</Badge>. Progress, competitions, and assignments will expand in a future release.
        </p>
        {enrollments.data && enrollments.data.length > 0 ? (
          <ul>
            {enrollments.data.map((e) => {
              const center = Array.isArray(e.franchise_centers)
                ? e.franchise_centers[0]
                : e.franchise_centers;
              return (
                <li key={e.id}>
                  Active at {center?.display_name ?? center?.name ?? "center"}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="ed-text-sm">No active enrollments linked to this account yet.</p>
        )}
      </Card>
    </>
  );
}
