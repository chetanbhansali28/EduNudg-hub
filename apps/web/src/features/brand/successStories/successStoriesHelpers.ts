import type { StoryRow } from "./SuccessStoryCard";

export type StoryFilter = "published" | "draft";

export const STORY_FILTER_OPTIONS: { value: StoryFilter; label: string; mobileLabel: string }[] = [
  { value: "published", label: "Published", mobileLabel: "Published" },
  { value: "draft", label: "Draft", mobileLabel: "Draft" },
];

export function storyCounts(stories: StoryRow[]) {
  return {
    published: stories.filter((story) => story.is_published).length,
    draft: stories.filter((story) => !story.is_published).length,
    withPhoto: stories.filter((story) => Boolean(story.image_url?.trim())).length,
    all: stories.length,
  };
}

export function storyMatchesSearch(story: StoryRow, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  const haystack = [story.title, story.quote, story.author_name, story.author_role]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function filterStories(stories: StoryRow[], filter: StoryFilter, search = "") {
  const query = search.trim();
  return stories.filter((story) => {
    if (query) return storyMatchesSearch(story, query);
    if (filter === "published") return story.is_published;
    return !story.is_published;
  });
}

export function storyStatusPresentation(story: StoryRow): {
  label: string;
  tone: "approved" | "pending";
} {
  return story.is_published
    ? { label: "PUBLISHED", tone: "approved" }
    : { label: "DRAFT", tone: "pending" };
}

export function storyAuthorLine(story: StoryRow): string | null {
  const name = story.author_name.trim();
  const role = story.author_role?.trim();
  if (name && role) return `${name} · ${role}`;
  return name || role || null;
}

export function formatStoryListDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatStoryRelativeWhen(iso: string | null | undefined, nowMs: number = Date.now()): string {
  if (!iso) return "";
  const diffMs = nowMs - new Date(iso).getTime();
  if (diffMs < 0) return "Just now";

  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return formatStoryListDate(iso);
}
