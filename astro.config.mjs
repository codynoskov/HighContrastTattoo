// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  // Set SITE_URL environment variable for CMS preview support
  // Example: SITE_URL=https://your-site.com npm run build
  site: process.env.SITE_URL || process.env.PUBLIC_SITE_URL || 'https://highcontrasttattoo.com',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/internal/') && !page.includes('/_design-system/'),
    }),
  ],
  devToolbar: {
    enabled: false
  },
  image: {
    // Enable remote image optimization
    // This allows optimizing images from external sources like R2
    // List all allowed domains explicitly (wildcards are not supported)
    domains: [
      'pub-5fa780a0c82a42df836a1dd9282c562b.r2.dev',
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