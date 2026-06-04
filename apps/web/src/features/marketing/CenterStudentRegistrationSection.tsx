import { useState } from "react";
import { Button, Input, MutationError } from "@edunudg/ui";
import { submitCenterStudentRegistration } from "@/lib/leadsApi";
import { EnquiryPromoSection } from "./EnquiryPromoSection";

type Props = { brandSlug: string; centerSlug: string };

export function CenterStudentRegistrationSection({ brandSlug, centerSlug }: Props) {
  const [parentName, setParentName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [childDob, setChildDob] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: err } = await submitCenterStudentRegistration(brandSlug, centerSlug, {
      parentName,
      whatsappE164: whatsapp,
      email,
      childName,
      childDob: childDob || undefined,
      notes,
    });
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setDone(true);
  };

  return (
    <EnquiryPromoSection
      id="register"
      accent="student"
      eyebrow="Center registration"
      title="Book a free trial at this center"
      subtitle="Register in under 2 minutes. Our instructors will call you on WhatsApp to schedule your child's first class."
      perks={[
        "Same proven curriculum as the national brand",
        "Small batches with personal attention",
        "No payment required to register",
      ]}
    >
      <div className="novu-franchise-apply__card">
        <h2>Register with us</h2>
        <p>We'll reach out within 1 business day.</p>
        {done ? (
          <p className="novu-franchise-apply__success" role="status">
            Registration received. Expect a call from our center soon.
          </p>
        ) : (
          <form className="novu-franchise-apply__form" onSubmit={(e) => void handleSubmit(e)}>
            <MutationError message={error} />
            <div className="novu-franchise-apply__grid">
              <Input label="Parent name" value={parentName} onChange={setParentName} />
              <Input label="WhatsApp number" value={whatsapp} onChange={setWhatsapp} placeholder="+91…" />
              <Input label="Email" value={email} onChange={setEmail} type="email" />
              <Input label="Child name" value={childName} onChange={setChildName} />
            </div>
            <Input label="Child date of birth" value={childDob} onChange={setChildDob} type="date" />
            <Input label="Notes (optional)" value={notes} onChange={setNotes} />
            <Button type="submit" block disabled={submitting || !parentName.trim() || !whatsapp.trim() || !email.trim()}>
              {submitting ? "Submitting…" : "Register for a free trial"}
            </Button>
          </form>
        )}
      </div>
    </EnquiryPromoSection>
  );
}
