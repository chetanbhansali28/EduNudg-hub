import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  FormGrid,
  Input,
  ListRow,
  MutationError,
  PageGridFull,
  PageTitle,
  Textarea,
} from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

interface Story {
  id: string;
  title: string;
  quote: string;
  author_name: string;
  author_role: string | null;
  rating: number | null;
  image_url: string | null;
  sort_order: number;
  is_published: boolean;
}

const emptyForm = {
  title: "",
  quote: "",
  authorName: "",
  authorRole: "",
  rating: "",
  imageUrl: "",
  sortOrder: "0",
  isPublished: true,
};

export function BrandSuccessStoriesPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

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
      return supabaseList(data, qErr) as Story[];
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
      setEditingId(null);
    },
    onError: capture,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm("Delete this success story?")) return;
      clear();
      const { error: mErr } = await getSupabase().from("brand_success_stories").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidate,
    onError: capture,
  });

  if (missingBrand) return <p className="ed-empty">Brand context not found.</p>;

  return (
    <>
      <PageTitle>Success stories</PageTitle>
      <MutationError message={error} />

      <PageGridFull>
        <Card title="Add success story">
          <FormGrid>
            <Input label="Title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
            <Input label="Author name" value={form.authorName} onChange={(v) => setForm((f) => ({ ...f, authorName: v }))} />
            <Input label="Author role" value={form.authorRole} onChange={(v) => setForm((f) => ({ ...f, authorRole: v }))} />
            <Input label="Rating (1–5)" value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
            <Input label="Image URL" value={form.imageUrl} onChange={(v) => setForm((f) => ({ ...f, imageUrl: v }))} />
            <Input label="Sort order" value={form.sortOrder} onChange={(v) => setForm((f) => ({ ...f, sortOrder: v }))} />
          </FormGrid>
          <Textarea label="Quote" value={form.quote} onChange={(v) => setForm((f) => ({ ...f, quote: v }))} rows={4} />
          <label className="ed-field">
            <span className="ed-field__label">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
              />{" "}
              Published on brand marketing site (#testimonials)
            </span>
          </label>
          <Button
            onClick={() => create.mutate()}
            disabled={!form.title.trim() || !form.quote.trim() || !form.authorName.trim() || create.isPending}
          >
            Create story
          </Button>
        </Card>
      </PageGridFull>

      <PageGridFull>
        <Card title="Success stories">
          <DataList
            items={stories.data ?? []}
            empty="No success stories yet."
            render={(s) => {
              const editing = editingId === s.id;
              return (
                <ListRow
                  aside={
                    <CrudRowActions
                      editing={editing}
                      onEdit={() => {
                        setEditingId(s.id);
                        setEditForm({
                          title: s.title,
                          quote: s.quote,
                          authorName: s.author_name,
                          authorRole: s.author_role ?? "",
                          rating: s.rating != null ? String(s.rating) : "",
                          imageUrl: s.image_url ?? "",
                          sortOrder: String(s.sort_order),
                          isPublished: s.is_published,
                        });
                      }}
                      onSave={() => update.mutate(s.id)}
                      onCancel={() => setEditingId(null)}
                      onDelete={() => remove.mutate(s.id)}
                      saveDisabled={!editForm.title.trim() || update.isPending}
                    />
                  }
                >
                  {editing ? (
                    <Textarea label="Quote" value={editForm.quote} onChange={(v) => setEditForm((f) => ({ ...f, quote: v }))} />
                  ) : (
                    <div>
                      <strong>{s.title}</strong>
                      <Badge tone={s.is_published ? "success" : "default"}>
                        {s.is_published ? "Published" : "Draft"}
                      </Badge>
                      <p className="ed-text-sm ed-muted">{s.author_name}{s.author_role ? ` · ${s.author_role}` : ""}</p>
                      <p className="ed-text-sm">“{s.quote.slice(0, 120)}{s.quote.length > 120 ? "…" : ""}”</p>
                    </div>
                  )}
                </ListRow>
              );
            }}
          />
        </Card>
      </PageGridFull>
    </>
  );
}
