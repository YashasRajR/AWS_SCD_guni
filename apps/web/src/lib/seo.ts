import { useEffect } from 'react';

interface DocumentHeadOptions {
  title: string;
  description?: string;
}

const SITE_NAME = 'AWS Student Community Day 2026';

function setMeta(nameOrProperty: string, content: string, isProperty = false): void {
  const attr = isProperty ? 'property' : 'name';
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${nameOrProperty}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, nameOrProperty);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * This is a plain Vite SPA (no server-side rendering), so per-page
 * metadata is applied client-side on mount: document title, meta
 * description, and Open Graph tags. Base/default OG tags live in
 * index.html for the very first paint before React mounts.
 */
export function useDocumentHead({ title, description }: DocumentHeadOptions): void {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} · ${SITE_NAME}`;
    document.title = fullTitle;
    if (description) {
      setMeta('description', description);
      setMeta('og:description', description, true);
    }
    setMeta('og:title', fullTitle, true);
  }, [title, description]);
}
