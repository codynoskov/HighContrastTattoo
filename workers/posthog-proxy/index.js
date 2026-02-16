/**
 * PostHog Cloudflare Reverse Proxy (EU region)
 * Proxies analytics requests through your domain to avoid ad blockers.
 * See: https://posthog.com/docs/advanced/proxy/cloudflare
 */

const API_HOST = "eu.i.posthog.com";
const ASSET_HOST = "eu-assets.i.posthog.com";

async function handleRequest(request, ctx) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const search = url.search;
  const pathWithParams = pathname + search;

  if (pathname.startsWith("/static/")) {
    return retrieveStatic(request, pathWithParams, ctx);
  } else {
    return forwardRequest(request, pathWithParams);
  }
}

async function retrieveStatic(request, pathname, ctx) {
  let response = await caches.default.match(request);
  if (!response) {
    response = await fetch(`https://${ASSET_HOST}${pathname}`);
    ctx.waitUntil(caches.default.put(request, response.clone()));
  }
  return response;
}

async function forwardRequest(request, pathWithSearch) {
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const originHeaders = new Headers(request.headers);
  originHeaders.delete("cookie");
  originHeaders.set("X-Forwarded-For", ip);

  const originRequest = new Request(`https://${API_HOST}${pathWithSearch}`, {
    method: request.method,
    headers: originHeaders,
    body:
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.arrayBuffer()
        : null,
    redirect: request.redirect,
  });

  return await fetch(originRequest);
}

function addCorsHeaders(response) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  newHeaders.set("Access-Control-Allow-Headers", "*");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return addCorsHeaders(new Response(null, { status: 204 }));
    }
    const response =
      (await handleRequest(request, ctx)) || new Response("Not found", { status: 404 });
    return addCorsHeaders(response);
  },
};
