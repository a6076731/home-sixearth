(function () {
  'use strict';

  var bg = document.getElementById('bg');
  var dateEl = document.getElementById('date');
  var clockEl = document.getElementById('clock');
  var captionEl = document.getElementById('caption');
  var posEl = document.getElementById('pos');
  var prevBtn = document.getElementById('prev');
  var nextBtn = document.getElementById('next');

  var list = [];
  var index = 0;
  var reqToken = 0;

  var WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  // 北京时间固定 UTC+8，无夏令时；用 UTC 字段反算，不受设备时区设置影响
  var BJ_OFFSET = 8 * 60 * 60 * 1000;

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function bjNow(ts) {
    var d = new Date(ts + BJ_OFFSET);
    var y = d.getUTCFullYear();
    var m = d.getUTCMonth() + 1;
    var day = d.getUTCDate();
    return {
      y: y, m: m, d: day,
      week: WEEK[d.getUTCDay()],
      hh: pad2(d.getUTCHours()),
      mm: pad2(d.getUTCMinutes()),
      ss: pad2(d.getUTCSeconds()),
      key: '' + y + pad2(m) + pad2(day)
    };
  }

  // 大号日期 + 时分秒，按整秒对齐刷新，不累积漂移
  function tick() {
    var t = bjNow(Date.now());
    dateEl.textContent = t.y + ' 年 ' + t.m + ' 月 ' + t.d + ' 日 · ' + t.week;
    clockEl.textContent = t.hh + ':' + t.mm + ':' + t.ss;
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }

  // 壁纸自带的日期（Bing 的 enddate，形如 20261025）
  function formatWallpaperDate(raw) {
    if (!/^\d{8}$/.test(raw || '')) return '';
    return Number(raw.slice(4, 6)) + ' 月 ' + Number(raw.slice(6, 8)) + ' 日';
  }

  function setBusy(busy) {
    document.body.classList.toggle('is-busy', busy);
  }

  function show(item) {
    var token = ++reqToken;
    var src = item.image + (item.image.indexOf('?') === -1 ? '?' : '&') + 'v=' + item.date;

    // 先预加载，加载完再替换，避免出现白屏或旧图闪烁
    var probe = new Image();
    probe.decoding = 'async';
    probe.onload = function () {
      if (token !== reqToken) return;
      bg.src = probe.src;
      bg.classList.remove('is-loading');
      setBusy(false);
    };
    probe.onerror = function () {
      if (token !== reqToken) return;
      bg.classList.remove('is-loading');
      setBusy(false);
    };
    probe.src = src;
  }

  function render(i) {
    if (!list.length) return;
    index = Math.min(Math.max(i, 0), list.length - 1);
    var item = list[index];

    // 大号日期固定显示北京时间；翻到早几天的壁纸时，把那张壁纸的日期标在说明前面
    var text = [item.title, item.copyright].filter(Boolean).join(' — ');
    if (index > 0) {
      var d = formatWallpaperDate(item.date);
      if (d) text = d + ' · ' + text;
    }
    captionEl.textContent = text;
    posEl.textContent = (index + 1) + ' / ' + list.length;

    prevBtn.disabled = index >= list.length - 1;
    nextBtn.disabled = index <= 0;

    show(item);
  }

  function fail(message) {
    captionEl.textContent = message || '过一会儿刷新页面再试一次。';
    posEl.textContent = '';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    bg.classList.remove('is-loading');
    setBusy(false);
  }

  function load() {
    fetch('/api/today', { headers: { accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        list = (data && data.images) || [];
        if (!list.length) throw new Error('empty');
        render(0);
      })
      .catch(function (err) {
        fail('接口返回异常：' + err.message);
      });
  }

  function step(delta) {
    var next = index + delta;
    if (next < 0 || next >= list.length) return;
    render(next);
  }

  prevBtn.addEventListener('click', function () { step(1); });   // 更早的一天
  nextBtn.addEventListener('click', function () { step(-1); });  // 更近的一天

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { step(1); }
    else if (e.key === 'ArrowRight') { step(-1); }
  });

  tick();
  load();
})();
