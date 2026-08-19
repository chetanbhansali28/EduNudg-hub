import { useState } from "react";
import { mutationErrorMessage } from "@/lib/mutationErrorMessage";

export function useMutationError() {
  const [error, setError] = useState<string | null>(null);
  const clear = () => setError(null);
  const capture = (e: unknown) => {
    setError(mutationErrorMessage(e));
  };
  return { error, clear, capture };
}
