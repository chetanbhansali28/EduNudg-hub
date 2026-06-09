import type { HomepageTestimonial } from "@/types/homepage";

export function parseTestimonialAuthor(item: HomepageTestimonial): { name: string; role: string } {
  if (item.role?.trim()) {
    return { name: item.author.trim(), role: item.role.trim() };
  }

  const parts = item.author.split(/\s*[·|,]\s*/);
  if (parts.length >= 2) {
    return { name: parts[0]!.trim(), role: parts.slice(1).join(", ").trim() };
  }

  return { name: item.author.trim(), role: "" };
}
