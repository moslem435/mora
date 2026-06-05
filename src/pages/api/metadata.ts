import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

    const html = await response.text();

    // 简单高效的正则匹配
    const ogTitle = html.match(/<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
                 || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:title["']/i)?.[1];
    
    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    const title = ogTitle || titleTag || '';

    const ogDesc = html.match(/<meta[^>]+(?:property|name)=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]
                || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:description["']/i)?.[1];
    
    const descMeta = html.match(/<meta[^>]+(?:name|property)=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]
                  || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']description["']/i)?.[1];
    const description = ogDesc || descMeta || '';

    return new Response(JSON.stringify({ 
      title: cleanText(title), 
      description: cleanText(description) 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=86400' 
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function cleanText(str: string) {
  if (!str) return '';
  return str
    .replace(/\s+/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .trim();
}
