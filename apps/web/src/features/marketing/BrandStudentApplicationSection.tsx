import { useState } from "react";
import { Button, Input, MutationError } from "@edunudg/ui";
import { submitBrandStudentApplication } from "@/lib/leadsApi";
import { EnquiryPromoSection } from "./EnquiryPromoSection";

type Props = { brandSlug: string };

export function BrandStudentApplicationSection({ brandSlug }: Props) {
  const [parentName, setParentName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [childName, setChildName] = useState("");
  const [childDob, setChildDob] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: err } = await submitBrandStudentApplication(brandSlug, {
      parentName,
      whatsappE164: whatsapp,
      email,
      city,
      pincode,
      childName,
      childDob: childDob || undefined,
      schoolName,
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
      id="enroll-student"
      accent="student"
      eyebrow="Student enrollment"
      title="Give your child a head start in mental math"
      subtitle="Small batches, certified instructors, and visible progress every week. Apply now — a center near you will call on WhatsApp."
      perks={[
        "Free trial class at a nearby center",
        "Structured levels from foundations to competitions",
        "Weekly progress updates for parents",
      ]}
    >
      <div className="novu-franchise-apply__card">
        <h2>Quick application</h2>
        <p>City and pincode help us route you to the right franchise center.</p>
        {done ? (
          <p className="novu-franchise-apply__success" role="status">
            Application received. A center will contact you on WhatsApp.
          </p>
        ) : (
          <form className="novu-franchise-apply__form" onSubmit={(e) => void handleSubmit(e)}>
            <MutationError message={error} />
            <div className="novu-franchise-apply__grid">
              <Input label="Parent name" value={parentName} onChange={setParentName} />
              <Input label="WhatsApp number" value={whatsapp} onChange={setWhatsapp} placeholder="+91…" />
              <Input label="Email" value={email} onChange={setEmail} type="email" />
              <Input label="City" value={city} onChange={setCity} />
              <Input label="Pincode" value={pincode} onChange={setPincode} placeholder="6 digits" />
              <Input label="Child name" value={childName} onChange={setChildName} />
            </div>
            <Input label="Child date of birth" value={childDob} onChange={setChildDob} type="date" />
            <Input label="School name (optional)" value={schoolName} onChange={setSchoolName} />
            <Input label="Notes (optional)" value={notes} onChange={setNotes} />
            <Button
              type="submit"
              block
              disabled={
                submitting ||
                !parentName.trim() ||
                !whatsapp.trim() ||
                !email.trim() ||
                !city.trim() ||
                !pincode.trim()
              }
            >
              {submitting ? "Submitting…" : "Request a free trial"}
            </Button>
          </form>
        )}
      </div>
    </EnquiryPromoSection>
  );
}
