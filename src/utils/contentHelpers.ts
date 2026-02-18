import type { CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { getImageMetadata, isVideoPath } from './imageResolver';

// Re-export for convenience
export { isVideoPath } from './imageResolver';

type ArtistEntry = CollectionEntry<'artists'>;
type StyleEntry = CollectionEntry<'styles'>;
type WorkEntry = CollectionEntry<'works'>;

/**
 * Default R2 base URL fallback (used if PUBLIC_R2_BASE_URL env var is not available)
 * This ensures videos work in PagesCMS preview and other contexts
 */
const DEFAULT_R2_BASE_URL = 'https://pub-5fa780a0c82a42df836a1dd9282c562b.r2.dev';

/**
 * Get URL for favicon files.
 * - Uses R2 URLs if PUBLIC_R2_BASE_URL is explicitly set (for GDPR compliance)
 * - Otherwise uses local paths from /images/favicons/ (works in dev and production)
 * Favicons are stored in images/favicons/ in both cases
 */
export function getFaviconUrl(filename: string): string {
  // Only use R2 if PUBLIC_R2_BASE_URL is explicitly set
  // This allows favicons to work locally and in production until R2 is fully configured
  const R2_BASE_URL = import.meta.env.PUBLIC_R2_BASE_URL;
  
  if (R2_BASE_URL) {
    // Use R2 URLs when explicitly configured (for GDPR compliance)
    return `${R2_BASE_URL}/images/favicons/${filename}`;
  }
  
  // Fallback to local paths (works in both dev and production builds)
  return `/images/favicons/${filename}`;
}

/**
 * Resolve image path for both website and CMS contexts.
 * - Handles both string paths and CMS image objects (e.g., { src: "...", alt: "..." })
 * - If path is already absolute (http/https), returns as-is
 * - If path starts with '/', ensures it works correctly
 * - For CMS previews, can convert to absolute URL if SITE_URL is set
 * - Supports R2 bucket URLs via PUBLIC_R2_BASE_URL
 * - Falls back to default R2 URL for videos/images to ensure PagesCMS preview works
 */
export function resolveImagePath(imagePath: string | { src?: string; url?: string; path?: string; [key: string]: any } | undefined, useAbsoluteUrl = false): string {
  if (!imagePath) return '';
  
  // Handle CMS image objects (PagesCMS may return objects instead of strings)
  let pathString: string;
  if (typeof imagePath === 'object') {
    // Skip if it's an array
    if (Array.isArray(imagePath)) {
      return '';
    }
    
    // Check if object has any keys that look like field descriptions (long text with spaces)
    // PagesCMS sometimes returns field schema objects instead of values
    const keys = Object.keys(imagePath);
    const hasDescriptionLikeKey = keys.some(key => 
      key.length > 30 || // Long keys are likely descriptions
      key.includes('shown while') || // Common description phrases
      key.includes('Recommended') ||
      key.includes('description') ||
      key.includes('label')
    );
    
    if (hasDescriptionLikeKey && !imagePath.src && !imagePath.url && !imagePath.path) {
      // This is a schema/metadata object, not an actual image value
      return '';
    }
    
    // Extract the actual path from CMS image object
    // Common CMS object structures:
    // - { src: "...", alt: "..." }
    // - { url: "..." }
    // - { path: "..." }
    pathString = imagePath.src || imagePath.url || imagePath.path || '';
    
    // If the object looks like metadata/description (has description key but no path-like values), skip it
    if (!pathString && ('description' in imagePath || 'label' in imagePath)) {
      return '';
    }
    
    if (!pathString || typeof pathString !== 'string') {
      return '';
    }
  } else if (typeof imagePath === 'string') {
    pathString = imagePath;
  } else {
    // Fallback for unexpected types
    return '';
  }
  
  // If already absolute URL, return as-is
  if (pathString.startsWith('http://') || pathString.startsWith('https://')) {
    return pathString;
  }
  
  // Check if R2 is explicitly configured via env var
  const R2_BASE_URL = import.meta.env.PUBLIC_R2_BASE_URL;
  
  // Always use R2 for video files (which are stored in /images/videos/)
  // This ensures videos work in both website and PagesCMS preview
  const isVideoFile = /\.(mp4|webm|mov|avi)$/i.test(pathString);
  
  // Use R2 URL if explicitly configured, or use fallback only for video files
  if (R2_BASE_URL || isVideoFile) {
    const effectiveR2Url = R2_BASE_URL || DEFAULT_R2_BASE_URL;
    // Remove leading slash if present, then prepend with images/ prefix
    const cleanPath = pathString.startsWith('/') ? pathString.slice(1) : pathString;
    // Ensure images/ prefix (your current paths like /images/works/... will become images/works/...)
    const r2Path = cleanPath.startsWith('images/') ? cleanPath : `images/${cleanPath}`;
    return `${effectiveR2Url}/${r2Path}`;
  }
  
  // Normalize path to start with '/' (fallback for local development without R2)
  const normalizedPath = pathString.startsWith('/') ? pathString : `/${pathString}`;
  
  // If absolute URL is requested (e.g., for CMS preview), construct full URL
  if (useAbsoluteUrl) {
    // Try to get site URL from Astro config (available at build time)
    // @ts-ignore - import.meta.env.SITE is available in Astro
    const siteUrl = import.meta.env.SITE || import.meta.env.PUBLIC_SITE_URL;
    if (siteUrl) {
      // Remove trailing slash from siteUrl if present
      const baseUrl = siteUrl.replace(/\/$/, '');
      return `${baseUrl}${normalizedPath}`;
    }
  }
  
  // Return relative path (works for website)
  return normalizedPath;
}

/**
 * Resolve an image path to either ImageMetadata (for optimized images) or a URL string.
 * 
 * This is the NEW preferred method for images that should be optimized by Astro.
 * - For images in src/assets/images: Returns ImageMetadata for full Astro optimization
 * - For videos: Returns R2 URL string (videos can't be optimized)
 * - For remote URLs: Returns the URL as-is
 * - For fallback: Returns the path string (served from public/)
 * 
 * @param imagePath - The image path from CMS or content (string or CMS object)
 * @returns ImageMetadata for optimizable images, string URL otherwise
 */
export function resolveImage(
  imagePath: string | { src?: string; url?: string; path?: string; [key: string]: any } | undefined
): ImageMetadata | string {
  if (!imagePath) return '';

  // Handle CMS image objects (same logic as resolveImagePath)
  let pathString: string;
  if (typeof imagePath === 'object') {
    if (Array.isArray(imagePath)) {
      return '';
    }
    
    // Check for field description objects
    const keys = Object.keys(imagePath);
    const hasDescriptionLikeKey = keys.some(key => 
      key.length > 30 ||
      key.includes('shown while') ||
      key.includes('Recommended') ||
      key.includes('description') ||
      key.includes('label')
    );
    
    if (hasDescriptionLikeKey && !imagePath.src && !imagePath.url && !imagePath.path) {
      return '';
    }
    
    pathString = imagePath.src || imagePath.url || imagePath.path || '';
    
    if (!pathString && ('description' in imagePath || 'label' in imagePath)) {
      return '';
    }
    
    if (!pathString || typeof pathString !== 'string') {
      return '';
    }
  } else if (typeof imagePath === 'string') {
    pathString = imagePath;
  } else {
    return '';
  }

  // If already absolute URL, return as-is (can't optimize remote images at build time)
  if (pathString.startsWith('http://') || pathString.startsWith('https://')) {
    return pathString;
  }

  // Videos always go through R2, return URL string
  if (isVideoPath(pathString)) {
    const R2_BASE_URL = import.meta.env.PUBLIC_R2_BASE_URL || DEFAULT_R2_BASE_URL;
    const cleanPath = pathString.startsWith('/') ? pathString.slice(1) : pathString;
    const r2Path = cleanPath.startsWith('images/') ? cleanPath : `images/${cleanPath}`;
    return `${R2_BASE_URL}/${r2Path}`;
  }

  // Try to get ImageMetadata for optimization
  const metadata = getImageMetadata(pathString);
  if (metadata) {
    return metadata;
  }

  // Fallback: return string path (will be served from public/ without optimization)
  // This allows gradual migration - images not yet moved still work
  return pathString.startsWith('/') ? pathString : `/${pathString}`;
}

export interface GalleryImage {
  src: ImageMetadata | string;
  alt?: string;
  tags?: Array<{
    text: string;
    color?: 'Primary' | 'Accent' | 'Neutral';
    href?: string;
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
 * Extract artist slugs from a work.
 * Returns the artists array from frontmatter if available (normalized from paths/slugs),
 * otherwise falls back to folder-based derivation for backwards compatibility.
 */
export function getArtistSlugsFromWork(work: WorkEntry): string[] {
  if (work.data.artists && work.data.artists.length > 0) {
    return normalizeArtistSlugs(work.data.artists);
  }
  return [work.slug.split('/')[0]];
}

/**
 * @deprecated Use getArtistSlugsFromWork instead (returns array for multi-artist support)
 */
export function getArtistSlugFromWork(work: WorkEntry): string {
  const artists = getArtistSlugsFromWork(work);
  return artists[0] || work.slug.split('/')[0];
}

/**
 * Normalize a style reference to just the slug.
 * Handles both plain slugs ("linework") and full paths ("src/content/styles/engraving.md").
 * This is needed because CMS relation widgets sometimes save full paths instead of slugs.
 */
export function normalizeStyleSlug(styleRef: string): string {
  // If it's a path (contains "/" or ends with ".md"), extract the slug
  if (styleRef.includes('/') || styleRef.endsWith('.md')) {
    // Extract filename without extension: "src/content/styles/engraving.md" -> "engraving"
    const filename = styleRef.split('/').pop() || styleRef;
    return filename.replace(/\.md$/, '');
  }
  // Already a plain slug
  return styleRef;
}

/**
 * Normalize an array of style references to slugs.
 */
export function normalizeStyleSlugs(styleRefs: string[]): string[] {
  return styleRefs.map(normalizeStyleSlug);
}

/**
 * Normalize an artist reference to just the slug.
 * Handles both plain slugs ("ed-zlotin") and full paths ("src/content/artists/2026-02-06-jab.md").
 * This is needed because CMS relation widgets sometimes save full paths or date-prefixed filenames.
 */
export function normalizeArtistSlug(artistRef: string): string {
  if (artistRef.includes('/') || artistRef.endsWith('.md')) {
    const filename = artistRef.split('/').pop() || artistRef;
    return filename.replace(/\.md$/, '');
  }
  return artistRef;
}

/**
 * Normalize an array of artist references to slugs.
 */
export function normalizeArtistSlugs(artistRefs: string[]): string[] {
  return artistRefs.map(normalizeArtistSlug);
}

/**
 * Slugify a display name into a URL-safe identifier.
 * "Bruno Da Mata" → "bruno-da-mata", "Bio Organic & Tribal" → "bio-organic-tribal"
 */
function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Build the full set of identifiers that could reference a given style.
 * Covers file slugs, slugOverrides, date-stripped slugs, slugified names,
 * and raw display names (Pages CMS stores the name field directly).
 */
function getStyleKnownSlugs(style: StyleEntry): Set<string> {
  const slugs = new Set<string>();

  slugs.add(style.slug);
  slugs.add(getSlug(style));

  const dateStripped = style.slug.replace(/^\d{4}-\d{2}-\d{2}-/, '');
  if (dateStripped !== style.slug) {
    slugs.add(dateStripped);
  }

  const nameSlug = slugifyName(style.data.name);
  if (nameSlug) slugs.add(nameSlug);

  slugs.add(style.data.name);

  return slugs;
}

/**
 * Build a reverse lookup from every known slug → StyleEntry.
 * Used by resolveStyles / resolveStyleNames so that any historical slug
 * (old slugOverride, file slug, slugified name) still finds the right style.
 */
function buildStyleLookup(styles: StyleEntry[]): Map<string, StyleEntry> {
  const lookup = new Map<string, StyleEntry>();
  for (const style of styles) {
    for (const slug of getStyleKnownSlugs(style)) {
      lookup.set(slug, style);
    }
  }
  return lookup;
}

/**
 * Resolve style slugs to their display names.
 * Handles both plain slugs and full paths from CMS.
 */
export function resolveStyleNames(styleSlugs: string[], styles: StyleEntry[]): string[] {
  const lookup = buildStyleLookup(styles);
  return normalizeStyleSlugs(styleSlugs)
    .map((slug) => lookup.get(slug)?.data.name)
    .filter((name): name is string => name !== undefined);
}

/**
 * Resolve style slugs to style objects with name and href.
 * Handles both plain slugs and full paths from CMS.
 */
export function resolveStyles(styleSlugs: string[], styles: StyleEntry[]): Array<{ name: string; href: string }> {
  const lookup = buildStyleLookup(styles);
  return normalizeStyleSlugs(styleSlugs)
    .map((slug) => {
      const style = lookup.get(slug);
      if (!style) return null;
      return {
        name: style.data.name,
        href: `/styles/${getSlug(style)}`,
      };
    })
    .filter((s): s is { name: string; href: string } => s !== null);
}

/**
 * Build the full set of identifiers that could reference a given artist.
 * Covers file slugs, slugOverrides, date-stripped slugs, slugified names,
 * and raw display names (Pages CMS stores the name field directly).
 */
function getArtistKnownSlugs(artist: ArtistEntry): Set<string> {
  const slugs = new Set<string>();

  slugs.add(artist.slug);
  slugs.add(getSlug(artist));

  const dateStripped = artist.slug.replace(/^\d{4}-\d{2}-\d{2}-/, '');
  if (dateStripped !== artist.slug) {
    slugs.add(dateStripped);
  }

  const nameSlug = slugifyName(artist.data.name);
  if (nameSlug) slugs.add(nameSlug);

  slugs.add(artist.data.name);

  return slugs;
}

/**
 * Filter works by artist slug.
 * Matches using every known identifier for the artist (file slug, display slug,
 * date-stripped slug, slugified name) against every identifier on the work
 * (explicit artists field + directory-based slug).
 */
export function getWorksByArtist(artistSlug: string, works: WorkEntry[], artists: ArtistEntry[]): WorkEntry[] {
  const artist = artists.find((a) => getSlug(a) === artistSlug);
  if (!artist) return [];

  const knownSlugs = getArtistKnownSlugs(artist);

  const filtered = works.filter((work) => {
    const explicitRefs = getArtistSlugsFromWork(work).map(normalizeArtistSlug);
    const dirSlug = work.slug.split('/')[0];
    const allRefs = new Set([...explicitRefs, dirSlug]);

    for (const ref of allRefs) {
      if (knownSlugs.has(ref)) return true;
    }
    return false;
  });

  return filtered.sort((a, b) => (a.data.order ?? 9999) - (b.data.order ?? 9999));
}

/**
 * Filter works by style slug.
 * Matches using every known identifier for the style (file slug, display slug,
 * date-stripped slug, slugified name) against the work's styles references.
 */
export function getWorksByStyle(styleSlug: string, works: WorkEntry[], styles: StyleEntry[]): WorkEntry[] {
  const style = styles.find((s) => getSlug(s) === styleSlug);
  if (!style) return [];

  const knownSlugs = getStyleKnownSlugs(style);

  const filtered = works.filter((work) => {
    const workStyleRefs = normalizeStyleSlugs(work.data.styles);
    return workStyleRefs.some((ref) => knownSlugs.has(ref));
  });

  return filtered.sort((a, b) => (a.data.order ?? 9999) - (b.data.order ?? 9999));
}

/**
 * Resolve artist slug/reference to artist name.
 * Uses the full set of known slugs (file slug, display slug, date-stripped, slugified name)
 * so that old references like "liza" still resolve even when slugOverride is "liza-tattoo-berlin".
 */
export function resolveArtistName(artistRef: string, artists: ArtistEntry[]): string | undefined {
  const normalizedRef = normalizeArtistSlug(artistRef);
  const artist = artists.find((a) => getArtistKnownSlugs(a).has(normalizedRef));
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
 * Resolve artist slug/reference to artist object with name and href.
 * Uses the full set of known slugs (file slug, display slug, date-stripped, slugified name)
 * so that old references like "liza" still resolve even when slugOverride is "liza-tattoo-berlin".
 */
export function resolveArtist(artistRef: string, artists: ArtistEntry[]): { name: string; href: string } | undefined {
  const normalizedRef = normalizeArtistSlug(artistRef);
  const artist = artists.find((a) => getArtistKnownSlugs(a).has(normalizedRef));
  if (!artist) return undefined;
  return {
    name: artist.data.name,
    href: `/artists/${getSlug(artist)}`,
  };
}

/**
 * Build SEO-friendly alt text for a tattoo work from its style and artist names.
 * Kept concise (max 125 chars) to balance SEO with limited redundancy for screen readers
 * who also hear the visible tags.
 */
function buildWorkAltText(styleNames: string[], artistNames: string[]): string {
  const stylePart =
    styleNames.length > 0
      ? styleNames.join(', ').replace(/, ([^,]*)$/, ' and $1') + ' tattoo'
      : 'Tattoo';
  const artistPart =
    artistNames.length > 1
      ? `by ${artistNames.join(' and ')}`
      : artistNames.length === 1
        ? `by ${artistNames[0]}`
        : '';
  const alt = artistPart ? `${stylePart} ${artistPart}` : stylePart;
  return alt.length <= 125 ? alt : alt.slice(0, 122) + '...';
}

/**
 * Transform works collection entries into gallery images with appropriate tags.
 * - Artist pages: Show style tags (Primary/teal color) linking to style pages
 * - Style pages: Show artist tags (Accent/pink color, "Created by [Name]" format) linking to artist pages
 * - Alt text is auto-generated from styles and artists for SEO; editors need not add it manually.
 */
export function worksToGalleryImages(works: WorkEntry[], options: WorksToGalleryOptions): GalleryImage[] {
  const { context, styles = [], artists = [] } = options;

  return works.map((work) => {
    const tags: GalleryImage['tags'] = [];

    if (context === 'artist' && styles.length > 0) {
      // Show style tags for artist pages (Primary color) with links to style pages
      const resolvedStyles = resolveStyles(work.data.styles, styles);
      resolvedStyles.forEach((style) => {
        tags.push({ text: style.name, color: 'Primary', href: style.href });
      });
    } else if (context === 'style' && artists.length > 0) {
      // Show artist tags for style pages (Accent color) with links to artist pages
      // Support multiple artists per work
      const artistSlugs = getArtistSlugsFromWork(work);
      const resolvedArtists = artistSlugs
        .map((slug) => resolveArtist(slug, artists))
        .filter((a): a is { name: string; href: string } => a !== undefined);

      if (resolvedArtists.length === 1) {
        // Single artist - use "Created by" format
        tags.push({ text: `Created by ${resolvedArtists[0].name}`, color: 'Accent', href: resolvedArtists[0].href });
      } else if (resolvedArtists.length > 1) {
        // Multiple artists - show each name as a separate tag
        resolvedArtists.forEach((artist) => {
          tags.push({ text: artist.name, color: 'Accent', href: artist.href });
        });
      }
    }

    // Auto-generate alt from styles and artists for SEO; no manual entry needed
    const styleNames = resolveStyleNames(work.data.styles ?? [], styles);
    const artistSlugs = getArtistSlugsFromWork(work);
    const artistNames = artistSlugs
      .map((slug) => resolveArtistName(slug, artists))
      .filter((n): n is string => Boolean(n));
    const alt = buildWorkAltText(styleNames, artistNames);

    return {
      src: resolveImage(work.data.image),
      alt,
      tags,
    };
  });
}
