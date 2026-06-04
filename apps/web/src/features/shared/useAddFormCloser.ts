import { useCallback, useRef } from "react";

/** Wire AddFormSection close into mutation onSuccess handlers. */
export function useAddFormCloser() {
  const ref = useRef<(() => void) | null>(null);
  const bindClose = useCallback((close: () => void) => {
    ref.current = close;
  }, []);
  const closeAddForm = useCallback(() => {
    ref.current?.();
  }, []);
  return { bindClose, closeAddForm };
}
