import { generateDynamicSitemap, SitemapEnv } from '../src/services/sitemapService';

export async function onRequestGet(context: { request: Request; env: SitemapEnv }) {
  const { request, env } = context;

  try {
    const { xml } = await generateDynamicSitemap({
      env,
      requestUrl: request.url,
    });

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    console.error('[CF Pages Sitemap Error]:', err);
    const fallbackXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '  <url>',
      '    <loc>https://jualrugi.my.id/</loc>',
      '    <changefreq>hourly</changefreq>',
      '    <priority>1.0</priority>',
      '  </url>',
      '</urlset>',
    ].join('\n');

    return new Response(fallbackXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  }
}
