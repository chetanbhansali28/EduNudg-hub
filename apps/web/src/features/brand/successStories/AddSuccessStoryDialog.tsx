import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, FormGrid, Input, MutationError, Textarea, ToggleField } from "@edunudg/ui";
import { MarketingMediaField } from "@/features/marketing/MarketingMediaField";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { getSupabase } from "@/lib/supabase";
import type { StoryForm } from "./SuccessStoryCard";
import "@/features/platform/brandDetailPage.css";
import "@/features/brand/franchiseApplications/franchiseApplications.css";

type Props = {
  brandId: string;
  open: boolean;
  onClose: () => void;
};

const emptyForm: StoryForm = {
  title: "",
  quote: "",
  authorName: "",
  authorRole: "",
  rating: "",
  imageUrl: "",
  sortOrder: "0",
  isPublished: true,
};

function isStoryFormValid(form: StoryForm) {
  return Boolean(form.title.trim() && form.quote.trim() && form.authorName.trim());
}

export function AddSuccessStoryDialog({ brandId, open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (open) return;
    setForm(emptyForm);
  }, [open]);

  const create = useMutation({
    mutationFn: async () => {
      clear();
      const { error: mErr } = await getSupabase().from("brand_success_stories").insert({
        brand_id: brandId,
        title: form.title.trim(),
        quote: form.quote.trim(),
        author_name: form.authorName.trim(),
        author_role: form.authorRole.trim() || null,
        rating: form.rating ? parseInt(form.rating, 10) : null,
        image_url: form.imageUrl.trim() || null,
        sort_order: parseInt(form.sortOrder, 10) || 0,
        is_published: form.isPublished,
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["brand-success-stories", brandId] });
      onClose();
    },
    onError: capture,
  });

  const handleClose = () => {
    if (create.isPending) return;
    clear();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="ed-import-dialog ed-franchise-app-manual-dialog"
      aria-labelledby="add-success-story-title"
      onClose={handleClose}
      onClick={(event) => event.target === dialogRef.current && handleClose()}
    >
      <div className="ed-import-dialog__panel" role="document">
        <header className="ed-import-dialog__header">
          <h2 id="add-success-story-title">Add success story</h2>
          <button type="button" className="ed-import-dialog__close" aria-label="Close" onClick={handleClose}>
            ×
          </button>
        </header>

        <div className="ed-import-dialog__body">
          <p className="ed-import-dialog__intro">
            Published stories appear on your brand marketing site testimonials.
          </p>
          <MutationError message={error} />
          <FormGrid>
            <Input label="Title" value={form.title} onChange={(title) => setForm((prev) => ({ ...prev, title }))} />
            <Input
              label="Author name"
              value={form.authorName}
              onChange={(authorName) => setForm((prev) => ({ ...prev, authorName }))}
            />
            <Input
              label="Author role"
              value={form.authorRole}
              onChange={(authorRole) => setForm((prev) => ({ ...prev, authorRole }))}
            />
            <Input
              label="Rating (1–5)"
              value={form.rating}
              onChange={(rating) => setForm((prev) => ({ ...prev, rating }))}
            />
            <Input
              label="Sort order"
              value={form.sortOrder}
              onChange={(sortOrder) => setForm((prev) => ({ ...prev, sortOrder }))}
            />
          </FormGrid>
          <MarketingMediaField
            label="Story image"
            value={form.imageUrl}
            onChange={(imageUrl) => setForm((prev) => ({ ...prev, imageUrl }))}
            mediaType="image"
            uploadSubdir="success-stories/new"
            uploadScope={{ kind: "brand", brandId }}
          />
          <Textarea
            label="Quote"
            value={form.quote}
            onChange={(quote) => setForm((prev) => ({ ...prev, quote }))}
            rows={4}
          />
          <ToggleField
            label="Published"
            description="Show on brand marketing site (#testimonials)"
            checked={form.isPublished}
            onChange={(isPublished) => setForm((prev) => ({ ...prev, isPublished }))}
          />
        </div>

        <footer className="ed-import-dialog__footer">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!isStoryFormValid(form) || create.isPending}
          >
            {create.isPending ? "Creating…" : "Create story"}
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
