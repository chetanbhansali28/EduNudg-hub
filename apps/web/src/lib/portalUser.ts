import type { User } from "@supabase/supabase-js";

function capitalizeName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function displayUserFromAuth(user: User | null): { name: string; email: string } {
  if (!user) {
    return { name: "User", email: "" };
  }
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  const name =
    meta?.full_name?.trim() ||
    meta?.name?.trim() ||
    user.email?.split("@")[0]?.replace(/\./g, " ") ||
    "User";
  return {
    name: capitalizeName(name),
    email: user.email ?? "",
  };
}

/** Prefer profiles.full_name, then auth metadata, then email local-part. */
export function resolveStaffDisplayName(
  profile: { full_name?: string | null; email?: string | null } | null | undefined,
  user: User | null
): { name: string; email: string } {
  const authFallback = displayUserFromAuth(user);
  const profileName = profile?.full_name?.trim();
  const name = profileName ? capitalizeName(profileName) : authFallback.name;
  const email = profile?.email?.trim() || authFallback.email;
  return { name, email };
}
