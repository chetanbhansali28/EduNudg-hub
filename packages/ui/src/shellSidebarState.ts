const STORAGE_KEY = "ed-sidebar-collapsed";

export function readSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "true" : "false");
  } catch {
    /* ignore quota / private mode */
  }
}
