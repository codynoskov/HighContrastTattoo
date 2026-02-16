# PostHog Cloudflare Reverse Proxy

Proxies PostHog analytics through your domain to avoid ad blockers. See [PostHog docs](https://posthog.com/docs/advanced/proxy/cloudflare).

## Setup

### 1. Deploy the Worker

```bash
cd workers/posthog-proxy
npx wrangler deploy
```

### 2. Add a custom domain

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **posthog-proxy**
2. **Settings** → **Domains & Routes** → **Add**
3. Add a subdomain like `ph.highcontrasttattoo.com` or `ingest.highcontrasttattoo.com`
4. Avoid obvious names: `analytics`, `tracking`, `posthog`, `telemetry`

The domain must be managed by Cloudflare (same account as your Pages site).

### 3. Configure your app

Add to your `.env` (or Cloudflare Pages env vars for production):

```
PUBLIC_POSTHOG_API_HOST=https://ph.highcontrasttattoo.com
```

Replace with your actual proxy subdomain.

### 4. Verify

1. Deploy your site with the new env var
2. Open DevTools → Network tab
3. Trigger a page view
4. Confirm requests go to your proxy domain (e.g. `ph.highcontrasttattoo.com`) with `200 OK`
5. Check PostHog app for incoming events
