import { useState } from "react";
import { Button, Input, MutationError } from "@edunudg/ui";
import { submitCenterEnrollmentLead } from "@/lib/centerLandingApi";

type Props = {
  brandSlug: string;
  centerSlug: string;
};

export function ParentEnrollmentSignupSection({ brandSlug, centerSlug }: Props) {
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim() || !email.trim()) {
      setError("Parent name and email are required.");
      return;
    }

    const age = childAge.trim() ? Number.parseInt(childAge, 10) : undefined;
    if (childAge.trim() && (age === undefined || Number.isNaN(age) || age < 3 || age > 18)) {
      setError("Enter a valid child age (3–18) or leave blank.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const { error: err } = await submitCenterEnrollmentLead(brandSlug, centerSlug, {
      parentName,
      email,
      phone,
      childName,
      childAgeYears: age,
      notes,
    });
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setSubmitted(true);
  };

  return (
    <section id="enroll" data-nav-theme="light" className="novu-franchise-apply novu-reveal">
      <div className="novu-franchise-apply__card">
        <h2>Book a free trial class</h2>
        <p>
          Tell us about your child. Our admissions team will call to confirm a trial slot and answer
          your questions.
        </p>

        {submitted ? (
          <p className="novu-franchise-apply__success" role="status">
            Thank you—we received your request and will contact you shortly to schedule the trial.
          </p>
        ) : (
          <form className="novu-franchise-apply__form" onSubmit={(e) => void handleSubmit(e)}>
            <div className="novu-franchise-apply__grid">
              <Input
                label="Parent / guardian name"
                value={parentName}
                onChange={setParentName}
                autoComplete="name"
              />
              <Input label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
              <Input label="Phone" value={phone} onChange={setPhone} placeholder="9890200000" autoComplete="tel" />
              <Input label="Child's name" value={childName} onChange={setChildName} autoComplete="off" />
              <Input
                label="Child's age"
                value={childAge}
                onChange={setChildAge}
                placeholder="e.g. 7"
                type="number"
              />
            </div>
            <label className="ed-field">
              <span className="ed-field__label">Preferred timings or questions (optional)</span>
              <textarea
                className="ed-field__input novu-franchise-apply__textarea"
                value={notes}
                rows={4}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Weekday evenings, summer batch, learning goals…"
              />
            </label>
            <MutationError message={error} />
            <Button type="submit" disabled={submitting} block>
              {submitting ? "Submitting…" : "Request free trial"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
