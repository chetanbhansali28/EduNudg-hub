import { describe, expect, it } from "vitest";
import { parseFunctionsInvokeError } from "./parseFunctionsInvokeError";

describe("parseFunctionsInvokeError", () => {
  it("returns payload.error from function response body", async () => {
    const response = new Response(JSON.stringify({ error: "No passkey found for this device." }), {
      status: 400,
    });
    const message = await parseFunctionsInvokeError({
      message: "Edge Function returned a non-2xx status code",
      context: response,
    });
    expect(message).toBe("No passkey found for this device.");
  });

  it("falls back to error.message when body is not JSON", async () => {
    const message = await parseFunctionsInvokeError({ message: "Network error" });
    expect(message).toBe("Network error");
  });
});
