const BING = 'https://cn.bing.com';
const ARCHIVE = '/HPImageArchive.aspx';

function json(body, status, maxAge) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=' + (maxAge || 900),
    },
  });
}

export async function onRequestGet() {
  try {
    const url = BING + ARCHIVE + '?format=js&idx=0&n=8&mkt=zh-CN';
    const res = await fetch(url, { cf: { cacheTtl: 1800, cacheEverything: true } });
    if (!res.ok) return json({ ok: false, images: [], error: 'bing ' + res.status }, 502, 60);

    const data = await res.json();
    const images = (data.images || []).map((item, i) => ({
      idx: i,
      date: item.startdate,
      title: (item.title || '').trim(),
      copyright: (item.copyright || '').trim(),
      link: item.copyrightlink || '',
      image: '/api/image?idx=' + i,
    }));

    if (!images.length) return json({ ok: false, images: [], error: 'empty archive' }, 502, 60);
    return json({ ok: true, images }, 200, 900);
  } catch (err) {
    return json({ ok: false, images: [], error: String((err && err.message) || err) }, 502, 60);
  }
}
