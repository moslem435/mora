import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({ 
      error: 'Missing URL parameter',
      debug: {
        receivedUrl: url.toString(),
        searchParams: Object.fromEntries(url.searchParams.entries())
      }
    }), {
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
      },
      signal: AbortSignal.timeout(6000) // 稍长的超时时间
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    
    // 默认先按 UTF-8 解码读取一次
    const initialDecoder = new TextDecoder('utf-8');
    let html = initialDecoder.decode(buffer);

    // 自动检测 charset (处理 GBK 等中文编码)
    const charsetMatch = html.match(/<meta[^>]+charset=["']?([^"'>\s]+)["']?/i);
    const charset = charsetMatch?.[1]?.toLowerCase();
    
    if (charset && charset !== 'utf-8' && charset !== 'utf8') {
      try {
        const customDecoder = new TextDecoder(charset);
        html = customDecoder.decode(buffer);
      } catch (e) {
        // 解码器不支持则保持原样
      }
    }

    // 提取标题 (优先级: og:title > title tag)
    const ogTitleMatch = html.match(/<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["']/i) 
                      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:title["']/i);
    const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    
    const rawTitle = ogTitleMatch?.[1] || titleTagMatch?.[1] || '';

    // 提取描述 (优先级: og:description > description meta)
    const ogDescMatch = html.match(/<meta[^>]+(?:property|name)=["']og:description["'][^>]+content=["']([^"']+)["']/i)
                     || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:description["']/i);
    const descMetaMatch = html.match(/<meta[^>]+(?:name|property)=["']description["'][^>]+content=["']([^"']+)["']/i)
                       || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']description["']/i);
    
    const rawDesc = ogDescMatch?.[1] || descMetaMatch?.[1] || '';

    return new Response(JSON.stringify({ 
      title: cleanText(rawTitle), 
      description: cleanText(rawDesc) 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=86400' // 缓存一天
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
    .replace(/\s+/g, ' ') // 合并换行和多余空格
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .trim();
}
