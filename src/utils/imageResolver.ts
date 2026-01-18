import type { ImageMetadata } from 'astro';

/**
 * Eagerly load all images from src/assets/images at build time.
 * This enables Astro's built-in image optimization (WebP, srcset, etc.)
 */
const imageModules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{jpg,jpeg,png,gif,webp,avif}',
  { eager: true }
);

/**
 * Get ImageMetadata for an image path.
 * Converts CMS paths like /images/works/alex-1.jpg to src/assets paths.
 * 
 * @param path - The image path (e.g., "/images/works/alex-1.jpg" or "/src/assets/images/works/alex-1.jpg")
 * @returns ImageMetadata if found, null otherwise
 */
export function getImageMetadata(path: string): ImageMetadata | null {
  if (!path || typeof path !== 'string') {
    return null;
  }

  // Convert /images/... to /src/assets/images/...
  let assetPath = path;
  if (path.startsWith('/images/')) {
    assetPath = `/src/assets${path}`;
  } else if (!path.startsWith('/src/assets/images/')) {
    // Handle paths without leading slash
    if (path.startsWith('images/')) {
      assetPath = `/src/assets/${path}`;
    }
  }

  return imageModules[assetPath]?.default ?? null;
}

/**
 * Check if a path is a video file.
 * Videos continue to be served from R2/public, not optimized by Astro.
 */
export function isVideoPath(path: string): boolean {
  if (!path || typeof path !== 'string') {
    return false;
  }
  return /\.(mp4|webm|mov|avi)$/i.test(path);
}

/**
 * Get all available image paths from the glob.
 * Useful for debugging.
 */
export function getAvailableImagePaths(): string[] {
  return Object.keys(imageModules);
}
