/* =========================================================
   page-home.js —— 总览页
   ========================================================= */
(function () {
  'use strict';

  const $ = UI.qs;
  const today = Store.today();
  const st = Store.settings();
  const t = Store.dayTotals(today);
  const streak = Store.streak();

  /* ---------- 示例数据提示 ---------- */
  if (st.demo) {
    const notice = $('#demoNotice');
    notice.hidden = false;
    $('#clearDemoBtn').addEventListener('click', async function () {
      const ok = await UI.confirm('清空示例数据后，图表会变成空白，将由你自己记录的数据填满。确定继续吗？', {
        title: '清空示例数据', okText: '清空'
      });
      if (!ok) return;
      Store.clearAll(false);
      UI.toast('已清空，开始记录你自己的数据吧');
      setTimeout(function () { location.reload(); }, 400);
    });
  }

  /* ---------- 英雄区 ---------- */
  $('#heroGreeting').textContent = UI.greeting() + '，' + (st.name || '训练者');
  UI.animateNumber($('#streakNum'), streak);

  const heroSub = $('#heroSub');
  if (t.sessions > 0) {
    heroSub.textContent = '今天已经练了 ' + t.minutes + ' 分钟，消耗约 ' + t.burned + ' kcal，继续保持。';
  } else if (t.mealCount > 0) {
    heroSub.textContent = '今天已记了 ' + t.mealCount + ' 条饮食，还没训练 —— 练完记得补一笔。';
  } else {
    heroSub.textContent = '今天还没有记录，从一次训练或一顿饭开始。';
  }

  Charts.ring($('#heroRing'), {
    value: t.kcal,
    max: st.kcalGoal,
    size: 128,
    stroke: 11,
    color: t.kcal > st.kcalGoal ? 'var(--bad)' : 'var(--brand)',
    display: t.kcal,
    label: 'kcal / 目标 ' + UI.fmt(st.kcalGoal)
  });

  /* ---------- 关键数字 ---------- */
  UI.animateNumber($('#statKcal'), t.kcal);
  UI.animateNumber($('#statProtein'), t.protein, { decimals: t.protein % 1 ? 1 : 0 });

  const kcalLeft = st.kcalGoal - t.kcal;
  const kcalSub = $('#statKcalSub');
  if (kcalLeft >= 0) {
    kcalSub.textContent = '目标 ' + UI.fmt(st.kcalGoal) + ' · 还可吃 ' + UI.fmt(kcalLeft);
  } else {
    kcalSub.textContent = '目标 ' + UI.fmt(st.kcalGoal) + ' · 超出 ' + UI.fmt(-kcalLeft);
    kcalSub.classList.add('is-warn');
  }

  const proteinPct = UI.pct(t.protein, st.proteinGoal);
  const proteinSub = $('#statProteinSub');
  proteinSub.textContent = '目标 ' + st.proteinGoal + ' g · 达成 ' + proteinPct + '%';
  proteinSub.classList.add(proteinPct >= 100 ? 'is-good' : 'is-warn');

  UI.animateNumber($('#statMinutes'), t.minutes);
  const workoutSub = $('#statWorkoutSub');
  if (t.sessions > 0) {
    const types = Store.workouts().filter(function (w) { return w.date === today; })
      .map(function (w) { return FIT.typeMeta(w.type).name; });
    workoutSub.textContent = types.join(' / ') + ' · 消耗约 ' + t.burned + ' kcal';
  } else {
    workoutSub.textContent = '还没开始';
  }

  const latest = Store.latestBody();
  if (latest) {
    UI.animateNumber($('#statWeight'), latest.weight, { decimals: 1 });
    const diff = latest.weight - st.startWeight;
    const wSub = $('#statWeightSub');
    wSub.textContent = '起始 ' + st.startWeight + ' kg · ' + (diff === 0 ? '持平' : UI.signed(diff, ' kg'));
    wSub.classList.add(diff < 0 ? 'is-good' : (diff > 0 ? 'is-warn' : ''));
  }

  /* ---------- 今日营养 ---------- */
  const macros = [
    { name: '蛋白质', key: 'protein', goal: st.proteinGoal, cls: 'is-protein', unit: 'g' },
    { name: '碳水', key: 'carb', goal: st.carbGoal, cls: 'is-carb', unit: 'g' },
    { name: '脂肪', key: 'fat', goal: st.fatGoal, cls: 'is-fat', unit: 'g' }
  ];
  $('#homeMacros').innerHTML = macros.map(function (m) {
    const v = t[m.key];
    const p = UI.pct(v, m.goal);
    const over = v > m.goal;
    return '<div class="macro">' +
      '<div class="macro-head"><b>' + m.name + '</b><span>' + v + ' / ' + m.goal + ' ' + m.unit + '</span></div>' +
      '<div class="bar ' + m.cls + (over ? ' is-over' : '') + '"><i style="width:' + p + '%"></i></div>' +
      '</div>';
  }).join('');

  const meals = Store.meals(today);
  const mealList = $('#homeMeals');
  if (!meals.length) {
    mealList.innerHTML = '<li>' + UI.empty('今天还没记饮食', '记下吃了什么，热量和蛋白质就自动算好了。',
      '<a class="btn btn-sm" href="diet.html">去记录</a>') + '</li>';
  } else {
    mealList.innerHTML = meals.slice(0, 5).map(function (m) {
      return '<li>' +
        '<div class="record-item">' +
        '  <span class="record-icon">' + UI.icon('bowl', 18) + '</span>' +
        '  <div class="record-main">' +
        '    <div class="record-title">' + UI.escapeHtml(m.name) + ' <span class="tag">' + m.meal + '</span></div>' +
        '    <div class="record-meta">' + (m.grams ? m.grams + ' g · ' : '') + '蛋白 ' + m.protein + ' g</div>' +
        '  </div>' +
        '</div>' +
        '<span class="small num" style="white-space:nowrap">' + UI.fmt(m.kcal) + ' kcal</span>' +
        '</li>';
    }).join('') + (meals.length > 5
      ? '<li><a class="link" href="diet.html">还有 ' + (meals.length - 5) + ' 条，去饮食页看 →</a></li>'
      : '');
  }

  /* ---------- 今日训练 ---------- */
  const todayWorkouts = Store.workouts().filter(function (w) { return w.date === today; });
  const workoutBox = $('#homeWorkout');
  if (!todayWorkouts.length) {
    const last = Store.workouts()[0];
    const lastBlock = last
      ? '<div class="detail-box mt-3">' +
        '<span>上次训练：' + Store.fmtDateFull(last.date) + ' · ' + FIT.typeMeta(last.type).name + ' · ' + last.minutes + ' 分钟</span>' +
        '<span>' + last.exercises.length + ' 个动作 · 容量 ' + UI.fmt(Math.round(Store.volume(last))) + ' kg</span>' +
        '</div>'
      : '';
    workoutBox.innerHTML = UI.empty('今天还没训练', '练完花 30 秒记一下，容量和消耗会自动算。',
      '<a class="btn btn-primary btn-sm" href="train.html">去记录</a>') + lastBlock;
  } else {
    workoutBox.innerHTML = todayWorkouts.map(function (w) {
      const meta = FIT.typeMeta(w.type);
      const vol = Math.round(Store.volume(w));
      return '<div class="stack" style="margin-bottom:14px">' +
        '<div class="row between">' +
        '  <span class="tag" style="color:' + meta.color + ';border-color:' + meta.color + '33">' + meta.name + '</span>' +
        '  <span class="small muted">' + w.minutes + ' 分钟 · ' + w.intensity + '强度</span>' +
        '</div>' +
        '<div class="detail-box">' +
        w.exercises.map(function (e) {
          return '<span>' + UI.escapeHtml(e.name) + ' · ' + (e.weight ? e.weight + 'kg × ' : '自重 × ') +
            e.sets + ' 组 × ' + e.reps + ' 次</span>';
        }).join('') +
        '</div>' +
        '<p class="tiny muted">训练容量 ' + UI.fmt(vol) + ' kg · 估算消耗 ' + Store.workoutKcal(w) + ' kcal</p>' +
        '</div>';
    }).join('');
  }

  /* ---------- 图表 ---------- */
  const calPoints = Store.caloriesSeries(7).map(function (p) {
    const d = Store.parseKey(p.date);
    return { label: (d.getMonth() + 1) + '/' + d.getDate(), value: p.value };
  });
  Charts.bar($('#homeCalChart'), {
    points: calPoints,
    goal: st.kcalGoal,
    unit: ' kcal',
    height: 220
  });

  const weightPoints = Store.weightSeries().slice(-14);
  Charts.line($('#homeWeightChart'), {
    points: weightPoints,
    goal: st.goalWeight,
    unit: ' kg',
    height: 220,
    color: 'var(--protein)'
  });

  /* ---------- 今日建议 ---------- */
  const tips = [];
  if (t.protein < st.proteinGoal) {
    tips.push({
      icon: 'bolt',
      title: '蛋白质还差 ' + Math.round(st.proteinGoal - t.protein) + ' g',
      text: '一份鸡胸肉（150g）约 36g，或一勺蛋白粉（30g）约 22g。'
    });
  } else {
    tips.push({ icon: 'check', title: '蛋白质已达标', text: '保持住，别再靠零食补热量。' });
  }
  if (kcalLeft > 250) {
    tips.push({ icon: 'bowl', title: '还能吃约 ' + UI.fmt(kcalLeft) + ' kcal', text: '优先补碳水和蔬菜，训练日别低碳。' });
  } else if (kcalLeft < -200) {
    tips.push({ icon: 'target', title: '今天已超出 ' + UI.fmt(-kcalLeft) + ' kcal', text: '晚餐换成高蛋白低油的组合，明天回归正轨。' });
  }
  if (t.sessions === 0) {
    tips.push({ icon: 'dumbbell', title: '今天还没训练', text: '哪怕 20 分钟快走或自重训练，也算打卡。' });
  } else {
    tips.push({ icon: 'flame', title: '训练消耗约 ' + t.burned + ' kcal', text: '练后 30 分钟内补蛋白，恢复更快。' });
  }
  const weekCount = Store.weekWorkouts(today).length;
  tips.push({
    icon: 'calendar',
    title: '本周已练 ' + weekCount + ' / ' + st.weeklyGoal + ' 次',
    text: weekCount >= st.weeklyGoal ? '目标达成，剩下几天可以安排轻量恢复。' : '还差 ' + (st.weeklyGoal - weekCount) + ' 次，别把训练都堆到周末。'
  });

  $('#homeTips').innerHTML = tips.map(function (tip) {
    return '<li><div class="record-item">' +
      '  <span class="record-icon">' + UI.icon(tip.icon, 18) + '</span>' +
      '  <div class="record-main">' +
      '    <div class="record-title">' + UI.escapeHtml(tip.title) + '</div>' +
      '    <div class="record-meta">' + UI.escapeHtml(tip.text) + '</div>' +
      '  </div>' +
      '</div></li>';
  }).join('');

  /* ---------- 最近记录 ---------- */
  const events = [];
  Store.workouts().forEach(function (w) {
    events.push({
      date: w.date,
      icon: 'dumbbell',
      title: FIT.typeMeta(w.type).name + '训练',
      meta: w.minutes + ' 分钟 · ' + w.exercises.length + ' 个动作 · 容量 ' + UI.fmt(Math.round(Store.volume(w))) + ' kg'
    });
  });
  Store.get().meals.forEach(function (m) {
    events.push({
      date: m.date,
      icon: 'bowl',
      title: m.meal + ' · ' + m.name,
      meta: (m.grams ? m.grams + ' g · ' : '') + m.kcal + ' kcal · 蛋白 ' + m.protein + ' g'
    });
  });
  Store.get().body.forEach(function (b) {
    events.push({
      date: b.date,
      icon: 'scale',
      title: '体重 ' + b.weight + ' kg',
      meta: '体脂 ' + (b.bodyfat == null ? '未记' : b.bodyfat + '%')
    });
  });

  events.sort(function (a, b) { return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0); });
  const recent = events.slice(0, 6);
  $('#homeRecent').innerHTML = recent.length ? recent.map(function (e) {
    const d = Store.parseKey(e.date);
    return '<li>' +
      '<span class="tl-date">' + (d.getMonth() + 1) + '/' + d.getDate() + '</span>' +
      '<div class="tl-body">' +
      '  <div class="tl-title">' + UI.icon(e.icon, 14) + ' ' + UI.escapeHtml(e.title) + '</div>' +
      '  <div class="record-meta">' + UI.escapeHtml(e.meta) + '</div>' +
      '</div>' +
      '</li>';
  }).join('') : '<li>' + UI.empty('还没有任何记录', '今天就开始吧。') + '</li>';
})();
