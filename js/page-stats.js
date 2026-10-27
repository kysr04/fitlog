/* =========================================================
   page-stats.js —— 统计页：热力图 / 部位分布 / 周趋势 / 个人最佳
   ========================================================= */
(function () {
  'use strict';

  const $ = UI.qs;
  const today = Store.today();
  const st = Store.settings();

  /* ---------- 顶部关键指标 ---------- */
  const month = Store.monthSummary();
  UI.animateNumber($('#statSessions'), month.workouts);
  $('#statSessionsSub').textContent = '共 ' + UI.fmt(month.minutes) + ' 分钟';

  UI.animateNumber($('#statVolume'), month.volume);
  UI.animateNumber($('#statKcal'), month.kcalAvg);
  $('#statKcalSub').textContent = '目标 ' + UI.fmt(st.kcalGoal) + ' · 记录 ' + month.days + ' 天';
  if (month.kcalAvg > st.kcalGoal) $('#statKcalSub').classList.add('is-warn');

  const days14 = Store.lastNDates(14);
  let proteinRates = [];
  days14.forEach(function (d) {
    const t = Store.dayTotals(d);
    if (t.kcal > 0) proteinRates.push(Math.min(1, t.protein / st.proteinGoal));
  });
  const proteinAvg = proteinRates.length
    ? Math.round(proteinRates.reduce(function (a, b) { return a + b; }, 0) / proteinRates.length * 100)
    : 0;
  UI.animateNumber($('#statProtein'), proteinAvg);
  $('#statProteinSub').textContent = proteinRates.length
    ? '近 14 天记录 ' + proteinRates.length + ' 天 · 目标 ' + st.proteinGoal + ' g'
    : '近 14 天还没有饮食记录';
  if (proteinAvg >= 90) $('#statProteinSub').classList.add('is-good');
  else if (proteinAvg < 60) $('#statProteinSub').classList.add('is-warn');

  /* ---------- 热力图 ---------- */
  Charts.heatmap($('#heatmap'), {
    days: Store.heatmapWeeks(12),
    today: today
  });

  /* ---------- 部位分布 ---------- */
  Charts.donut($('#typeDonut'), {
    slices: Store.typeDistribution(),
    size: 190,
    stroke: 26,
    centerLabel: '次训练'
  });

  /* ---------- 周趋势 ---------- */
  const weeks = Store.weeklySeries(8);

  Charts.bar($('#sessionsChart'), {
    points: weeks.map(function (w) {
      return { label: w.label, value: w.sessions };
    }),
    goal: st.weeklyGoal,
    unit: ' 次',
    height: 240,
    maxBarWidth: 40
  });

  Charts.bar($('#volumeChart'), {
    points: weeks.map(function (w) {
      return { label: w.label, value: w.volume };
    }),
    unit: ' kg',
    height: 240,
    maxBarWidth: 40
  });

  /* ---------- 个人最佳 ---------- */
  const prs = Store.personalRecords(6);
  $('#prList').innerHTML = prs.length ? prs.map(function (p) {
    return '<li>' +
      '<div class="record-main">' +
      '  <div class="record-title">' + UI.escapeHtml(p.name) + '</div>' +
      '  <div class="record-meta">' + p.sets + ' 组 × ' + p.reps + ' 次 · ' + Store.fmtDate(p.date) + '</div>' +
      '</div>' +
      '<span class="tag tag-brand num">' + p.weight + ' kg</span>' +
      '</li>';
  }).join('') : '<li>' + UI.empty('还没有重量记录', '训练里填上重量，这里会自动挑出各动作的最好成绩。') + '</li>';

  /* ---------- 身体变化 ---------- */
  const records = Store.bodyRecords();
  const latest = records[0];
  const earliest = records[records.length - 1];
  const rows = [];

  if (latest && earliest && records.length > 1) {
    const wDiff = Math.round((latest.weight - earliest.weight) * 10) / 10;
    rows.push({
      label: '体重',
      value: earliest.weight + ' → ' + latest.weight + ' kg',
      tag: UI.signed(wDiff, ' kg'),
      good: wDiff < 0
    });
    if (latest.bodyfat != null && earliest.bodyfat != null) {
      const fDiff = Math.round((latest.bodyfat - earliest.bodyfat) * 10) / 10;
      rows.push({
        label: '体脂率',
        value: earliest.bodyfat + '% → ' + latest.bodyfat + '%',
        tag: UI.signed(fDiff, '%'),
        good: fDiff < 0
      });
    }
    rows.push({
      label: '目标体重',
      value: '目标 ' + st.goalWeight + ' kg',
      tag: (Math.abs(latest.weight - st.goalWeight) < 0.05
        ? '已达成'
        : (latest.weight > st.goalWeight ? '还差 ' : '低于 ') + Math.abs(latest.weight - st.goalWeight).toFixed(1) + ' kg'),
      good: Math.abs(latest.weight - st.goalWeight) < 0.05
    });
  }

  rows.push({
    label: '记录条数',
    value: records.length + ' 条体重记录',
    tag: '每 2~3 天一次',
    good: null
  });

  $('#bodySummary').innerHTML = rows.map(function (r) {
    return '<li>' +
      '<div class="record-main">' +
      '  <div class="record-title">' + r.label + '</div>' +
      '  <div class="record-meta">' + r.value + '</div>' +
      '</div>' +
      '<span class="tag ' + (r.good === true ? 'tag-good' : (r.good === false ? 'tag-warn' : '')) + '">' + r.tag + '</span>' +
      '</li>';
  }).join('');
})();
