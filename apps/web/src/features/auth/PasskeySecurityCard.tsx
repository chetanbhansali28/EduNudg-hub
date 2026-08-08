import { useCallback, useEffect, useState } from "react";
import { Button, MutationError } from "@edunudg/ui";
import { usePlatformIntegrations } from "@/hooks/usePlatformIntegration";
import {
  deletePasskey,
  listPasskeys,
  registerPasskey,
  type PasskeyCredentialSummary,
} from "@/services/auth/passkeyService";
import { isPasskeySupported } from "@/lib/passkeyRpId";

function formatPasskeyDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function PasskeySecurityCard() {
  const integrations = usePlatformIntegrations();
  const [credentials, setCredentials] = useState<PasskeyCredentialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { credentials: rows, error: listError } = await listPasskeys();
    setCredentials(rows);
    setError(listError?.message ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!integrations.passkeys) return;
    void refresh();
  }, [integrations.passkeys, refresh]);

  if (!integrations.passkeys) return null;

  const supported = isPasskeySupported();

  const handleRegister = async () => {
    setPending(true);
    setError(null);
    setMessage(null);
    const label =
      typeof navigator !== "undefined" && /iPhone|iPad|Android/i.test(navigator.userAgent)
        ? "Mobile passkey"
        : "This device";
    const result = await registerPasskey(label);
    setPending(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setMessage("Passkey added. You can use it on the login page.");
    await refresh();
  };

  const handleDelete = async (credentialId: string) => {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await deletePasskey(credentialId);
    setPending(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setMessage("Passkey removed.");
    await refresh();
  };

  return (
    <section className="ed-card ed-passkey-card" aria-labelledby="passkey-security-heading">
      <h2 id="passkey-security-heading" className="ed-card__title">
        Passkeys
      </h2>
      <p className="ed-text-sm ed-muted">
        Register a passkey on this device (Touch ID, Face ID, Windows Hello, or phone screen lock). Works on
        desktop and mobile browsers over HTTPS.
      </p>
      <MutationError message={error} />
      {message ? (
        <p className="ed-text-sm" role="status">
          {message}
        </p>
      ) : null}
      {!supported ? (
        <p className="ed-text-sm ed-muted">This browser does not support passkeys.</p>
      ) : loading ? (
        <p className="ed-text-sm ed-muted">Loading passkeys…</p>
      ) : (
        <>
          {credentials.length === 0 ? (
            <p className="ed-text-sm ed-muted">No passkeys registered yet.</p>
          ) : (
            <ul className="ed-passkey-list">
              {credentials.map((cred) => (
                <li key={cred.credential_id} className="ed-passkey-list__item">
                  <div>
                    <strong>{cred.device_name ?? "Passkey"}</strong>
                    <div className="ed-text-sm ed-muted">Added {formatPasskeyDate(cred.created_at)}</div>
                  </div>
                  <Button
                    variant="ghost"
                    type="button"
                    disabled={pending}
                    onClick={() => void handleDelete(cred.credential_id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div style={{ marginTop: "0.75rem" }}>
            <Button type="button" disabled={pending} onClick={() => void handleRegister()}>
              {pending ? "Waiting for device…" : "Add passkey on this device"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
