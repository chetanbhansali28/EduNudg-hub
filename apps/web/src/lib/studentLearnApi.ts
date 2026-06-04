import { getSupabase } from "@/lib/supabase";

export type LearnDashboardStudent = {
  student_id: string;
  full_name: string;
  enrollments: { enrollment_id: string; status: string; center_name: string }[];
  progress: { level_name: string; status: string; completed_at: string | null }[];
  competitions: { competition_name: string; event_date: string | null; result_rank: string | null }[];
};

export type LearnDashboard = {
  students: LearnDashboardStudent[];
  upcoming_competitions: { id: string; name: string; event_date: string | null; location: string | null }[];
};

export async function fetchStudentLearnDashboard(brandId: string): Promise<LearnDashboard> {
  const { data, error } = await getSupabase().rpc("get_student_learn_dashboard", {
    p_brand_id: brandId,
  });
  if (error) throw error;
  return (data ?? { students: [], upcoming_competitions: [] }) as LearnDashboard;
}
