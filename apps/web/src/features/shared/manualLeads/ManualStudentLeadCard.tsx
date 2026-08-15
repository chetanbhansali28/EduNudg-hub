import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, FormGrid, Input, MutationError, Textarea } from "@edunudg/ui";
import { createBrandStudentLeadStaff, createCenterStudentLeadStaff } from "@/lib/manualLeadsApi";
import { PHONE_INPUT_PLACEHOLDER } from "@/lib/phoneInput";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { isIndiaPincode } from "@/lib/leadSla";
import "@/features/platform/brandDetailPage.css";
import "@/features/brand/franchiseApplications/franchiseApplications.css";

type Props =
  | { scope: "brand"; brandId: string; invalidateKey: unknown[]; open: boolean; onClose: () => void }
  | { scope: "center"; centerId: string; invalidateKey: unknown[]; open: boolean; onClose: () => void };

const emptyForm = {
  parentName: "",
  whatsapp: "",
  email: "",
  city: "",
  pincode: "",
  childName: "",
  childDob: "",
  schoolName: "",
  notes: "",
};

export function ManualStudentLeadCard(props: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(emptyForm);

  const isBrand = props.scope === "brand";
  const pincodeRequired = isBrand;
  const pincodeValid = pincodeRequired ? isIndiaPincode(form.pincode) : !form.pincode.trim() || isIndiaPincode(form.pincode);
  const pincodeHint =
    form.pincode.trim() && !pincodeValid
      ? isBrand
        ? "Enter a valid 6-digit India pincode"
        : "Use a 6-digit India pincode or leave blank"
      : undefined;

  const setField = (key: keyof typeof emptyForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (props.open && !dialog.open) dialog.showModal();
    if (!props.open && dialog.open) dialog.close();
  }, [props.open]);

  useEffect(() => {
    if (props.open) return;
    setForm(emptyForm);
  }, [props.open]);

  const save = useMutation({
    mutationFn: async () => {
      if (!pincodeValid) {
        throw new Error(
          isBrand ? "Enter a valid 6-digit India pincode." : "Enter a valid 6-digit India pincode or leave blank."
        );
      }
      clear();
      const payload = {
        parentName: form.parentName,
        whatsappE164: form.whatsapp,
        email: form.email,
        city: form.city,
        pincode: form.pincode || undefined,
        childName: form.childName,
        childDob: form.childDob || undefined,
        schoolName: form.schoolName || undefined,
        notes: form.notes,
      };
      if (props.scope === "brand") {
        const { error: err } = await createBrandStudentLeadStaff(props.brandId, payload);
        if (err) throw new Error(err);
      } else {
        const { error: err } = await createCenterStudentLeadStaff(props.centerId, payload);
        if (err) throw new Error(err);
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: props.invalidateKey });
      props.onClose();
    },
    onError: capture,
  });

  const handleClose = () => {
    if (save.isPending) return;
    clear();
    props.onClose();
  };

  const brandCanSubmit =
    form.parentName.trim() &&
    form.whatsapp.trim() &&
    form.email.trim() &&
    form.city.trim() &&
    form.pincode.trim() &&
    pincodeValid;

  const centerCanSubmit = form.parentName.trim() && form.whatsapp.trim() && form.email.trim() && pincodeValid;
  const canSubmit = isBrand ? brandCanSubmit : centerCanSubmit;

  return (
    <dialog
      ref={dialogRef}
      className="ed-import-dialog ed-franchise-app-manual-dialog"
      aria-labelledby="manual-student-lead-title"
      onClose={handleClose}
      onClick={(event) => event.target === dialogRef.current && handleClose()}
    >
      <div className="ed-import-dialog__panel" role="document">
        <header className="ed-import-dialog__header">
          <h2 id="manual-student-lead-title">Add student lead</h2>
          <button type="button" className="ed-import-dialog__close" aria-label="Close" onClick={handleClose}>
            ×
          </button>
        </header>

        <div className="ed-import-dialog__body">
          <p className="ed-import-dialog__intro">
            Walk-in or phone enquiry — same fields as the public {isBrand ? "student application" : "center registration"}{" "}
            form. Duplicate WhatsApp merges per brand.
          </p>
          <MutationError message={error} />

          <div className="ed-franchise-app-manual-dialog__sections">
            <section className="ed-franchise-app-detail__card">
              <h3 className="ed-franchise-app-detail__card-title">Parent</h3>
              <FormGrid>
                <Input label="Parent name" value={form.parentName} onChange={setField("parentName")} autoComplete="name" />
                <Input
                  label="WhatsApp number"
                  value={form.whatsapp}
                  onChange={setField("whatsapp")}
                  placeholder={PHONE_INPUT_PLACEHOLDER}
                  autoComplete="tel"
                />
                <Input label="Email" value={form.email} onChange={setField("email")} type="email" autoComplete="email" />
              </FormGrid>
            </section>

            <section className="ed-franchise-app-detail__card">
              <h3 className="ed-franchise-app-detail__card-title">Child</h3>
              <FormGrid>
                <Input label="Child name" value={form.childName} onChange={setField("childName")} />
                <Input label="Child date of birth" value={form.childDob} onChange={setField("childDob")} type="date" />
                {isBrand ? (
                  <Input label="School name (optional)" value={form.schoolName} onChange={setField("schoolName")} />
                ) : null}
              </FormGrid>
            </section>

            <section className="ed-franchise-app-detail__card">
              <h3 className="ed-franchise-app-detail__card-title">Location</h3>
              <FormGrid>
                <Input
                  label={isBrand ? "City" : "City (optional)"}
                  value={form.city}
                  onChange={setField("city")}
                  autoComplete="address-level2"
                />
                <Input
                  label={isBrand ? "Pincode" : "Pincode (optional)"}
                  value={form.pincode}
                  onChange={setField("pincode")}
                  placeholder="6 digits"
                />
              </FormGrid>
              {pincodeHint ? <p className="ed-text-sm ed-muted">{pincodeHint}</p> : null}
            </section>

            <section className="ed-franchise-app-detail__card ed-franchise-app-detail__card--wide">
              <h3 className="ed-franchise-app-detail__card-title">Notes</h3>
              <Textarea label="Notes (optional)" value={form.notes} onChange={setField("notes")} rows={3} />
            </section>
          </div>
        </div>

        <footer className="ed-import-dialog__footer">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={() => save.mutate()} disabled={!canSubmit || save.isPending}>
            {save.isPending ? "Creating…" : "Create lead"}
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
