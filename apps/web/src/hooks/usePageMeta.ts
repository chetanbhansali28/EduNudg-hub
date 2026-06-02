import { useEffect } from "react";

const DEFAULT_TITLE = "EduNudg";

export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} · ${DEFAULT_TITLE}` : DEFAULT_TITLE;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    const prevDescription = meta.content;
    if (description) meta.content = description;

    return () => {
      document.title = prevTitle;
      if (created) meta?.remove();
      else if (meta) meta.content = prevDescription;
    };
  }, [title, description]);
}
