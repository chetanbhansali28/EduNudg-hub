/** Extract `{ error: string }` from a failed Supabase functions.invoke call. */
export async function parseFunctionsInvokeError(
  error: { message?: string; context?: Response } | null
): Promise<string> {
  if (!error) return "Request failed.";

  const fallback = error.message || "Request failed.";
  const response = error.context;
  if (!response) return fallback;

  try {
    const payload = (await response.clone().json()) as { error?: string; message?: string };
    if (payload.error) return payload.error;
    if (payload.message) return payload.message;
  } catch {
    // ignore JSON parse errors
  }

  return fallback;
}
