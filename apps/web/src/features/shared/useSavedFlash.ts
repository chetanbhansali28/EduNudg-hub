import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_FLASH_MS = 3000;

/**
 * Brief “Saved” affordance for SaveButton / editor bars.
 * Call `flash()` from mutation `onSuccess` and pass `saved` to the save control.
 */
export function useSavedFlash(durationMs = DEFAULT_FLASH_MS) {
  const [saved, setSaved] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const clearFlashTimer = useCallback(() => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => clearFlashTimer(), [clearFlashTimer]);

  const flash = useCallback(() => {
    clearFlashTimer();
    setSaved(true);
    timeoutRef.current = window.setTimeout(() => {
      setSaved(false);
      timeoutRef.current = null;
    }, durationMs);
  }, [clearFlashTimer, durationMs]);

  return { saved, flash };
}
