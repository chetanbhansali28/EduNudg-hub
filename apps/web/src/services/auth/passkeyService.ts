import { startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { getSupabase } from "@/lib/supabase";

type PasskeyOptionsResponse = {
  configured?: boolean;
  options?: PublicKeyCredentialRequestOptionsJSON;
  message?: string;
};

type PasskeyVerifyResponse = {
  configured?: boolean;
  message?: string;
};

export async function signInWithPasskey(): Promise<{ error: Error | null }> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return { error: new Error("Passkeys are not supported in this browser.") };
  }

  const { data: optionsData, error: optionsError } = await getSupabase().functions.invoke<
    PasskeyOptionsResponse
  >("passkey-verify", {
    body: { action: "login-options" },
  });

  if (optionsError) {
    return { error: new Error(optionsError.message || "Could not start passkey sign-in.") };
  }

  if (!optionsData?.configured || !optionsData.options) {
    return {
      error: new Error(
        optionsData?.message ??
          "Passkey sign-in is not configured on this server. Ask your administrator to deploy the passkey Edge Function."
      ),
    };
  }

  try {
    const assertion = await startAuthentication({ optionsJSON: optionsData.options });

    const { data: verifyData, error: verifyError } = await getSupabase().functions.invoke<
      PasskeyVerifyResponse
    >("passkey-verify", {
      body: { action: "login-verify", assertion },
    });

    if (verifyError) {
      return { error: new Error(verifyError.message || "Passkey verification failed.") };
    }

    if (!verifyData?.configured) {
      return {
        error: new Error(
          verifyData?.message ?? "Passkey sign-in completed verification but is not fully wired yet."
        ),
      };
    }

    return { error: null };
  } catch (e) {
    if (e instanceof Error && e.name === "NotAllowedError") {
      return { error: new Error("Passkey sign-in was cancelled.") };
    }
    return { error: e instanceof Error ? e : new Error("Passkey sign-in failed.") };
  }
}
