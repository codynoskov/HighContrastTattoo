import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, url }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return new Response(`OAuth error: ${error}`, { status: 400 });
  }

  if (!code) {
    return new Response('Missing authorization code', { status: 400 });
  }

  const clientId = import.meta.env.GITHUB_CLIENT_ID;
  const clientSecret = import.meta.env.GITHUB_CLIENT_SECRET;
  const baseUrl = import.meta.env.PUBLIC_BASE_URL || url.origin;
  const redirectUri = `${baseUrl}/api/callback`;

  if (!clientId || !clientSecret) {
    return new Response('GitHub OAuth credentials are not configured', { status: 500 });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return new Response(`Failed to exchange code for token: ${errorText}`, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      return new Response(`OAuth error: ${tokenData.error_description || tokenData.error}`, { status: 400 });
    }

    const accessToken = tokenData.access_token;

    // Return HTML page that posts the token back to Decap CMS
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authenticating...</title>
</head>
<body>
  <script>
    // Post the token back to Decap CMS
    window.opener.postMessage(
      'authorization:github:success:{"token":"${accessToken}","provider":"github"}',
      window.location.origin
    );
    window.close();
  </script>
  <p>Authentication successful. You can close this window.</p>
</body>
</html>
    `;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(`OAuth callback error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
};

