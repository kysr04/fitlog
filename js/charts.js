/* =========================================================
   charts.js —— 手写 SVG 图表（不依赖任何图表库）
   环形进度 / 折线 / 柱状 / 甜甜圈 / 热力图
   颜色一律用 CSS 变量，切换主题时自动跟着变
   ========================================================= */

window.Charts = (function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, style) {
    const node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) {
      node.setAttribute(k, attrs[k]);
    });
    if (style) node.setAttribute('style', style);
    return node;
  }

  function textEl(x, y, content, extraStyle) {
    const t = el('text', { x: x, y: y });
    if (extraStyle) t.setAttribute('style', extraStyle);
    t.textContent = content;
    return t;
  }

  function mount(container, svg, width, height) {
    container.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('role', 'img');
    container.appendChild(svg);
    return svg;
  }

  function emptyNote(container, text) {
    container.innerHTML = '<p class="small muted" style="padding:18px 0;text-align:center">' + text + '</p>';
  }

  /* 取一个“好看”的刻度步长，避免出现 2.8 / 8.3 这种轴标签 */
  function niceStep(raw) {
    const v = Math.max(Math.abs(raw), 1e-9);
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    const norm = v / mag;
    const mul = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    return mul * mag;
  }

  /* ---------- 环形进度 ---------- */
  function ring(container, opts) {
    if (!container) return;
    const o = opts || {};
    const value = Math.max(0, Number(o.value) || 0);
    const max = Math.max(1, Number(o.max) || 1);
    const size = o.size || 132;
    const stroke = o.stroke || 10;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const ratio = Math.min(1, value / max);
    const color = o.color || 'var(--brand)';

    const svg = el('svg', { width: size, height: size, viewBox: '0 0 ' + size + ' ' + size });
    svg.appendChild(el('circle', {
      cx: size / 2, cy: size / 2, r: r, fill: 'none',
      'stroke-width': stroke, style: 'stroke:var(--surface-3)'
    }));
    const arc = el('circle', {
      cx: size / 2, cy: size / 2, r: r, fill: 'none',
      'stroke-width': stroke, 'stroke-linecap': 'round',
      'stroke-dasharray': c, 'stroke-dashoffset': c * (1 - ratio),
      style: 'stroke:' + color + ';transition:stroke-dashoffset .7s cubic-bezier(.22,1,.36,1)'
    });
    svg.appendChild(arc);

    const wrap = document.createElement('div');
    wrap.className = 'ring-wrap';
    wrap.appendChild(svg);
    const center = document.createElement('div');
    center.className = 'ring-center';
    center.innerHTML = '<b>' + (o.display != null ? o.display : Math.round(value)) + '</b>' +
      (o.label ? '<span>' + o.label + '</span>' : '');
    wrap.appendChild(center);
    container.innerHTML = '';
    container.appendChild(wrap);

    // 进场动画：从 0 画到目标值
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      setTimeout(function () {
        arc.style.transition = 'none';
        arc.setAttribute('stroke-dashoffset', c);
        setTimeout(function () {
          arc.style.transition = 'stroke-dashoffset .7s cubic-bezier(.22,1,.36,1)';
          arc.setAttribute('stroke-dashoffset', c * (1 - ratio));
        }, 30);
      }, 10);
    }
  }

  /* ---------- 折线图 ---------- */
  function line(container, opts) {
    if (!container) return;
    const o = opts || {};
    const points = (o.points || []).filter(function (p) { return isFinite(p.value); });
    if (!points.length) { emptyNote(container, '还没有数据，先记一笔吧'); return; }

    const W = 640, H = o.height || 240;
    const pad = { top: 18, right: 14, bottom: 30, left: 40 };
    const iw = W - pad.left - pad.right;
    const ih = H - pad.top - pad.bottom;
    const color = o.color || 'var(--brand)';
    const unit = o.unit || '';

    const values = points.map(function (p) { return Number(p.value) || 0; });
    if (o.goal != null) values.push(Number(o.goal) || 0);
    let min = Math.min.apply(null, values);
    let max = Math.max.apply(null, values);
    if (min === max) { min -= 1; max += 1; }
    const span = max - min;
    // 用整齐的刻度步长把 y 轴范围对齐到整数刻度
    const step = niceStep((span * 1.24) / 4);
    min = Math.floor((min - span * 0.12) / step) * step;
    max = Math.ceil((max + span * 0.12) / step) * step;
    const ticks = Math.max(1, Math.round((max - min) / step));

    const x = function (i) {
      return pad.left + (points.length === 1 ? iw / 2 : (iw * i) / (points.length - 1));
    };
    const y = function (v) {
      return pad.top + ih - ((v - min) / (max - min)) * ih;
    };

    const svg = el('svg', { width: W, height: H });
    mount(container, svg, W, H);

    // 横向网格 + y 轴刻度
    for (let i = 0; i <= ticks; i++) {
      const v = min + step * i;
      const yy = y(v);
      svg.appendChild(el('line', {
        x1: pad.left, y1: yy, x2: W - pad.right, y2: yy, class: 'grid-line'
      }));
      svg.appendChild(textEl(pad.left - 8, yy + 3.5, formatTick(v), 'text-anchor:end'));
    }
    svg.appendChild(el('line', {
      x1: pad.left, y1: pad.top + ih, x2: W - pad.right, y2: pad.top + ih, class: 'axis-line'
    }));

    // 目标线
    if (o.goal != null) {
      const gy = y(Number(o.goal));
      svg.appendChild(el('line', {
        x1: pad.left, y1: gy, x2: W - pad.right, y2: gy, class: 'goal-line'
      }));
      const label = '目标 ' + formatTick(o.goal) + unit;
      const t = textEl(W - pad.right, gy - 6, label, 'text-anchor:end');
      t.setAttribute('class', 'goal-text');
      svg.appendChild(t);
    }

    // 面积
    const areaId = 'area-' + Math.random().toString(36).slice(2, 8);
    const defs = el('defs');
    const grad = el('linearGradient', { id: areaId, x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.appendChild(el('stop', { offset: '0%', style: 'stop-color:' + color + ';stop-opacity:.38' }));
    grad.appendChild(el('stop', { offset: '100%', style: 'stop-color:' + color + ';stop-opacity:0' }));
    defs.appendChild(grad);
    svg.appendChild(defs);

    let d = '';
    points.forEach(function (p, i) {
      d += (i === 0 ? 'M' : 'L') + x(i) + ',' + y(Number(p.value));
    });
    const areaD = d + 'L' + x(points.length - 1) + ',' + (pad.top + ih) + 'L' + x(0) + ',' + (pad.top + ih) + 'Z';
    svg.appendChild(el('path', { d: areaD, fill: 'url(#' + areaId + ')' }));

    const path = el('path', { d: d, class: 'line-path', style: 'stroke:' + color });
    svg.appendChild(path);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      path.style.transition = 'stroke-dashoffset .9s ease';
      setTimeout(function () { path.style.strokeDashoffset = 0; }, 30);
    }

    // 数据点 + 悬浮提示
    const maxDots = 40;
    points.forEach(function (p, i) {
      if (points.length > maxDots && i % Math.ceil(points.length / maxDots) !== 0) return;
      const cx = x(i), cy = y(Number(p.value));
      const dot = el('circle', { cx: cx, cy: cy, r: 3.4, class: 'dot', style: 'fill:' + color });
      const title = document.createElementNS(NS, 'title');
      title.textContent = (p.label ? p.label + '：' : '') + formatTick(p.value) + unit;
      dot.appendChild(title);
      svg.appendChild(dot);
    });

    // x 轴标签（最多 6 个）
    const labelStep = Math.max(1, Math.ceil(points.length / 6));
    points.forEach(function (p, i) {
      if (i % labelStep !== 0 && i !== points.length - 1) return;
      svg.appendChild(textEl(x(i), H - 8, p.label || '', 'text-anchor:middle'));
    });
  }

  /* ---------- 柱状图 ---------- */
  function bar(container, opts) {
    if (!container) return;
    const o = opts || {};
    const points = o.points || [];
    if (!points.length) { emptyNote(container, '还没有数据'); return; }

    const W = 640, H = o.height || 230;
    const pad = { top: 18, right: 14, bottom: 32, left: 40 };
    const iw = W - pad.left - pad.right;
    const ih = H - pad.top - pad.bottom;
    const color = o.color || 'var(--brand)';
    const unit = o.unit || '';

    const values = points.map(function (p) { return Number(p.value) || 0; });
    let rawMax = Math.max.apply(null, values);
    if (o.goal != null) rawMax = Math.max(rawMax, Number(o.goal) || 0);
    rawMax = rawMax > 0 ? rawMax * 1.08 : 10;
    const step = niceStep(rawMax / 3);
    const max = Math.ceil(rawMax / step) * step;
    const ticks = Math.max(1, Math.round(max / step));

    const slot = iw / points.length;
    const barW = Math.min(o.maxBarWidth || 46, slot * 0.58);

    const svg = el('svg', { width: W, height: H });
    mount(container, svg, W, H);

    for (let i = 0; i <= ticks; i++) {
      const v = step * i;
      const yy = pad.top + ih - (v / max) * ih;
      svg.appendChild(el('line', {
        x1: pad.left, y1: yy, x2: W - pad.right, y2: yy, class: 'grid-line'
      }));
      svg.appendChild(textEl(pad.left - 8, yy + 3.5, formatTick(v), 'text-anchor:end'));
    }
    svg.appendChild(el('line', {
      x1: pad.left, y1: pad.top + ih, x2: W - pad.right, y2: pad.top + ih, class: 'axis-line'
    }));

    if (o.goal != null) {
      const gy = pad.top + ih - (Number(o.goal) / max) * ih;
      svg.appendChild(el('line', { x1: pad.left, y1: gy, x2: W - pad.right, y2: gy, class: 'goal-line' }));
      const t = textEl(W - pad.right, gy - 6, '目标 ' + formatTick(o.goal) + unit, 'text-anchor:end');
      t.setAttribute('class', 'goal-text');
      svg.appendChild(t);
    }

    points.forEach(function (p, i) {
      const v = Number(p.value) || 0;
      const h = (v / max) * ih;
      const cx = pad.left + slot * i + slot / 2;
      const rect = el('rect', {
        x: cx - barW / 2,
        y: pad.top + ih - h,
        width: barW,
        height: Math.max(v > 0 ? 2 : 0, h),
        rx: Math.min(6, barW / 3),
        class: 'cb',
        style: 'fill:' + (p.color || color) + ';opacity:' + (p.dim ? 0.45 : 1)
      });
      const title = document.createElementNS(NS, 'title');
      title.textContent = (p.label || '') + '：' + formatTick(v) + unit;
      rect.appendChild(title);
      svg.appendChild(rect);

      svg.appendChild(textEl(cx, H - 9, p.label || '', 'text-anchor:middle'));
    });

    // 柱顶数值（点少时显示）
    if (points.length <= 8 && o.showValue !== false) {
      points.forEach(function (p, i) {
        const v = Number(p.value) || 0;
        if (!v) return;
        const h = (v / max) * ih;
        const cx = pad.left + slot * i + slot / 2;
        svg.appendChild(textEl(cx, pad.top + ih - h - 7, formatTick(v), 'text-anchor:middle;font-weight:700;fill:var(--text-2)'));
      });
    }
  }

  /* ---------- 甜甜圈 ---------- */
  function donut(container, opts) {
    if (!container) return;
    const o = opts || {};
    const slices = (o.slices || []).filter(function (s) { return s.value > 0; });
    if (!slices.length) { emptyNote(container, '还没有训练记录'); return; }

    const size = o.size || 190;
    const stroke = o.stroke || 26;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const total = slices.reduce(function (a, s) { return a + s.value; }, 0);

    const svg = el('svg', { width: size, height: size, viewBox: '0 0 ' + size + ' ' + size });
    const g = el('g', { transform: 'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')' });
    svg.appendChild(g);
    g.appendChild(el('circle', {
      cx: size / 2, cy: size / 2, r: r, fill: 'none',
      'stroke-width': stroke, style: 'stroke:var(--surface-3)'
    }));

    let offset = 0;
    slices.forEach(function (s) {
      const frac = s.value / total;
      const len = c * frac;
      const seg = el('circle', {
        cx: size / 2, cy: size / 2, r: r, fill: 'none',
        'stroke-width': stroke,
        'stroke-dasharray': Math.max(0, len - 2) + ' ' + (c - Math.max(0, len - 2)),
        'stroke-dashoffset': -offset,
        style: 'stroke:' + (s.color || 'var(--brand)')
      });
      const title = document.createElementNS(NS, 'title');
      title.textContent = s.name + '：' + s.value + ' 次（' + Math.round(frac * 100) + '%）';
      seg.appendChild(title);
      g.appendChild(seg);
      offset += len;
    });

    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'ring-wrap';
    wrap.appendChild(svg);
    const center = document.createElement('div');
    center.className = 'ring-center';
    center.innerHTML = '<b>' + total + '</b><span>' + (o.centerLabel || '次训练') + '</span>';
    wrap.appendChild(center);
    container.appendChild(wrap);

    if (o.legend !== false) {
      const legend = document.createElement('div');
      legend.className = 'chips';
      legend.style.marginTop = '14px';
      legend.style.justifyContent = 'center';
      legend.innerHTML = slices.map(function (s) {
        return '<span class="tag"><i class="chip-dot" style="background:' + (s.color || 'var(--brand)') + '"></i>' +
          s.name + ' ' + Math.round(s.value / total * 100) + '%</span>';
      }).join('');
      container.appendChild(legend);
    }
  }

  /* ---------- 热力图 ---------- */
  function heatmap(container, opts) {
    if (!container) return;
    const o = opts || {};
    const days = o.days || [];
    const today = o.today;
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'heatmap';
    days.forEach(function (d) {
      const cell = document.createElement('span');
      let cls = 'cell';
      if (d.future) cls += ' is-empty';
      else if (d.level) cls += ' lv' + d.level;
      if (d.date === today) cls += ' is-today';
      cell.className = cls;
      const tip = document.createElementNS(NS, 'title');
      tip.textContent = d.date + '：' + (d.minutes ? d.minutes + ' 分钟训练' : '休息');
      cell.appendChild(tip);
      grid.appendChild(cell);
    });
    container.appendChild(grid);
  }

  function formatTick(v) {
    const n = Number(v) || 0;
    if (Math.abs(n) >= 10000) return Math.round(n / 1000) + 'k';
    if (Math.abs(n) >= 100) return String(Math.round(n));
    if (Math.abs(n) >= 10) return String(Math.round(n * 10) / 10);
    return String(Math.round(n * 10) / 10);
  }

  return {
    ring: ring,
    line: line,
    bar: bar,
    donut: donut,
    heatmap: heatmap
  };
})();
