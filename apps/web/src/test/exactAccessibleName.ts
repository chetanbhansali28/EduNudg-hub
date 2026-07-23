/**
 * Testing Library `getByRole` has no `exact` option (unlike Playwright).
 * Use an anchored regex so "Log in" does not match "Log in with Google".
 */
export function exactAccessibleName(label: string): RegExp {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}$`);
}
