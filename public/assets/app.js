(function () {
  'use strict';

  var bg = document.getElementById('bg');
  var dateEl = document.getElementById('date');
  var captionEl = document.getElementById('caption');
  var posEl = document.getElementById('pos');
  var prevBtn = document.getElementById('prev');
  var nextBtn = document.getElementById('next');

  var list = [];
  var index = 0;
  var reqToken = 0;

  var WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

  function formatDate(raw) {
    if (!/^\d{8}$/.test(raw || '')) return '—';
    var y = Number(raw.slice(0, 4));
    var m = Number(raw.slice(4, 6));
    var d = Number(raw.slice(6, 8));
    var week = WEEK[new Date(y, m - 1, d).getDay()];
    return y + ' 年 ' + m + ' 月 ' + d + ' 日 · ' + week;
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

    dateEl.textContent = formatDate(item.date);
    captionEl.textContent = [item.title, item.copyright].filter(Boolean).join(' — ');
    posEl.textContent = (index + 1) + ' / ' + list.length;

    prevBtn.disabled = index >= list.length - 1;
    nextBtn.disabled = index <= 0;

    show(item);
  }

  function fail(message) {
    dateEl.textContent = '暂时取不到壁纸';
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

  load();
})();
