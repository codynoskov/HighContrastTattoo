// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  // Set SITE_URL environment variable for CMS preview support
  // Example: SITE_URL=https://your-site.com npm run build
  site: process.env.SITE_URL || process.env.PUBLIC_SITE_URL,
  devToolbar: {
    enabled: false
  },
  image: {
    // Enable remote image optimization
    // This allows optimizing images from external sources like R2
    domains: [
      // Allow R2 bucket domain
      'pub-5fa780a0c82a42df836a1dd9282c562b.r2.dev',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        // Allow images from R2 bucket (and any subdomain)
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        // Allow images from any domain (useful for CMS previews and other R2 buckets)
        hostname: '**',
      },
    ],
    // Service configuration - Sharp is the default image optimizer
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        // Allow processing of very large images if needed
        // limitInputPixels: false, // Uncomment if you have very large source images
      },
    },
  },
});