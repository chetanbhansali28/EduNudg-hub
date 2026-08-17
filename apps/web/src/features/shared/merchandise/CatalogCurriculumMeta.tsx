import { formatCenterSkuCurriculum } from "@/lib/merchandiseCurriculum";
import "./catalogCurriculumMeta.css";

type Props = {
  courseNames?: string[] | null;
  levelNames?: string[] | null;
  className?: string;
};

export function CatalogCurriculumMeta({ courseNames, levelNames, className }: Props) {
  const { curriculum, program } = formatCenterSkuCurriculum(courseNames, levelNames);
  if (!curriculum && !program) return null;

  return (
    <div className={["ed-catalog-curriculum", className].filter(Boolean).join(" ")}>
      {curriculum ? <p>Curriculum: {curriculum}</p> : null}
      {program ? <p>Program: {program}</p> : null}
    </div>
  );
}
