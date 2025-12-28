import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, url }) => {
  const clientId = import.meta.env.GITHUB_CLIENT_ID;
  const baseUrl = import.meta.env.PUBLIC_BASE_URL || url.origin;
  
  if (!clientId) {
    return new Response('GITHUB_CLIENT_ID is not configured', { status: 500 });
  }

  // Generate a random state parameter for CSRF protection
  const state = crypto.randomUUID();
  
  // Store state in a cookie (you might want to use a more secure method in production)
  const redirectUri = `${baseUrl}/api/callback`;
  
  // GitHub OAuth authorization URL
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', 'repo');

  // Return HTML page that redirects to GitHub OAuth
  // This works better in popup windows than a direct redirect
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting to GitHub...</title>
</head>
<body>
  <script>
    window.location.href = ${JSON.stringify(authUrl.toString())};
  </script>
  <p>Redirecting to GitHub...</p>
</body>
</html>
  `;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  });
};

