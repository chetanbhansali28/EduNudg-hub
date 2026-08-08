import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { getSupabase } from "@/lib/supabase";
import { parseFunctionsInvokeError } from "@/lib/parseFunctionsInvokeError";
import { isPasskeySupported, passkeyOrigin } from "@/lib/passkeyRpId";

type PasskeyOptionsResponse = {
  configured?: boolean;
  options?: PublicKeyCredentialRequestOptionsJSON | PublicKeyCredentialCreationOptionsJSON;
  message?: string;
  error?: string;
};

type PasskeyVerifyResponse = {
  configured?: boolean;
  tokenHash?: string;
  credentialId?: string;
  deviceName?: string;
  message?: string;
  error?: string;
};

export type PasskeyCredentialSummary = {
  credential_id: string;
  device_name: string | null;
  created_at: string;
  transports: string[] | null;
};

type PasskeyListResponse = {
  configured?: boolean;
  credentials?: PasskeyCredentialSummary[];
  error?: string;
};

async function invokePasskey<T>(body: Record<string, unknown>): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await getSupabase().functions.invoke<T & { error?: string }>("passkey-verify", { body });
  if (error) {
    return { data: null, error: await parseFunctionsInvokeError(error) };
  }
  if (data?.error) {
    return { data: null, error: data.error };
  }
  return { data, error: null };
}

async function completePasskeySession(tokenHash: string): Promise<Error | null> {
  const { error } = await getSupabase().auth.verifyOtp({
    token_hash: tokenHash,
    type: "magiclink",
  });
  return error ? new Error(error.message || "Could not complete passkey sign-in.") : null;
}

export async function signInWithPasskey(): Promise<{ error: Error | null }> {
  if (!isPasskeySupported()) {
    return { error: new Error("Passkeys are not supported in this browser.") };
  }

  const origin = passkeyOrigin();
  const { data: optionsData, error: optionsError } = await invokePasskey<PasskeyOptionsResponse>({
    action: "login-options",
    origin,
  });

  if (optionsError) {
    const hint = optionsError.includes("passkey_auth_challenges")
      ? " Database table missing — run migration 075_passkey_auth_challenges.sql in Supabase."
      : "";
    return { error: new Error(`${optionsError}${hint}`) };
  }

  if (!optionsData?.configured || !optionsData.options) {
    return {
      error: new Error(
        optionsData?.message ??
          "Passkey sign-in is not configured on this server. Deploy the passkey-verify Edge Function."
      ),
    };
  }

  try {
    const assertion = await startAuthentication({
      optionsJSON: optionsData.options as PublicKeyCredentialRequestOptionsJSON,
    });

    const { data: verifyData, error: verifyError } = await invokePasskey<PasskeyVerifyResponse>({
      action: "login-verify",
      origin,
      assertion: assertion as AuthenticationResponseJSON,
    });

    if (verifyError) {
      const needsRegistration =
        verifyError.toLowerCase().includes("no passkey found") ||
        verifyError.toLowerCase().includes("not registered");
      return {
        error: new Error(
          needsRegistration
            ? "No passkey registered for this site. Sign in with email or Google, then add a passkey under Settings → Passkeys."
            : verifyError
        ),
      };
    }

    if (!verifyData?.configured || !verifyData.tokenHash) {
      return {
        error: new Error(verifyData?.message ?? "Passkey verification did not return a session."),
      };
    }

    const sessionError = await completePasskeySession(verifyData.tokenHash);
    return { error: sessionError };
  } catch (e) {
    if (e instanceof Error && e.name === "NotAllowedError") {
      return { error: new Error("Passkey sign-in was cancelled.") };
    }
    return { error: e instanceof Error ? e : new Error("Passkey sign-in failed.") };
  }
}

export async function registerPasskey(deviceName?: string): Promise<{ error: Error | null }> {
  if (!isPasskeySupported()) {
    return { error: new Error("Passkeys are not supported in this browser.") };
  }

  const origin = passkeyOrigin();
  const { data: optionsData, error: optionsError } = await invokePasskey<PasskeyOptionsResponse>({
    action: "register-options",
    origin,
  });

  if (optionsError) {
    return { error: new Error(optionsError) };
  }

  if (!optionsData?.configured || !optionsData.options) {
    return { error: new Error("Could not start passkey registration.") };
  }

  try {
    const attestation = await startRegistration({
      optionsJSON: optionsData.options as PublicKeyCredentialCreationOptionsJSON,
    });

    const { error: verifyError } = await invokePasskey<PasskeyVerifyResponse>({
      action: "register-verify",
      origin,
      attestation: attestation as RegistrationResponseJSON,
      deviceName,
    });

    if (verifyError) {
      return { error: new Error(verifyError) };
    }

    return { error: null };
  } catch (e) {
    if (e instanceof Error && e.name === "NotAllowedError") {
      return { error: new Error("Passkey registration was cancelled.") };
    }
    return { error: e instanceof Error ? e : new Error("Passkey registration failed.") };
  }
}

export async function listPasskeys(): Promise<{ credentials: PasskeyCredentialSummary[]; error: Error | null }> {
  const { data, error } = await invokePasskey<PasskeyListResponse>({ action: "list", origin: passkeyOrigin() });
  if (error) {
    return { credentials: [], error: new Error(error) };
  }
  return { credentials: data?.credentials ?? [], error: null };
}

export async function deletePasskey(credentialId: string): Promise<{ error: Error | null }> {
  const { error } = await invokePasskey<PasskeyVerifyResponse>({
    action: "delete",
    origin: passkeyOrigin(),
    credentialId,
  });
  return { error: error ? new Error(error) : null };
}
