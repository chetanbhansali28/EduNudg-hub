import { useState } from "react";

export function useMutationError() {
  const [error, setError] = useState<string | null>(null);
  const clear = () => setError(null);
  const capture = (e: unknown) => {
    setError(e instanceof Error ? e.message : "Something went wrong");
  };
  return { error, clear, capture };
}
