import { useState } from "react";
import { Button, Input, MutationError } from "@edunudg/ui";
import type { HomepageBrandSignupCopy } from "@/types/homepage";
import { usePlatformIntegration } from "@/hooks/usePlatformIntegration";
import { submitPlatformBrandSignup } from "@/lib/platformBrandSignupApi";
import { INDIA_CITY_OPTIONS } from "./indiaCities";

type Props = {
  copy: HomepageBrandSignupCopy;
};

export function EnterpriseBrandSignupSection({ copy }: Props) {
  const signupEnabled = usePlatformIntegration("platform_brand_signup");
  const [requestedName, setRequestedName] = useState("");
  const [adminFullName, setAdminFullName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: err } = await submitPlatformBrandSignup({
      requestedName,
      adminFullName,
      email,
      city,
      phoneE164: phone,
      country: "IN",
      message,
    });
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setDone(true);
  };

  if (!signupEnabled) return null;

  return (
    <section id="brand-signup" className="ent-section ent-signup ent-reveal">
      <div className="ent-section__inner">
        <div className="ent-signup__grid">
          <div className="ent-signup__promo">
            <h2>{copy.promoTitle}</h2>
            <p>{copy.promoSubtitle}</p>
            <ol className="ent-signup__steps" aria-label="Signup steps">
              {copy.steps.map((label, i) => (
                <li key={label} className="ent-signup__step">
                  <span className="ent-signup__step-num" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="ent-signup__step-label">{label}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="ent-signup__card">
            <h3>{copy.formTitle}</h3>
            <p>{copy.formSubtitle}</p>
            {done ? (
              <p className="ent-signup__success" role="status">
                Thanks — we received your request. Our team will review and email you when your brand site is ready.
              </p>
            ) : (
              <form className="ent-signup__form-grid" onSubmit={(e) => void handleSubmit(e)}>
                <MutationError message={error} />
                <div className="ent-signup__form-grid ent-signup__form-grid--two">
                  <Input label="Organization name" value={requestedName} onChange={setRequestedName} />
                  <Input label="Admin name" value={adminFullName} onChange={setAdminFullName} />
                  <Input label="Work email" value={email} onChange={setEmail} type="email" />
                  <Input label="Phone" value={phone} onChange={setPhone} placeholder="9890200000" />
                  <Input
                    label="City"
                    value={city}
                    onChange={setCity}
                    placeholder="Mumbai"
                    list="ent-india-cities"
                  />
                </div>
                <datalist id="ent-india-cities">
                  {INDIA_CITY_OPTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <Input label="Message (optional)" value={message} onChange={setMessage} />
                <Button
                  type="submit"
                  block
                  disabled={submitting || !requestedName.trim() || !email.trim() || !city.trim()}
                >
                  {submitting ? "Submitting…" : copy.submitLabel}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
