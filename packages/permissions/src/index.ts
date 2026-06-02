export type Resource =
  | "brands"
  | "centers"
  | "programs"
  | "curriculum"
  | "leads"
  | "enrollments"
  | "batches"
  | "attendance"
  | "fees"
  | "invoices"
  | "payments"
  | "inventory"
  | "royalties"
  | "analytics"
  | "audit_logs"
  | "domain_mappings";

export type Action = "create" | "read" | "update" | "delete" | "approve" | "export" | "suspend";

const MATRIX: Record<string, Record<string, string[]>> = {
  brands: {
    create: ["platform_super_admin", "platform_ops"],
    read: ["platform_super_admin", "platform_ops", "brand_owner", "brand_admin"],
    update: ["platform_super_admin", "platform_ops", "brand_owner", "brand_admin"],
    suspend: ["platform_super_admin", "platform_ops", "brand_owner"],
  },
  leads: {
    create: ["center_owner", "center_manager", "center_admissions"],
    read: ["platform_super_admin", "brand_owner", "center_owner", "center_admissions"],
  },
  enrollments: {
    create: ["center_owner", "center_manager", "center_admissions"],
    read: ["platform_super_admin", "brand_owner", "center_owner", "center_admissions"],
  },
  audit_logs: {
    read: ["platform_super_admin", "platform_ops"],
  },
};

export function can(role: string, resource: Resource, action: Action): boolean {
  const allowed = MATRIX[resource]?.[action];
  if (!allowed) return role.startsWith("platform_") || role === "brand_owner";
  return allowed.includes(role);
}
