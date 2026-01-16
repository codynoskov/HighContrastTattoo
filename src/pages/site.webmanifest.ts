import type { APIRoute } from 'astro';
import { getFaviconUrl } from '../utils/contentHelpers';

export const GET: APIRoute = () => {
  const manifest = {
    name: '',
    short_name: '',
    icons: [
      {
        src: getFaviconUrl('android-chrome-192x192.png'),
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: getFaviconUrl('android-chrome-512x512.png'),
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
  };

  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
};
