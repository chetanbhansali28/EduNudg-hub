export type Resource =
  | "brands"
  | "centers"
  | "programs"
  | "curriculum"
  | "leads"
  | "enrollments"
  | "batches"
  | "fees"
  | "invoices"
  | "payments"
  | "inventory"
  | "royalties"
  | "analytics"
  | "audit_logs"
  | "domain_mappings"
  | "competitions";

export type Action = "create" | "read" | "update" | "delete" | "approve" | "export" | "suspend";

const MATRIX: Record<string, Record<string, string[]>> = {
  brands: {
    create: ["platform_super_admin", "platform_ops"],
    read: ["platform_super_admin", "platform_ops", "brand_owner", "brand_admin"],
    update: ["platform_super_admin", "platform_ops", "brand_owner", "brand_admin"],
    suspend: ["platform_super_admin", "platform_ops", "brand_owner"],
  },
  centers: {
    create: ["platform_super_admin", "platform_ops", "brand_owner", "brand_admin"],
    read: [
      "platform_super_admin",
      "platform_ops",
      "brand_owner",
      "brand_admin",
      "center_owner",
      "center_manager",
      "center_admissions",
      "center_finance",
    ],
    update: ["platform_super_admin", "platform_ops", "brand_owner", "brand_admin", "center_owner", "center_manager"],
    delete: ["platform_super_admin", "platform_ops", "brand_owner", "brand_admin"],
    suspend: ["platform_super_admin", "platform_ops", "brand_owner", "brand_admin"],
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
  competitions: {
    create: ["platform_super_admin", "platform_ops", "brand_owner", "brand_admin"],
    read: [
      "platform_super_admin",
      "platform_ops",
      "brand_owner",
      "brand_admin",
      "center_owner",
      "center_manager",
      "center_admissions",
    ],
    update: ["platform_super_admin", "platform_ops", "brand_owner", "brand_admin"],
    delete: ["platform_super_admin", "platform_ops", "brand_owner", "brand_admin"],
  },
  programs: {
    create: ["brand_owner", "brand_admin"],
    read: [
      "platform_super_admin",
      "platform_ops",
      "brand_owner",
      "brand_admin",
      "center_owner",
      "center_manager",
      "center_admissions",
      "center_finance",
    ],
    update: ["brand_owner", "brand_admin"],
  },
  curriculum: {
    create: ["brand_owner", "brand_admin"],
    approve: ["brand_owner", "brand_admin"],
    update: ["brand_owner", "brand_admin"],
  },
};

export function can(role: string, resource: Resource, action: Action): boolean {
  const allowed = MATRIX[resource]?.[action];
  if (!allowed) return role.startsWith("platform_") || role === "brand_owner";
  return allowed.includes(role);
}

/** True if any membership role is allowed — do not use `primaryRole` alone (it prefers platform). */
export function canAny(roles: readonly string[] | undefined, resource: Resource, action: Action): boolean {
  return Boolean(roles?.some((role) => can(role, resource, action)));
}
