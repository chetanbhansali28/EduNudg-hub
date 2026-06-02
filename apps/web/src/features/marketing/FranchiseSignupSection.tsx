import { useState } from "react";
import { Button, Input, MutationError } from "@edunudg/ui";
import { submitFranchiseInquiry } from "@/lib/brandLandingApi";

type Props = {
  brandSlug: string;
};

export function FranchiseSignupSection({ brandSlug }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const { error: err } = await submitFranchiseInquiry(brandSlug, {
      fullName,
      email,
      phone,
      city,
      message,
    });
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setSubmitted(true);
  };

  return (
    <section id="apply" data-nav-theme="light" className="novu-franchise-apply novu-reveal">
      <div className="novu-franchise-apply__card">
        <h2>Start your franchise application</h2>
        <p>Tell us about yourself and your preferred city. Our team will reach out with next steps.</p>

        {submitted ? (
          <p className="novu-franchise-apply__success" role="status">
            Thank you—we received your application and will be in touch shortly.
          </p>
        ) : (
          <form className="novu-franchise-apply__form" onSubmit={(e) => void handleSubmit(e)}>
            <div className="novu-franchise-apply__grid">
              <Input label="Full name" value={fullName} onChange={setFullName} autoComplete="name" />
              <Input label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
              <Input label="Phone" value={phone} onChange={setPhone} placeholder="+91…" autoComplete="tel" />
              <Input label="Preferred city" value={city} onChange={setCity} autoComplete="address-level2" />
            </div>
            <label className="ed-field">
              <span className="ed-field__label">Message (optional)</span>
              <textarea
                className="ed-field__input novu-franchise-apply__textarea"
                value={message}
                rows={4}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your background, timeline, or questions…"
              />
            </label>
            <MutationError message={error} />
            <Button type="submit" disabled={submitting} block>
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
