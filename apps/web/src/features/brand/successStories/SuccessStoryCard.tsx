import { useState } from "react";
import { Badge, Button, FormGrid, Input, SaveButton, Textarea, ToggleField } from "@edunudg/ui";
import { MarketingMediaField } from "@/features/marketing/MarketingMediaField";
import { ConfirmDeleteDialog } from "@/features/shared/ConfirmDeleteDialog";

export type StoryForm = {
  title: string;
  quote: string;
  authorName: string;
  authorRole: string;
  rating: string;
  imageUrl: string;
  sortOrder: string;
  isPublished: boolean;
};

export type StoryRow = {
  id: string;
  title: string;
  quote: string;
  author_name: string;
  author_role: string | null;
  rating: number | null;
  image_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at?: string | null;
};

const TRASH_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

type Props = {
  story: StoryRow;
  brandId: string;
  editing: boolean;
  editForm: StoryForm;
  saveDisabled: boolean;
  savePending: boolean;
  saveSaved?: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onEditFormChange: (next: StoryForm) => void;
};

function quotePreview(quote: string) {
  const trimmed = quote.trim();
  if (trimmed.length <= 160) return trimmed;
  return `${trimmed.slice(0, 160)}…`;
}

function stars(rating: number | null) {
  if (rating == null || rating < 1) return null;
  const capped = Math.min(5, Math.max(1, rating));
  return "★".repeat(capped) + "☆".repeat(5 - capped);
}

export function SuccessStoryCard({
  story,
  brandId,
  editing,
  editForm,
  saveDisabled,
  savePending,
  saveSaved = false,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onEditFormChange,
}: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const statusTone = story.is_published ? "success" : "default";
  const statusLabel = story.is_published ? "Published" : "Draft";
  const ratingLabel = stars(story.rating);

  return (
    <article className={`ed-success-story-card${editing ? " ed-success-story-card--editing" : ""}`}>
      {!editing ? (
        <div className="ed-success-story-card__preview">
          <div className="ed-success-story-card__media">
            {story.image_url ? (
              <img src={story.image_url} alt="" className="ed-success-story-card__image" />
            ) : (
              <div className="ed-success-story-card__image-fallback" aria-hidden>
                {story.author_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="ed-success-story-card__body">
            <div className="ed-success-story-card__head">
              <div className="ed-success-story-card__title-row">
                <h3 className="ed-success-story-card__title">{story.title}</h3>
                <Badge tone={statusTone}>{statusLabel}</Badge>
              </div>
              <p className="ed-success-story-card__author">
                {story.author_name}
                {story.author_role ? ` · ${story.author_role}` : ""}
              </p>
              {ratingLabel ? <p className="ed-success-story-card__rating">{ratingLabel}</p> : null}
            </div>
            <blockquote className="ed-success-story-card__quote">“{quotePreview(story.quote)}”</blockquote>
            <p className="ed-success-story-card__meta">Sort order {story.sort_order}</p>
          </div>

          <div className="ed-success-story-card__actions">
            <button type="button" className="ed-success-story-card__edit-btn" onClick={onEdit}>
              Edit story
            </button>
            <button
              type="button"
              className="ed-success-story-card__delete-btn"
              aria-label={`Delete ${story.title}`}
              onClick={() => setDeleteOpen(true)}
            >
              {TRASH_ICON}
            </button>
          </div>
        </div>
      ) : (
        <div className="ed-success-story-card__edit">
          <div className="ed-success-story-card__edit-head">
            <h3 className="ed-success-story-card__title">Edit success story</h3>
            <Badge tone={editForm.isPublished ? "success" : "default"}>
              {editForm.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>

          <FormGrid>
            <Input
              label="Title"
              value={editForm.title}
              onChange={(value) => onEditFormChange({ ...editForm, title: value })}
            />
            <Input
              label="Author name"
              value={editForm.authorName}
              onChange={(value) => onEditFormChange({ ...editForm, authorName: value })}
            />
            <Input
              label="Author role"
              value={editForm.authorRole}
              onChange={(value) => onEditFormChange({ ...editForm, authorRole: value })}
            />
            <Input
              label="Rating (1–5)"
              value={editForm.rating}
              onChange={(value) => onEditFormChange({ ...editForm, rating: value })}
            />
            <Input
              label="Sort order"
              value={editForm.sortOrder}
              onChange={(value) => onEditFormChange({ ...editForm, sortOrder: value })}
            />
          </FormGrid>

          <MarketingMediaField
            label="Story image"
            value={editForm.imageUrl}
            onChange={(value) => onEditFormChange({ ...editForm, imageUrl: value })}
            mediaType="image"
            uploadSubdir={`success-stories/${story.id}`}
            uploadScope={{ kind: "brand", brandId }}
          />

          <Textarea
            label="Quote"
            value={editForm.quote}
            onChange={(value) => onEditFormChange({ ...editForm, quote: value })}
            rows={4}
          />

          <ToggleField
            label="Published"
            description="Show on brand marketing site (#testimonials)"
            checked={editForm.isPublished}
            onChange={(checked) => onEditFormChange({ ...editForm, isPublished: checked })}
          />

          <div className="ed-success-story-card__edit-actions">
            <SaveButton
              onClick={onSave}
              disabled={saveDisabled}
              pending={savePending}
              saved={saveSaved}
              label="Save changes"
            />
            <Button variant="ghost" onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          onDelete();
          setDeleteOpen(false);
        }}
        title="Delete success story?"
        description={`This removes “${story.title}” from your testimonials.`}
      />
    </article>
  );
}
