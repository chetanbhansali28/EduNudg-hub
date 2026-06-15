import { getSupabase } from "@/lib/supabase";

export type CenterOpsReport = {
  active_enrollments: number;
  open_leads: number;
  converted_leads: number;
  assessments_30d: number;
  recent_assessments: {
    student_name: string;
    assessment_type: string;
    score: number | null;
    max_score: number | null;
    assessed_at: string;
  }[];
};

export async function fetchCenterOpsReport(centerId: string): Promise<CenterOpsReport> {
  const { data, error } = await getSupabase().rpc("get_center_ops_report", {
    p_center_id: centerId,
  });
  if (error) throw error;
  return data as CenterOpsReport;
}
