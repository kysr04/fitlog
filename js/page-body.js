/* =========================================================
   page-body.js —— 身体数据：体重 / 体脂 / BMI / 趋势 / 历史
   ========================================================= */
(function () {
  'use strict';

  const $ = UI.qs;
  const today = Store.today();
  const st = Store.settings();

  let range = 30;

  const bDate = $('#bDate');
  const bWeight = $('#bWeight');
  const bBodyfat = $('#bBodyfat');

  bDate.value = today;
  bDate.max = today;

  /* ---------- 概览数字 ---------- */
  function bmiLabel(v) {
    if (v == null) return { text: '需要身高和体重', cls: '' };
    if (v < 18.5) return { text: '偏轻 · 可以适当增肌', cls: 'is-warn' };
    if (v < 24) return { text: '正常范围 · 保持住', cls: 'is-good' };
    if (v < 28) return { text: '偏重 · 控制一下热量', cls: 'is-warn' };
    return { text: '偏高 · 建议规律训练', cls: 'is-bad' };
  }

  function renderStats() {
    const latest = Store.latestBody();
    const settings = Store.settings();

    if (!latest) {
      $('#bodyWeight').textContent = '--';
      $('#bodyWeightSub').textContent = '还没有记录';
      $('#bodyFat').textContent = '--';
      $('#bodyFatSub').textContent = '没有记录体脂';
    } else {
      UI.animateNumber($('#bodyWeight'), latest.weight, { decimals: 1 });
      const diffStart = latest.weight - settings.startWeight;
      const sub = $('#bodyWeightSub');
      sub.textContent = '起始 ' + settings.startWeight + ' kg · ' + (Math.abs(diffStart) < 0.05 ? '持平' : UI.signed(diffStart, ' kg'));
      sub.className = 'stat-sub ' + (diffStart < 0 ? 'is-good' : (diffStart > 0 ? 'is-warn' : ''));

      if (latest.bodyfat == null) {
        $('#bodyFat').textContent = '--';
        $('#bodyFatSub').textContent = '这天没记体脂';
      } else {
        UI.animateNumber($('#bodyFat'), latest.bodyfat, { decimals: 1 });
        $('#bodyFatSub').textContent = '记录于 ' + Store.fmtDate(latest.date);
      }
    }

    const bmi = Store.bmi();
    const bmiInfo = bmiLabel(bmi);
    $('#bodyBmi').textContent = bmi == null ? '--' : bmi.toFixed(1);
    const bmiSub = $('#bodyBmiSub');
    bmiSub.textContent = (settings.height ? '身高 ' + settings.height + ' cm · ' : '') + bmiInfo.text;
    bmiSub.className = 'stat-sub ' + bmiInfo.cls;

    const goalDiff = latest ? Math.round((latest.weight - settings.goalWeight) * 10) / 10 : null;
    $('#bodyGoalDiff').textContent = goalDiff == null ? '--' : Math.abs(goalDiff).toFixed(1);
    const goalSub = $('#bodyGoalSub');
    if (goalDiff == null) {
      goalSub.textContent = '目标 ' + settings.goalWeight + ' kg';
    } else if (Math.abs(goalDiff) < 0.05) {
      goalSub.textContent = '已经到目标体重了 🎉';
      goalSub.className = 'stat-sub is-good';
    } else if (goalDiff > 0) {
      goalSub.textContent = '目标 ' + settings.goalWeight + ' kg · 还需减 ' + Math.abs(goalDiff).toFixed(1) + ' kg';
    } else {
      goalSub.textContent = '目标 ' + settings.goalWeight + ' kg · 低于目标 ' + Math.abs(goalDiff).toFixed(1) + ' kg';
    }
  }

  /* ---------- 趋势图 ---------- */
  function renderChart() {
    const all = Store.weightSeries();
    let points = all;
    if (range !== 'all') {
      const from = Store.addDays(today, -Number(range) + 1);
      points = all.filter(function (p) { return p.date >= from; });
    }

    Charts.line($('#weightChart'), {
      points: points,
      goal: st.goalWeight,
      unit: ' kg',
      height: 280,
      color: 'var(--protein)'
    });

    const insight = $('#weightInsight');
    if (points.length < 2) {
      insight.textContent = '至少要两条记录才能看出趋势，明天再称一次吧。';
    } else {
      const first = points[0];
      const last = points[points.length - 1];
      const days = Math.max(1, Store.diffDays(first.date, last.date));
      const diff = Math.round((last.value - first.value) * 10) / 10;
      const perWeek = Math.round((diff / days * 7) * 100) / 100;
      insight.textContent = (range === 'all' ? '全部记录' : '近 ' + range + ' 天') +
        '变化 ' + UI.signed(diff, ' kg') + '（' + first.value + ' → ' + last.value + ' kg），' +
        '平均每周 ' + UI.signed(perWeek, ' kg') + '。';
    }
  }

  /* ---------- 历史列表 ---------- */
  function renderList() {
    const all = Store.bodyRecords();
    const list = all.slice(0, 20);
    $('#bodyCount').textContent = all.length ? '共 ' + all.length + ' 条' : '';
    if (!list.length) {
      $('#bodyList').innerHTML = '<li>' + UI.empty('还没有体重记录', '第一条记录只要填体重，体脂可以空着。') + '</li>';
      return;
    }
    $('#bodyList').innerHTML = list.map(function (b) {
      return '<li>' +
        '<div class="record-main">' +
        '  <div class="record-title">' + Store.fmtDateFull(b.date) + '</div>' +
        '  <div class="record-meta">' + (b.bodyfat == null ? '未记体脂' : '体脂 ' + b.bodyfat + '%') + '</div>' +
        '</div>' +
        '<div class="record-actions">' +
        '  <span class="small num" style="margin-right:10px;white-space:nowrap">' + b.weight + ' kg</span>' +
        '  <button class="icon-btn" type="button" data-del="' + b.id + '" aria-label="删除这条体重记录">' + UI.icon('trash', 15) + '</button>' +
        '</div>' +
        '</li>';
    }).join('');
  }

  $('#bodyList').addEventListener('click', async function (e) {
    const btn = e.target.closest('[data-del]');
    if (!btn) return;
    const ok = await UI.confirm('删除后这条体重记录就没了，确定吗？', { title: '删除体重记录', okText: '删除', danger: true });
    if (!ok) return;
    Store.removeBody(btn.dataset.del);
    UI.toast('已删除');
    renderAll();
  });

  /* ---------- 表单 ---------- */
  $('#bodyForm').addEventListener('submit', function (e) {
    e.preventDefault();

    if (!bDate.value) { UI.toast('请选择日期', 'error'); return; }
    if (bDate.value > today) { UI.toast('不能记录未来日期', 'error'); return; }

    const weight = Number(bWeight.value);
    if (!weight || weight < 20 || weight > 300) {
      UI.toast('体重填 20 ~ 300 kg 之间的数字', 'error');
      bWeight.focus();
      return;
    }
    const fatRaw = bBodyfat.value === '' ? null : Number(bBodyfat.value);
    if (fatRaw != null && (fatRaw < 3 || fatRaw > 60)) {
      UI.toast('体脂率一般填 3% ~ 60%，检查一下', 'error');
      bBodyfat.focus();
      return;
    }

    Store.addBody({ date: bDate.value, weight: weight, bodyfat: fatRaw });
    UI.toast('已记录 ' + weight.toFixed(1) + ' kg');
    bWeight.value = '';
    bBodyfat.value = '';
    bDate.value = today;
    renderAll();
  });

  /* ---------- 范围切换 ---------- */
  $('#rangeSeg').addEventListener('click', function (e) {
    const btn = e.target.closest('[data-range]');
    if (!btn) return;
    range = btn.dataset.range === 'all' ? 'all' : Number(btn.dataset.range);
    UI.qsa('#rangeSeg button').forEach(function (b) {
      b.classList.toggle('is-active', b === btn);
    });
    renderChart();
  });

  function renderAll() {
    renderStats();
    renderChart();
    renderList();
  }

  renderAll();
})();
