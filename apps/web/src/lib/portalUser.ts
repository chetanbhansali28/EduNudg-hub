import type { User } from "@supabase/supabase-js";

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
    name: name.charAt(0).toUpperCase() + name.slice(1),
    email: user.email ?? "",
  };
}
