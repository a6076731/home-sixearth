const BING = 'https://cn.bing.com';
const ARCHIVE = '/HPImageArchive.aspx';
const MAX_IDX = 7;

export async function onRequestGet({ request }) {
  const params = new URL(request.url).searchParams;
  const raw = parseInt(params.get('idx') || '0', 10);
  const idx = Math.min(Math.max(Number.isFinite(raw) ? raw : 0, 0), MAX_IDX);
  const wantUhd = params.get('q') === 'uhd';

  try {
    const metaUrl = BING + ARCHIVE + '?format=js&idx=' + idx + '&n=1&mkt=zh-CN';
    const metaRes = await fetch(metaUrl, { cf: { cacheTtl: 1800, cacheEverything: true } });
    if (!metaRes.ok) throw new Error('meta ' + metaRes.status);

    const meta = await metaRes.json();
    const item = (meta.images || [])[0];
    if (!item) throw new Error('no image');

    // 默认 1920x1080（约 340KB），加 ?q=uhd 才取 4K 原图（约 3.6MB）
    const hd = BING + item.urlbase + '_1920x1080.jpg';
    const uhd = BING + item.urlbase + '_UHD.jpg';
    const candidates = wantUhd
      ? [uhd, hd, BING + item.url]
      : [hd, BING + item.url, uhd];

    for (const src of candidates) {
      const res = await fetch(src, { cf: { cacheTtl: 86400, cacheEverything: true } });
      const type = res.headers.get('content-type') || '';
      if (res.ok && type.startsWith('image/')) {
        return new Response(res.body, {
          headers: {
            'content-type': type,
            'cache-control': 'public, max-age=3600',
            'access-control-allow-origin': '*',
          },
        });
      }
    }

    throw new Error('image fetch failed');
  } catch (err) {
    return new Response('wallpaper unavailable: ' + String((err && err.message) || err), {
      status: 502,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
}
