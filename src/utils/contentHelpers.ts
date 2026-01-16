import type { CollectionEntry } from 'astro:content';

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
 * In development: uses local paths from /images/favicons/
 * In production: uses R2 URLs for GDPR compliance
 * Favicons are stored in images/favicons/ in both cases
 */
export function getFaviconUrl(filename: string): string {
  // In development mode, use local paths so favicons work without R2 sync
  if (import.meta.env.DEV) {
    return `/images/favicons/${filename}`;
  }
  
  // In production, use R2 URLs for GDPR compliance
  const R2_BASE_URL = import.meta.env.PUBLIC_R2_BASE_URL || DEFAULT_R2_BASE_URL;
  return `${R2_BASE_URL}/images/favicons/${filename}`;
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
  
  // Check if R2 is configured (env var or fallback)
  const R2_BASE_URL = import.meta.env.PUBLIC_R2_BASE_URL || DEFAULT_R2_BASE_URL;
  
  // Always use R2 for video files (which are stored in /images/videos/)
  // This ensures videos work in both website and PagesCMS preview
  const isVideoFile = /\.(mp4|webm|mov|avi)$/i.test(pathString);
  
  // If R2 is available or it's a video file, use R2 URL
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

export interface GalleryImage {
  src: string;
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
 * Extract artist slug from a work's slug.
 * Works are stored as: content/works/{artist}/{work-file}.md
 * So the slug is: {artist}/{work-name}
 */
export function getArtistSlugFromWork(work: WorkEntry): string {
  return work.slug.split('/')[0];
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
 * Resolve style slugs to their display names.
 * Returns an array of style names for the given slugs.
 * Handles both plain slugs and full paths from CMS.
 */
export function resolveStyleNames(styleSlugs: string[], styles: StyleEntry[]): string[] {
  const slugToName = new Map(styles.map((s) => [getSlug(s), s.data.name]));
  return normalizeStyleSlugs(styleSlugs)
    .map((slug) => slugToName.get(slug))
    .filter((name): name is string => name !== undefined);
}

/**
 * Resolve style slugs to style objects with name and href.
 * Handles both plain slugs and full paths from CMS.
 */
export function resolveStyles(styleSlugs: string[], styles: StyleEntry[]): Array<{ name: string; href: string }> {
  const styleMap = new Map(styles.map((s) => [getSlug(s), s]));
  return normalizeStyleSlugs(styleSlugs)
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
 * Artist is derived from the work's folder structure (slug prefix).
 */
export function getWorksByArtist(artistSlug: string, works: WorkEntry[]): WorkEntry[] {
  return works.filter((work) => getArtistSlugFromWork(work) === artistSlug);
}

/**
 * Filter works by style slug.
 * Handles both plain slugs and full paths from CMS stored in work.data.styles.
 */
export function getWorksByStyle(styleSlug: string, works: WorkEntry[]): WorkEntry[] {
  return works.filter((work) => 
    normalizeStyleSlugs(work.data.styles).includes(styleSlug)
  );
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
 * Resolve artist slug to artist object with name and href.
 */
export function resolveArtist(artistSlug: string, artists: ArtistEntry[]): { name: string; href: string } | undefined {
  const artist = artists.find((a) => getSlug(a) === artistSlug);
  if (!artist) return undefined;
  return {
    name: artist.data.name,
    href: `/artists/${getSlug(artist)}`,
  };
}

/**
 * Transform works collection entries into gallery images with appropriate tags.
 * - Artist pages: Show style tags (Primary/teal color) linking to style pages
 * - Style pages: Show artist tags (Accent/pink color, "Created by [Name]" format) linking to artist pages
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
      const resolvedArtist = resolveArtist(getArtistSlugFromWork(work), artists);
      if (resolvedArtist) {
        tags.push({ text: `Created by ${resolvedArtist.name}`, color: 'Accent', href: resolvedArtist.href });
      }
    }

    return {
      src: resolveImagePath(work.data.image),
      alt: `Tattoo work`,
      tags,
    };
  });
}
