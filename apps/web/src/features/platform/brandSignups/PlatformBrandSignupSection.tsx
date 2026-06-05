import { useState } from "react";
import { Button, Input, MutationError } from "@edunudg/ui";
import { usePlatformIntegration } from "@/hooks/usePlatformIntegration";
import { submitPlatformBrandSignup } from "@/lib/platformBrandSignupApi";
import { EnquiryPromoSection } from "@/features/marketing/EnquiryPromoSection";

export function PlatformBrandSignupSection() {
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
    <EnquiryPromoSection
      id="brand-signup"
      accent="platform"
      eyebrow="For education brands"
      title="Launch your franchise network on EduNudg"
      subtitle="Multi-center ops, student & franchise leads, curriculum, and billing — built for abacus and enrichment brands."
      perks={[
        "Self-serve brand site + franchise applications",
        "Lead routing with 15-day SLA tools",
        "Platform subscription — franchises never pay EduNudg",
      ]}
    >
      <div className="novu-franchise-apply__card">
        <h2>Request your brand account</h2>
        <p>Our team reviews signups within 2–3 business days.</p>
        {done ? (
          <p className="novu-franchise-apply__success" role="status">
            Thanks — we received your request. Our team will review and email you when your brand site is ready.
          </p>
        ) : (
          <form className="novu-franchise-apply__form" onSubmit={(e) => void handleSubmit(e)}>
            <MutationError message={error} />
            <div className="novu-franchise-apply__grid">
              <Input label="Brand / organization name" value={requestedName} onChange={setRequestedName} />
              <Input label="Your name" value={adminFullName} onChange={setAdminFullName} />
              <Input label="Work email" value={email} onChange={setEmail} type="email" />
              <Input label="City" value={city} onChange={setCity} placeholder="Mumbai" />
            </div>
            <Input label="Phone" value={phone} onChange={setPhone} placeholder="+91…" />
            <Input label="Message (optional)" value={message} onChange={setMessage} />
            <Button type="submit" block disabled={submitting || !requestedName.trim() || !email.trim() || !city.trim()}>
              {submitting ? "Submitting…" : "Submit signup request"}
            </Button>
          </form>
        )}
      </div>
    </EnquiryPromoSection>
  );
}
