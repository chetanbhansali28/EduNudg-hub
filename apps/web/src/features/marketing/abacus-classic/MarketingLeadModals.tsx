import { useEffect, useRef, useState } from "react";
import { Button, Input, MutationError } from "@edunudg/ui";
import { submitFranchiseInquiry } from "@/lib/brandLandingApi";
import { submitBrandStudentApplication } from "@/lib/leadsApi";
import { isIndiaPincode } from "@/lib/leadSla";
import { useLeadModal, type LeadModalKind } from "./LeadModalContext";

type Props = {
  brandSlug: string;
};

function ModalShell({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="ac-modal"
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
    >
      <div className="ac-modal__panel" role="document">
        <header className="ac-modal__header">
          <h2>{title}</h2>
          <button type="button" className="ac-modal__close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="ac-modal__body">{children}</div>
      </div>
    </dialog>
  );
}

function EnrollForm({ brandSlug, onSuccess }: { brandSlug: string; onSuccess: () => void }) {
  const [parentName, setParentName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [childName, setChildName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const pincodeValid = isIndiaPincode(pincode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincodeValid) {
      setError("Enter a valid 6-digit India pincode.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: err } = await submitBrandStudentApplication(brandSlug, {
      parentName,
      whatsappE164: whatsapp,
      email,
      city,
      pincode,
      childName,
    });
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setDone(true);
    onSuccess();
  };

  if (done) {
    return (
      <p className="ac-modal__success" role="status">
        Application received. A center will contact you on WhatsApp.
      </p>
    );
  }

  return (
    <form className="ac-modal__form" onSubmit={(e) => void handleSubmit(e)}>
      <MutationError message={error} />
      <div className="ac-modal__grid">
        <Input label="Parent name" value={parentName} onChange={setParentName} />
        <Input label="WhatsApp number" value={whatsapp} onChange={setWhatsapp} />
        <Input label="Email" value={email} onChange={setEmail} type="email" />
        <Input label="City" value={city} onChange={setCity} />
        <Input label="Pincode" value={pincode} onChange={setPincode} placeholder="6 digits" />
        <Input label="Child name" value={childName} onChange={setChildName} />
      </div>
      <Button
        type="submit"
        block
        disabled={
          submitting || !parentName.trim() || !whatsapp.trim() || !email.trim() || !city.trim() || !pincodeValid
        }
      >
        {submitting ? "Submitting…" : "Book free demo"}
      </Button>
    </form>
  );
}

function FranchiseForm({ brandSlug, onSuccess }: { brandSlug: string; onSuccess: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [qualification, setQualification] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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
      message: qualification ? `Qualification: ${qualification}` : undefined,
    });
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setDone(true);
    onSuccess();
  };

  if (done) {
    return (
      <p className="ac-modal__success" role="status">
        Thank you — we received your franchise application.
      </p>
    );
  }

  return (
    <form className="ac-modal__form" onSubmit={(e) => void handleSubmit(e)}>
      <MutationError message={error} />
      <div className="ac-modal__grid">
        <Input label="Full name" value={fullName} onChange={setFullName} />
        <Input label="Email" value={email} onChange={setEmail} type="email" />
        <Input label="WhatsApp number" value={phone} onChange={setPhone} />
        <Input label="City" value={city} onChange={setCity} />
        <Input label="Educational qualification" value={qualification} onChange={setQualification} />
      </div>
      <Button type="submit" block disabled={submitting || !fullName.trim() || !email.trim()}>
        {submitting ? "Submitting…" : "Apply for franchise"}
      </Button>
    </form>
  );
}

const MODAL_TITLES: Record<Exclude<LeadModalKind, null>, string> = {
  enroll: "Book a free demo class",
  apply: "Apply for franchise",
};

export function MarketingLeadModals({ brandSlug }: Props) {
  const { activeModal, closeModal } = useLeadModal();

  return (
    <>
      <ModalShell title={MODAL_TITLES.enroll} open={activeModal === "enroll"} onClose={closeModal}>
        <EnrollForm brandSlug={brandSlug} onSuccess={() => setTimeout(closeModal, 2000)} />
      </ModalShell>
      <ModalShell title={MODAL_TITLES.apply} open={activeModal === "apply"} onClose={closeModal}>
        <FranchiseForm brandSlug={brandSlug} onSuccess={() => setTimeout(closeModal, 2000)} />
      </ModalShell>
    </>
  );
}

export function resolveLeadModalKind(href: string): Exclude<LeadModalKind, null> | null {
  const normalized = href.replace(/^#/, "").trim().toLowerCase();
  if (normalized === "enroll" || normalized === "apply") return normalized;
  return null;
}

export function AbacusCtaButton({
  label,
  href,
  variant = "primary",
  className = "",
}: {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "nav-enroll" | "nav-apply";
  className?: string;
}) {
  const modal = useLeadModal();
  const modalKind = resolveLeadModalKind(href);

  if (modalKind) {
    return (
      <button
        type="button"
        className={`ac-btn ac-btn--${variant} ${className}`.trim()}
        onClick={() => modal.openModal(modalKind)}
      >
        {label}
      </button>
    );
  }

  return (
    <a href={href} className={`ac-btn ac-btn--${variant} ${className}`.trim()}>
      {label}
    </a>
  );
}
