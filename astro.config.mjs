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
  }
});