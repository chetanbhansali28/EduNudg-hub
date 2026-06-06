export type CurriculumPublishStatus = "draft" | "published" | "archived";

export function versionPublishValue(status: CurriculumPublishStatus): "draft" | "published" {
  return status === "published" ? "published" : "draft";
}
