import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, url }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OAuth Error</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
    h1 { color: #d32f2f; }
  </style>
</head>
<body>
  <h1>OAuth Error</h1>
  <p>${error}</p>
  <p>Please try again.</p>
</body>
</html>
    `;
    return new Response(errorHtml, { 
      status: 400,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }

  if (!code) {
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OAuth Error</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
    h1 { color: #d32f2f; }
  </style>
</head>
<body>
  <h1>OAuth Error</h1>
  <p>Missing authorization code</p>
  <p>Please try logging in again.</p>
</body>
</html>
    `;
    return new Response(errorHtml, { 
      status: 400,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }

  const clientId = import.meta.env.GITHUB_CLIENT_ID;
  const clientSecret = import.meta.env.GITHUB_CLIENT_SECRET;
  // Get the base URL from the request headers (more reliable in Cloudflare)
  const host = request.headers.get('host') || url.host;
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${host}`;
  const redirectUri = `${baseUrl}/api/callback`;

  if (!clientId || !clientSecret) {
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Configuration Error</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
    h1 { color: #d32f2f; }
  </style>
</head>
<body>
  <h1>Configuration Error</h1>
  <p>GitHub OAuth credentials are not configured</p>
  <p>Please configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your .env file.</p>
</body>
</html>
    `;
    return new Response(errorHtml, { 
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    });
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
      const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OAuth Error</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
    h1 { color: #d32f2f; }
  </style>
</head>
<body>
  <h1>OAuth Error</h1>
  <p>Failed to exchange code for token: ${errorText}</p>
  <p>Please try logging in again.</p>
</body>
</html>
      `;
      return new Response(errorHtml, { 
        status: 500,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OAuth Error</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
    h1 { color: #d32f2f; }
  </style>
</head>
<body>
  <h1>OAuth Error</h1>
  <p>${tokenData.error_description || tokenData.error}</p>
  <p>Please try logging in again.</p>
</body>
</html>
      `;
      return new Response(errorHtml, { 
        status: 400,
        headers: {
          'Content-Type': 'text/html',
        },
      });
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
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OAuth Error</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
    h1 { color: #d32f2f; }
  </style>
</head>
<body>
  <h1>OAuth Error</h1>
  <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
  <p>Please try logging in again.</p>
</body>
</html>
    `;
    return new Response(errorHtml, { 
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
};

