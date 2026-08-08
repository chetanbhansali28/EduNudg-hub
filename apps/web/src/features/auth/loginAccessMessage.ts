export function formatLoginAccessDeniedMessage(email: string | null | undefined): string {
  const trimmed = email?.trim();
  if (trimmed) {
    return `${trimmed} is not authorized for this website. Contact your administrator to request access.`;
  }
  return "You are not authorized for this website. Contact your administrator to request access.";
}
