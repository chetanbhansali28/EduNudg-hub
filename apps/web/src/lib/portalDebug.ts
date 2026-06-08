/** Dev-only portal auth / branding diagnostics (see browser console). */
export function logPortalDebug(event: string, detail: Record<string, unknown>): void {
  if (!import.meta.env.DEV) return;
  console.info(`[EduNudg portal] ${event}`, detail);
}
