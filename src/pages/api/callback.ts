import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, url }) => {
  // Log all query parameters for debugging
  const allParams = Object.fromEntries(url.searchParams.entries());
  console.log('Callback received with params:', allParams);
  
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
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  if (!code) {
    // Show debug information about what was received
    const debugInfo = JSON.stringify(allParams, null, 2);
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OAuth Error</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
    h1 { color: #d32f2f; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>OAuth Error</h1>
  <p>Missing authorization code</p>
  <p>Received parameters:</p>
  <pre>${debugInfo}</pre>
  <p>Full URL: ${url.toString()}</p>
  <p>Please try logging in again.</p>
</body>
</html>
    `;
    return new Response(errorHtml, { 
      status: 400,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  const clientId = import.meta.env.GITHUB_CLIENT_ID;
  const clientSecret = import.meta.env.GITHUB_CLIENT_SECRET;
  
  // Try multiple methods to get the correct base URL
  let baseUrl = import.meta.env.PUBLIC_BASE_URL;
  
  if (!baseUrl) {
    // Try from request URL
    baseUrl = url.origin;
    
    // If still localhost, try headers
    if (baseUrl.includes('localhost')) {
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 
                       request.headers.get('x-forwarded-scheme') || 
                       'https';
      if (host && !host.includes('localhost')) {
        baseUrl = `${protocol}://${host}`;
      }
    }
    
    // Final fallback - use production URL if we're not on localhost
    if (baseUrl.includes('localhost')) {
      baseUrl = 'https://hct-ana.pages.dev';
    }
  }
  
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
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
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
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': 'inline',
          'X-Content-Type-Options': 'nosniff',
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
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': 'inline',
          'X-Content-Type-Options': 'nosniff',
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
    (function() {
      try {
        // Post the token back to Decap CMS
        const message = 'authorization:github:success:{"token":"${accessToken}","provider":"github"}';
        
        if (window.opener) {
          window.opener.postMessage(message, window.location.origin);
          // Give it a moment to process, then close
          setTimeout(function() {
            window.close();
          }, 100);
        } else {
          // If no opener, redirect to admin page
          window.location.href = '/admin/';
        }
      } catch (e) {
        console.error('Error posting message:', e);
        // Fallback: redirect to admin page
        window.location.href = '/admin/';
      }
    })();
  </script>
  <p>Authentication successful. This window should close automatically.</p>
  <p>If it doesn't close, <a href="/admin/">click here</a> to go to the admin dashboard.</p>
</body>
</html>
    `;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
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
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }
};

