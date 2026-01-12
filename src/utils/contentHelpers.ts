import type { CollectionEntry } from 'astro:content';

type ArtistEntry = CollectionEntry<'artists'>;
type StyleEntry = CollectionEntry<'styles'>;

export interface GalleryImage {
  src: string;
  alt?: string;
  tags?: Array<{
    text: string;
    color?: 'Primary' | 'Accent' | 'Neutral';
  }>;
}

export interface Artist {
  name: string;
  href?: string;
}

/**
 * Get the URL slug for a content entry.
 * Uses slugOverride if defined, otherwise falls back to the file-based slug.
 */
export function getSlug(entry: { slug: string; data: { slugOverride?: string; name: string } }): string {
  return entry.data.slugOverride ?? entry.slug;
}


/**
 * Resolve style slugs to their display names.
 * Returns an array of style names for the given slugs.
 */
export function resolveStyleNames(styleSlugs: string[], styles: StyleEntry[]): string[] {
  const slugToName = new Map(styles.map((s) => [getSlug(s), s.data.name]));
  return styleSlugs
    .map((slug) => slugToName.get(slug))
    .filter((name): name is string => name !== undefined);
}

/**
 * Resolve style slugs to style objects with name and href.
 */
export function resolveStyles(styleSlugs: string[], styles: StyleEntry[]): Array<{ name: string; href: string }> {
  const styleMap = new Map(styles.map((s) => [getSlug(s), s]));
  return styleSlugs
    .map((slug) => {
      const style = styleMap.get(slug);
      if (!style) return null;
      return {
        name: style.data.name,
        href: `/styles/${getSlug(style)}`,
      };
    })
    .filter((s): s is { name: string; href: string } => s !== null);
}

