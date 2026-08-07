import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FormGrid,
  Input,
  MutationError,
  Textarea,
  ToggleField,
} from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import { useSavedFlash } from "@/features/shared/useSavedFlash";
import { MarketingMediaField } from "@/features/marketing/MarketingMediaField";
import {
  SuccessStoryCard,
  type StoryForm,
  type StoryRow,
} from "./SuccessStoryCard";
import "./brandSuccessStories.css";

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

export function BrandSuccessStoriesPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const storySaved = useSavedFlash();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [addOpen, setAddOpen] = useState(false);
  const { bindClose, closeAddForm } = useAddFormCloser();

  const stories = useQuery({
    queryKey: ["brand-success-stories", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brand_success_stories")
        .select("id, title, quote, author_name, author_role, rating, image_url, sort_order, is_published")
        .eq("brand_id", brandId!)
        .order("sort_order")
        .order("created_at", { ascending: false });
      return supabaseList(data, qErr) as StoryRow[];
    },
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["brand-success-stories", brandId] });

  const create = useMutation({
    mutationFn: async () => {
      if (!brandId) throw new Error("Brand required");
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
      invalidate();
      setForm(emptyForm);
      closeAddForm();
      setAddOpen(false);
    },
    onError: capture,
  });

  const update = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("brand_success_stories")
        .update({
          title: editForm.title.trim(),
          quote: editForm.quote.trim(),
          author_name: editForm.authorName.trim(),
          author_role: editForm.authorRole.trim() || null,
          rating: editForm.rating ? parseInt(editForm.rating, 10) : null,
          image_url: editForm.imageUrl.trim() || null,
          sort_order: parseInt(editForm.sortOrder, 10) || 0,
          is_published: editForm.isPublished,
        })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidate();
      storySaved.flash();
      window.setTimeout(() => setEditingId(null), 1500);
    },
    onError: capture,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase().from("brand_success_stories").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      if (editingId) setEditingId(null);
      invalidate();
    },
    onError: capture,
  });

  if (missingBrand) return <p className="ed-empty">Brand context not found.</p>;

  const rows = stories.data ?? [];

  return (
    <div className="ed-success-stories-page">
      <header className="ed-success-stories-page__header">
        <div className="ed-success-stories-page__header-copy">
          <h1 className="ed-success-stories-page__title">Success stories</h1>
          <p className="ed-success-stories-page__subtitle">
            Quotes published here appear on your brand marketing site testimonials. Configure homepage placement in{" "}
            <Link to="/app/homepage">Homepage</Link>.
          </p>
        </div>
        <div className="ed-success-stories-page__header-actions">
          <Button onClick={() => setAddOpen(true)}>+ Add success story</Button>
        </div>
      </header>

      <MutationError message={error} />

      <AddFormSection
        buttonLabel="+ Add success story"
        panelTitle="Add success story"
        open={addOpen}
        onOpenChange={setAddOpen}
        hideTrigger
      >
        {({ close }) => {
          bindClose(close);
          return (
            <>
              <FormGrid>
                <Input label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
                <Input
                  label="Author name"
                  value={form.authorName}
                  onChange={(v) => setForm((f) => ({ ...f, authorName: v }))}
                />
                <Input
                  label="Author role"
                  value={form.authorRole}
                  onChange={(v) => setForm((f) => ({ ...f, authorRole: v }))}
                />
                <Input label="Rating (1–5)" value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
                <Input
                  label="Sort order"
                  value={form.sortOrder}
                  onChange={(v) => setForm((f) => ({ ...f, sortOrder: v }))}
                />
              </FormGrid>
              <MarketingMediaField
                label="Story image"
                value={form.imageUrl}
                onChange={(v) => setForm((f) => ({ ...f, imageUrl: v }))}
                mediaType="image"
                uploadSubdir="success-stories/new"
                uploadScope={{ kind: "brand", brandId: brandId! }}
              />
              <Textarea
                label="Quote"
                value={form.quote}
                onChange={(v) => setForm((f) => ({ ...f, quote: v }))}
                rows={4}
              />
              <ToggleField
                label="Published"
                description="Show on brand marketing site (#testimonials)"
                checked={form.isPublished}
                onChange={(checked) => setForm((f) => ({ ...f, isPublished: checked }))}
              />
              <Button
                onClick={() => create.mutate()}
                disabled={!isStoryFormValid(form) || create.isPending}
              >
                {create.isPending ? "Creating…" : "Create story"}
              </Button>
            </>
          );
        }}
      </AddFormSection>

      <section className="ed-success-stories-page__list" aria-label="Success stories">
        {rows.length === 0 ? (
          <p className="ed-success-stories-page__empty">No success stories yet. Add one to feature on your homepage.</p>
        ) : (
          rows.map((story) => {
            const editing = editingId === story.id;
            return (
              <SuccessStoryCard
                key={story.id}
                story={story}
                brandId={brandId!}
                editing={editing}
                editForm={editForm}
                saveDisabled={!isStoryFormValid(editForm)}
                savePending={update.isPending}
                saveSaved={storySaved.saved && editing}
                onEdit={() => {
                  setEditingId(story.id);
                  setEditForm({
                    title: story.title,
                    quote: story.quote,
                    authorName: story.author_name,
                    authorRole: story.author_role ?? "",
                    rating: story.rating != null ? String(story.rating) : "",
                    imageUrl: story.image_url ?? "",
                    sortOrder: String(story.sort_order),
                    isPublished: story.is_published,
                  });
                }}
                onCancelEdit={() => setEditingId(null)}
                onSave={() => update.mutate(story.id)}
                onDelete={() => remove.mutate(story.id)}
                onEditFormChange={setEditForm}
              />
            );
          })
        )}
      </section>
    </div>
  );
}
