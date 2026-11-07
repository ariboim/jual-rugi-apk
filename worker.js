export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Try to fetch static assets first
    const response = await env.ASSETS.fetch(request);

    // If resource is not found (404) and this is a GET navigation request (no static file extension),
    // fallback gracefully to /index.html for Single Page Application client-side routing.
    if (response.status === 404 && request.method === 'GET') {
      const pathname = url.pathname;
      const isStaticFile = pathname.match(/\.[a-zA-Z0-9]+$/);

      if (!isStaticFile) {
        const indexRequest = new Request(new URL('/index.html', request.url), request);
        const indexResponse = await env.ASSETS.fetch(indexRequest);
        if (indexResponse.status === 200) {
          const headers = new Headers(indexResponse.headers);
          headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          return new Response(indexResponse.body, {
            status: 200,
            headers,
          });
        }
      }
    }

    // Never cache index.html or root to ensure fresh deployments are immediately seen
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      return new Response(response.body, {
        status: response.status,
        headers,
      });
    }

    return response;
  },
};
