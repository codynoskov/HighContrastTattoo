#!/bin/bash
# Deploy PostHog reverse proxy worker
# Run from project root: ./hct-website/workers/posthog-proxy/deploy.sh

set -e
cd "$(dirname "$0")"

echo "Deploying PostHog proxy worker..."
npx wrangler deploy

echo ""
echo "Done! Next steps:"
echo "1. Add https://e.highcontrasttattoo.com to PostHog authorized URLs (Settings → Web analytics)"
echo "2. Your website will use the proxy on next deployment"
