/** Supabase Auth default minimum password length (GoTrue). */
export const STAFF_AUTH_PASSWORD_MIN_LENGTH = 6;

/** Returns an error when a new/updated staff password is too short. Empty means “keep current”. */
export function staffAuthPasswordError(password: string | undefined): string | null {
  const value = password?.trim() ?? "";
  if (!value) return null;
  if (value.length < STAFF_AUTH_PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${STAFF_AUTH_PASSWORD_MIN_LENGTH} characters. “admin” is only 5 and cannot be saved.`;
  }
  return null;
}
