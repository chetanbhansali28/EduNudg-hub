import { useState } from "react";
import { Button, Input, MutationError } from "@edunudg/ui";
import { submitCenterStudentRegistration } from "@/lib/leadsApi";
import { isIndiaPincode } from "@/lib/leadSla";
import { EnquiryPromoSection } from "./EnquiryPromoSection";

type Props = { brandSlug: string; centerSlug: string };

export function CenterStudentRegistrationSection({ brandSlug, centerSlug }: Props) {
  const [parentName, setParentName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [childName, setChildName] = useState("");
  const [childDob, setChildDob] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const pincodeValid = !pincode.trim() || isIndiaPincode(pincode);
  const pincodeHint = pincode.trim() && !pincodeValid ? "Use a 6-digit India pincode or leave blank" : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.trim() && !pincodeValid) {
      setError("Enter a valid 6-digit India pincode or leave blank.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: err } = await submitCenterStudentRegistration(brandSlug, centerSlug, {
      parentName,
      whatsappE164: whatsapp,
      email,
      city: city || undefined,
      pincode: pincode || undefined,
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
        <p>We&apos;ll reach out within 1 business day.</p>
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
              <Input label="City (optional)" value={city} onChange={setCity} />
              <Input label="Pincode (optional)" value={pincode} onChange={setPincode} placeholder="6 digits" />
            </div>
            {pincodeHint && <p className="ed-text-sm ed-muted">{pincodeHint}</p>}
            <Input label="Child date of birth" value={childDob} onChange={setChildDob} type="date" />
            <Input label="Notes (optional)" value={notes} onChange={setNotes} />
            <Button
              type="submit"
              block
              disabled={
                submitting ||
                !parentName.trim() ||
                !whatsapp.trim() ||
                !email.trim() ||
                !pincodeValid
              }
            >
              {submitting ? "Submitting…" : "Register for a free trial"}
            </Button>
          </form>
        )}
      </div>
    </EnquiryPromoSection>
  );
}
