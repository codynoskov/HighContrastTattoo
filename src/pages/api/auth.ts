import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, url }) => {
  const clientId = import.meta.env.GITHUB_CLIENT_ID;
  const baseUrl = import.meta.env.PUBLIC_BASE_URL || url.origin;
  
  if (!clientId) {
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Configuration Error</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
    h1 { color: #d32f2f; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>Configuration Error</h1>
  <p><strong>GITHUB_CLIENT_ID is not configured</strong></p>
  <p>To fix this:</p>
  <ol>
    <li>Create a <code>.env</code> file in the project root</li>
    <li>Add your GitHub OAuth credentials:
      <pre><code>GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
PUBLIC_BASE_URL=http://localhost:4321</code></pre>
    </li>
    <li>Restart your development server</li>
  </ol>
  <p>Get your credentials from: <a href="https://github.com/settings/developers" target="_blank">GitHub OAuth Apps</a></p>
</body>
</html>
    `;
    return new Response(errorHtml, { 
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });
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

  // Redirect directly to GitHub OAuth
  // Decap CMS expects a redirect response
  return Response.redirect(authUrl.toString(), 302);
};

