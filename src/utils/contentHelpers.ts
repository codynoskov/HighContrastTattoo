import type { CollectionEntry } from 'astro:content';

type ArtistEntry = CollectionEntry<'artists'>;
type StyleEntry = CollectionEntry<'styles'>;
type WorkEntry = CollectionEntry<'works'>;

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

/**
 * Filter works by artist slug.
 */
export function getWorksByArtist(artistSlug: string, works: WorkEntry[]): WorkEntry[] {
  return works.filter((work) => work.data.artist === artistSlug);
}

/**
 * Filter works by style slug.
 */
export function getWorksByStyle(styleSlug: string, works: WorkEntry[]): WorkEntry[] {
  return works.filter((work) => work.data.styles.includes(styleSlug));
}

/**
 * Resolve artist slug to artist name.
 */
export function resolveArtistName(artistSlug: string, artists: ArtistEntry[]): string | undefined {
  const artist = artists.find((a) => getSlug(a) === artistSlug);
  return artist?.data.name;
}

/**
 * Options for transforming works to gallery images.
 */
export interface WorksToGalleryOptions {
  /** The context determines what tags to show */
  context: 'artist' | 'style';
  /** Style entries for resolving style names (used in artist context) */
  styles?: StyleEntry[];
  /** Artist entries for resolving artist names (used in style context) */
  artists?: ArtistEntry[];
}

/**
 * Transform works collection entries into gallery images with appropriate tags.
 * - Artist pages: Show style tags (Primary/teal color)
 * - Style pages: Show artist tags (Accent/pink color, "Created by [Name]" format)
 */
export function worksToGalleryImages(works: WorkEntry[], options: WorksToGalleryOptions): GalleryImage[] {
  const { context, styles = [], artists = [] } = options;

  return works.map((work) => {
    const tags: GalleryImage['tags'] = [];

    if (context === 'artist' && styles.length > 0) {
      // Show style tags for artist pages (Primary color)
      const styleNames = resolveStyleNames(work.data.styles, styles);
      styleNames.forEach((styleName) => {
        tags.push({ text: styleName, color: 'Primary' });
      });
    } else if (context === 'style' && artists.length > 0) {
      // Show artist tags for style pages (Accent color)
      const artistName = resolveArtistName(work.data.artist, artists);
      if (artistName) {
        tags.push({ text: `Created by ${artistName}`, color: 'Accent' });
      }
    }

    return {
      src: work.data.image,
      alt: `Tattoo work`,
      tags,
    };
  });
}
