# PostHog Reverse Proxy

Routes PostHog requests through `e.highcontrasttattoo.com` to avoid ad blockers.

## Deploy

1. **Deploy the Worker:**
   ```bash
   cd workers/posthog-proxy
   npx wrangler deploy
   ```

2. **Add custom domain** in Cloudflare Dashboard:
   - Workers & Pages → posthog-proxy → Settings → Domains & Routes
   - Add: `e.highcontrasttattoo.com`
   - Cloudflare will create the DNS record automatically

3. **Add to PostHog authorized URLs** (Settings → Web analytics):
   - `https://e.highcontrasttattoo.com`
   - `https://highcontrasttattoo.com` (if not already added)

4. **Deploy the website** so it uses the proxy (api_host is already set).

## Fallback

If the proxy isn't deployed yet, set `PUBLIC_POSTHOG_API_HOST=https://eu.i.posthog.com` to use PostHog directly.
