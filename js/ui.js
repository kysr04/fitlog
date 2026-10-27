/* =========================================================
   ui.js —— 界面外壳与通用组件
   页面只写 main 里的内容，导航 / 页脚 / 主题切换在这里统一生成
   ========================================================= */

window.UI = (function () {
  'use strict';

  const NAV = [
    { page: 'home', href: 'index.html', label: '总览' },
    { page: 'train', href: 'train.html', label: '训练' },
    { page: 'diet', href: 'diet.html', label: '饮食' },
    { page: 'body', href: 'body.html', label: '身体' },
    { page: 'stats', href: 'stats.html', label: '统计' },
    { page: 'about', href: 'about.html', label: '关于' }
  ];

  const ICONS = {
    dumbbell: '<path d="M6.5 6.5v11M3.5 8.5v7M17.5 6.5v11M20.5 8.5v7M6.5 12h11"/>',
    flame: '<path d="M12 21c3.9 0 6.5-2.6 6.5-6.2 0-4.2-4.3-6.1-5-10.8-2.4 1.3-4.1 3.5-4.1 5.9 0 1.2.4 2.2 1 3-1.6.2-2.7 1.5-2.7 3.1 0 1 .4 1.9 1.1 2.6"/><path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.6 8.6 0 1 0 10.5 10.5z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l.8 12.2h9.4L17.5 7"/><path d="M10.2 10.5v5M13.8 10.5v5"/>',
    download: '<path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5M4.5 20.5h15"/>',
    upload: '<path d="M12 20V9M7.5 13.5 12 9l4.5 4.5M4.5 4.5h15"/>',
    arrowLeft: '<path d="M15 5l-7 7 7 7"/>',
    arrowRight: '<path d="M9 5l7 7-7 7"/>',
    check: '<path d="M5 12.5 9.5 17 19 7.5"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16V11M12.5 16V7M17 16v-6"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
    scale: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M8 9.5a4 4 0 0 1 8 0M12 9.5l1.6-2"/>',
    bowl: '<path d="M4 12h16a8 8 0 0 1-16 0z"/><path d="M8.5 9c0-1.2-1.5-1.6-1.5-3M12 8.6c0-1.5-1.6-2-1.6-3.6M15.5 9c0-1.2-1.5-1.6-1.5-3"/>',
    bolt: '<path d="M13 2 5 13.5h5.5L10 22l8-11.5h-5.5z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3.5v3M16 3.5v3M3.5 10h17"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    spark: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
    chevronDown: '<path d="M6 9l6 6 6-6"/>'
  };

  function icon(name, size) {
    const body = ICONS[name] || '';
    const s = size || 20;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      body + '</svg>';
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function fmt(n) {
    const v = Number(n) || 0;
    return v.toLocaleString('zh-CN');
  }

  function signed(n, unit) {
    const v = Number(n) || 0;
    const sign = v > 0 ? '+' : '';
    return sign + (Math.round(v * 10) / 10) + (unit || '');
  }

  /* ---------- 主题 ---------- */
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
    const btn = document.getElementById('themeBtn');
    if (btn) {
      btn.innerHTML = icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon');
      btn.setAttribute('aria-label', document.documentElement.dataset.theme === 'dark' ? '切换到浅色主题' : '切换到深色主题');
      btn.setAttribute('title', btn.getAttribute('aria-label'));
    }
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    if (window.Store) Store.updateSettings({ theme: next });
    if (window.dispatchEvent) window.dispatchEvent(new CustomEvent('fitlog:theme', { detail: { theme: next } }));
  }

  /* ---------- 外壳 ---------- */
  function mount() {
    const page = document.body.dataset.page || '';
    const top = document.getElementById('shell-top');
    const bottom = document.getElementById('shell-bottom');

    if (top) {
      top.innerHTML =
        '<header class="topbar">' +
        '  <div class="container topbar-inner">' +
        '    <a class="brand" href="index.html" aria-label="FitLog 首页">' +
        '      <span class="brand-mark">' + icon('bolt', 22) + '</span>' +
        '      <span class="brand-name">FitLog<span class="brand-tag">训练 · 饮食 · 身体数据</span></span>' +
        '    </a>' +
        '    <nav class="nav" aria-label="主导航">' +
        NAV.map(function (n) {
          const active = n.page === page ? ' class="is-active" aria-current="page"' : '';
          return '<a href="' + n.href + '"' + active + '>' + n.label + '</a>';
        }).join('') +
        '    </nav>' +
        '    <div class="topbar-tools">' +
        '      <button class="icon-btn" id="themeBtn" type="button" aria-label="切换主题"></button>' +
        '    </div>' +
        '  </div>' +
        '</header>';

      document.getElementById('themeBtn').addEventListener('click', toggleTheme);
    }

    if (bottom) {
      bottom.innerHTML =
        '<footer class="site-footer">' +
        '  <div class="container footer-top">' +
        '    <p>© ' + new Date().getFullYear() + ' FitLog · 训练日志 — 纯前端演示，数据只保存在本机浏览器，不会上传。</p>' +
        '    <div class="footer-links">' +
        '      <a href="train.html">记录训练</a>' +
        '      <a href="diet.html">记录饮食</a>' +
        '      <a href="stats.html">查看统计</a>' +
        '      <a href="about.html">数据管理</a>' +
        '    </div>' +
        '  </div>' +
        '</footer>';
    }

    const theme = (window.Store && Store.settings().theme) ||
      (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
    applyTheme(theme);
  }

  /* ---------- Toast ---------- */
  let toastLayer = null;
  function toast(message, type) {
    if (!toastLayer) {
      toastLayer = document.createElement('div');
      toastLayer.className = 'toast-layer';
      document.body.appendChild(toastLayer);
    }
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' is-' + type : '');
    el.setAttribute('role', 'status');
    el.textContent = message;
    toastLayer.appendChild(el);
    setTimeout(function () {
      el.classList.add('is-out');
      setTimeout(function () { el.remove(); }, 220);
    }, type === 'error' ? 3200 : 2200);
  }

  /* ---------- 弹窗 ---------- */
  function modal(opts) {
    const o = opts || {};
    return new Promise(function (resolve) {
      const wrap = document.createElement('div');
      wrap.className = 'modal';
      wrap.innerHTML =
        '<div class="modal-card" role="dialog" aria-modal="true" aria-label="' + escapeHtml(o.title || '提示') + '">' +
        '  <h3>' + escapeHtml(o.title || '确认操作') + '</h3>' +
        '  <p>' + (o.html || escapeHtml(o.text || '')) + '</p>' +
        '  <div class="modal-actions">' +
        '    <button class="btn btn-ghost" type="button" data-act="cancel">' + escapeHtml(o.cancelText || '取消') + '</button>' +
        '    <button class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" type="button" data-act="ok">' + escapeHtml(o.okText || '确定') + '</button>' +
        '  </div>' +
        '</div>';

      function close(result) {
        wrap.classList.remove('is-open');
        window.removeEventListener('keydown', onKey);
        setTimeout(function () { wrap.remove(); }, 220);
        resolve(result);
      }
      function onKey(e) {
        if (e.key === 'Escape') close(false);
      }
      wrap.addEventListener('click', function (e) {
        if (e.target === wrap || (e.target.dataset && e.target.dataset.act === 'cancel')) close(false);
        if (e.target.dataset && e.target.dataset.act === 'ok') close(true);
      });
      window.addEventListener('keydown', onKey);

      document.body.appendChild(wrap);
      // 强制一次重排再加 is-open，既保留过渡动画，也避免后台标签页 rAF 不触发时弹窗不可见
      void wrap.offsetWidth;
      wrap.classList.add('is-open');
      const ok = wrap.querySelector('[data-act="ok"]');
      if (ok) ok.focus();
    });
  }

  function confirm(text, opts) {
    return modal(Object.assign({ title: '确认操作', text: text, okText: '确认' }, opts || {}));
  }

  /* ---------- 数字滚动 ---------- */
  function animateNumber(el, to, opts) {
    if (!el) return;
    const o = opts || {};
    const target = Number(to) || 0;
    const decimals = o.decimals || 0;
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : (o.duration || 620);
    const from = o.from != null ? Number(o.from) : 0;
    if (!duration) {
      el.textContent = formatNum(target, decimals);
      return;
    }
    let start = null;
    let done = false;
    function finish() {
      if (done) return;
      done = true;
      el.textContent = formatNum(target, decimals);
    }
    // 兜底：后台标签页 / 不支持动画时，保证最终显示目标值
    setTimeout(finish, duration + 150);
    function tick(ts) {
      if (done) return;
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNum(from + (target - from) * eased, decimals);
      if (p < 1) requestAnimationFrame(tick);
      else finish();
    }
    requestAnimationFrame(tick);
  }

  function formatNum(v, decimals) {
    const n = Number(v) || 0;
    if (decimals) return n.toFixed(decimals);
    return String(Math.round(n));
  }

  /* ---------- 小工具 ---------- */
  function debounce(fn, wait) {
    let t = null;
    return function () {
      const args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, wait || 250);
    };
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function greeting() {
    const h = new Date().getHours();
    if (h < 6) return '凌晨了，练完记得睡够';
    if (h < 11) return '早上好，今天先动起来';
    if (h < 14) return '中午好，别忘了补蛋白';
    if (h < 18) return '下午好，训练状态在线吗';
    if (h < 22) return '晚上好，今天的记录补一下';
    return '夜深了，简单拉伸再睡';
  }

  /* 百分比（限制在 0~100 之间的显示宽度，实际数值另外显示） */
  function pct(value, goal) {
    if (!goal) return 0;
    return Math.max(0, Math.min(100, Math.round(value / goal * 100)));
  }

  function empty(text, sub, actionHtml) {
    return '<div class="empty"><b>' + escapeHtml(text) + '</b><span class="small">' + escapeHtml(sub || '') + '</span>' +
      (actionHtml || '') + '</div>';
  }

  window.addEventListener('fitlog:storage', function () { /* 预留：多标签同步 */ });

  return {
    NAV: NAV,
    icon: icon,
    escapeHtml: escapeHtml,
    fmt: fmt,
    signed: signed,
    mount: mount,
    applyTheme: applyTheme,
    toggleTheme: toggleTheme,
    toast: toast,
    modal: modal,
    confirm: confirm,
    animateNumber: animateNumber,
    debounce: debounce,
    qs: qs,
    qsa: qsa,
    greeting: greeting,
    pct: pct,
    empty: empty
  };
})();

if (document.body && document.getElementById('shell-top')) {
  UI.mount();
} else {
  document.addEventListener('DOMContentLoaded', UI.mount);
}
