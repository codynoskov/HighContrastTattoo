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
 * Find artists that work in a given style.
 * Matches by checking if the style name is in the artist's styles array
 * OR if any of their works are tagged with this style.
 */
export function getRelatedArtists(
  styleName: string,
  artists: ArtistEntry[],
  works: WorkEntry[]
): Artist[] {
  return artists
    .filter((artist) => {
      // Check if artist has this style in their styles array
      const hasStyle = artist.data.styles.includes(styleName);
      // Check if any of their works are tagged with this style
      const hasTaggedWork = works.some(
        (work) => work.data.artist === artist.data.name && work.data.styles.includes(styleName)
      );
      return hasStyle || hasTaggedWork;
    })
    .map((artist) => ({
      name: artist.data.name,
      href: `/artists/${getSlug(artist)}`,
    }));
}

/**
 * Get gallery images for a style by collecting works that are tagged with this style.
 * Falls back to the style's cover image if no tagged works exist.
 */
export function getStyleGalleryImages(
  styleName: string,
  works: WorkEntry[],
  artists: ArtistEntry[],
  fallbackCover?: string
): GalleryImage[] {
  const images: GalleryImage[] = [];

  for (const work of works) {
    if (work.data.styles.includes(styleName)) {
      const artistName = work.data.artist;
      images.push({
        src: work.data.image,
        alt: `${styleName} tattoo by ${artistName}`,
        tags: [{ text: `By ${artistName}`, color: 'Accent' }],
      });
    }
  }

  // If no tagged works, use cover image as fallback
  if (images.length === 0 && fallbackCover) {
    images.push({
      src: fallbackCover,
      alt: `${styleName} example`,
      tags: [{ text: styleName, color: 'Primary' }],
    });
  }

  return images;
}

/**
 * Resolve style names (already names, just validate they exist).
 * Returns an array of style names that exist in the styles collection.
 */
export function resolveStyleNames(styleNames: string[], styles: StyleEntry[]): string[] {
  const validStyleNames = new Set(styles.map((s) => s.data.name));
  return styleNames.filter((name) => validStyleNames.has(name));
}

/**
 * Resolve style names to style objects with name and href.
 */
export function resolveStyles(styleNames: string[], styles: StyleEntry[]): Array<{ name: string; href: string }> {
  const styleMap = new Map(styles.map((s) => [s.data.name, s]));
  return styleNames
    .map((name) => {
      const style = styleMap.get(name);
      if (!style) return null;
      return {
        name: style.data.name,
        href: `/styles/${getSlug(style)}`,
      };
    })
    .filter((s): s is { name: string; href: string } => s !== null);
}

/**
 * Convert works collection entries to gallery images format.
 */
export function worksToGalleryImages(
  works: WorkEntry[],
  artistName: string,
  styles: StyleEntry[]
): GalleryImage[] {
  return works.map((work) => {
    const styleNames = resolveStyleNames(work.data.styles, styles);
    const tags: GalleryImage['tags'] = styleNames.length > 0
      ? styleNames.map((name) => ({ text: name, color: 'Primary' as const }))
      : undefined;

    return {
      src: work.data.image,
      alt: `Tattoo work by ${artistName}`,
      tags,
    };
  });
}

/**
 * Get works by artist name.
 */
export function getWorksByArtist(artistName: string, works: WorkEntry[]): WorkEntry[] {
  return works.filter((work) => work.data.artist === artistName);
}
