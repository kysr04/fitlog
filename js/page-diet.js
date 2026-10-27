/* =========================================================
   page-diet.js —— 饮食页：日期切换 / 添加食物 / 宏量统计 / 记录列表
   ========================================================= */
(function () {
  'use strict';

  const $ = UI.qs;
  const today = Store.today();
  const st = Store.settings();

  let viewDate = today;
  let currentMeal = '早餐';

  const dateInput = $('#dietDate');
  const foodName = $('#foodName');
  const foodGrams = $('#foodGrams');
  const manualBox = $('#manualFields');

  dateInput.value = today;
  dateInput.max = today;

  /* ---------- 餐次 ---------- */
  function renderMealSeg() {
    $('#mealSeg').innerHTML = FIT.MEALS.map(function (m) {
      return '<button type="button" class="' + (m === currentMeal ? 'is-active' : '') +
        '" data-meal="' + m + '">' + m + '</button>';
    }).join('');
  }

  $('#mealSeg').addEventListener('click', function (e) {
    const btn = e.target.closest('[data-meal]');
    if (!btn) return;
    currentMeal = btn.dataset.meal;
    renderMealSeg();
  });

  /* ---------- 食物下拉 & 快捷添加 ---------- */
  $('#foodOptions').innerHTML = FIT.FOODS.map(function (f) {
    return '<option value="' + UI.escapeHtml(f.name) + '">' + f.kcal + ' kcal /100g</option>';
  }).join('');

  const QUICK = ['鸡蛋', '牛奶', '鸡胸肉', '米饭', '燕麦', '香蕉', '乳清蛋白粉', '无糖酸奶'];
  $('#quickFoods').innerHTML = QUICK.map(function (name) {
    const f = FIT.foodByName(name);
    return '<button class="chip" type="button" data-quick="' + UI.escapeHtml(name) + '">' +
      name + '<span class="tiny muted" style="margin-left:6px">' + f.serving + 'g</span></button>';
  }).join('');

  $('#quickFoods').addEventListener('click', function (e) {
    const btn = e.target.closest('[data-quick]');
    if (!btn) return;
    const name = btn.dataset.quick;
    const food = FIT.foodByName(name);
    if (!food) return;
    const m = FIT.foodMacros(food, food.serving);
    Store.addMeal({
      date: viewDate,
      meal: currentMeal,
      name: name,
      grams: food.serving,
      kcal: m.kcal,
      protein: m.protein,
      carb: m.carb,
      fat: m.fat
    });
    UI.toast(name + ' ' + food.serving + 'g 已加入' + currentMeal);
    renderAll();
  });

  /* ---------- 营养预览 ---------- */
  function updatePreview() {
    const name = foodName.value.trim();
    const grams = Number(foodGrams.value) || 0;
    const food = FIT.foodByName(name);
    if (!name) {
      $('#foodPreview').textContent = '选择食物后自动带出热量与三大营养素';
      manualBox.classList.add('hidden');
      return;
    }
    if (food) {
      const m = FIT.foodMacros(food, grams);
      $('#foodPreview').innerHTML =
        '<span><b>' + m.kcal + ' kcal</b> · 蛋白质 ' + m.protein + ' g · 碳水 ' + m.carb + ' g · 脂肪 ' + m.fat + ' g</span>' +
        '<span class="tiny muted">（' + food.name + ' 每 100g：' + food.kcal + ' kcal / 蛋白 ' + food.protein + ' g）</span>';
      manualBox.classList.add('hidden');
    } else {
      $('#foodPreview').innerHTML = '<span>食物库里没有「' + UI.escapeHtml(name) + '」，请在下面手动填写营养</span>';
      manualBox.classList.remove('hidden');
    }
  }

  foodName.addEventListener('input', updatePreview);
  foodGrams.addEventListener('input', updatePreview);

  /* ---------- 提交 ---------- */
  $('#mealForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = foodName.value.trim();
    if (!name) { UI.toast('先填食物名字', 'error'); foodName.focus(); return; }
    if (viewDate > today) { UI.toast('不能给未来的日期记录饮食', 'error'); return; }

    const grams = Math.max(0, Number(foodGrams.value) || 0);
    const food = FIT.foodByName(name);
    let payload;

    if (food) {
      if (!grams) { UI.toast('份量要大于 0', 'error'); foodGrams.focus(); return; }
      const m = FIT.foodMacros(food, grams);
      payload = { name: name, grams: grams, kcal: m.kcal, protein: m.protein, carb: m.carb, fat: m.fat };
    } else {
      const kcal = Math.max(0, Number($('#mKcal').value) || 0);
      if (!kcal) { UI.toast('未收录的食物需要手动填热量', 'error'); $('#mKcal').focus(); return; }
      payload = {
        name: name,
        grams: grams,
        kcal: kcal,
        protein: Math.max(0, Number($('#mProtein').value) || 0),
        carb: Math.max(0, Number($('#mCarb').value) || 0),
        fat: Math.max(0, Number($('#mFat').value) || 0)
      };
    }

    Store.addMeal(Object.assign({
      date: viewDate,
      meal: currentMeal
    }, payload));

    UI.toast(name + ' 已加入' + currentMeal + '（' + payload.kcal + ' kcal）');
    clearForm();
    renderAll();
  });

  function clearForm() {
    foodName.value = '';
    foodGrams.value = 150;
    $('#mKcal').value = '';
    $('#mProtein').value = '';
    $('#mCarb').value = '';
    $('#mFat').value = '';
    manualBox.classList.add('hidden');
    updatePreview();
  }

  $('#clearMealForm').addEventListener('click', function () {
    clearForm();
    UI.toast('表单已清空');
  });

  /* ---------- 日期切换 ---------- */
  function setDate(d) {
    if (d > today) { UI.toast('还没到那天呢', 'warn'); return; }
    viewDate = d;
    dateInput.value = d;
    renderAll();
  }

  dateInput.addEventListener('change', function () {
    if (!dateInput.value) return;
    if (dateInput.value > today) { UI.toast('不能选择未来日期', 'error'); dateInput.value = viewDate; return; }
    viewDate = dateInput.value;
    renderAll();
  });
  $('#prevDay').addEventListener('click', function () { setDate(Store.addDays(viewDate, -1)); });
  $('#nextDay').addEventListener('click', function () { setDate(Store.addDays(viewDate, 1)); });
  $('#todayBtn').addEventListener('click', function () { setDate(today); });

  /* ---------- 汇总 ---------- */
  function setBar(barEl, percent, over) {
    if (!barEl) return;
    const fill = barEl.querySelector('i');
    if (fill) fill.style.width = Math.min(100, percent) + '%';
    barEl.classList.toggle('is-over', !!over);
  }

  function renderSummary() {
    const t = Store.dayTotals(viewDate);
    const goal = Store.settings();

    $('#dietDayLabel').textContent = Store.fmtDateFull(viewDate);
    $('#addDateLabel').textContent = viewDate === today ? '记录到今天' : '记录到 ' + Store.fmtDate(viewDate);

    Charts.ring($('#dietRing'), {
      value: t.kcal,
      max: goal.kcalGoal,
      size: 128,
      stroke: 11,
      color: t.kcal > goal.kcalGoal ? 'var(--bad)' : 'var(--brand)',
      display: t.kcal,
      label: 'kcal / 目标 ' + UI.fmt(goal.kcalGoal)
    });

    $('#dietKcalText').textContent = t.kcal + ' / ' + UI.fmt(goal.kcalGoal) + ' kcal';
    setBar($('#dietKcalBar').parentElement, UI.pct(t.kcal, goal.kcalGoal), t.kcal > goal.kcalGoal);

    $('#dietProteinText').textContent = t.protein + ' / ' + goal.proteinGoal + ' g';
    setBar($('#dietProteinBar').parentElement, UI.pct(t.protein, goal.proteinGoal), t.protein > goal.proteinGoal);

    $('#dietCarbText').textContent = t.carb + ' / ' + goal.carbGoal + ' g';
    setBar($('#dietCarbBar').parentElement, UI.pct(t.carb, goal.carbGoal), t.carb > goal.carbGoal);

    $('#dietFatText').textContent = t.fat + ' / ' + goal.fatGoal + ' g';
    setBar($('#dietFatBar').parentElement, UI.pct(t.fat, goal.fatGoal), t.fat > goal.fatGoal);

    const left = goal.kcalGoal - t.kcal;
    const pLeft = Math.max(0, Math.round(goal.proteinGoal - t.protein));
    let tip;
    if (viewDate !== today) {
      tip = '正在查看 ' + Store.fmtDate(viewDate) + ' 的记录 · 当天摄入 ' + t.kcal + ' kcal、蛋白 ' + t.protein + ' g。';
    } else if (left > 0) {
      tip = '还可以吃约 ' + UI.fmt(left) + ' kcal' + (pLeft ? '，蛋白质还差 ' + pLeft + ' g。' : '，蛋白质已达标。');
    } else {
      tip = '今天已超出目标 ' + UI.fmt(-left) + ' kcal，明天收一收就好。';
    }
    $('#dietTip').textContent = tip;
  }

  /* ---------- 当天记录 ---------- */
  function renderMeals() {
    const list = Store.meals(viewDate);
    $('#mealCount').textContent = list.length ? '共 ' + list.length + ' 条 · ' +
      Store.dayTotals(viewDate).kcal + ' kcal' : '';

    if (!list.length) {
      $('#mealGroups').innerHTML = UI.empty(
        viewDate === today ? '今天还没记饮食' : '这天没有饮食记录',
        '上面选个食物加进来，热量和蛋白质就自动算好了。'
      );
      return;
    }

    const groups = {};
    list.forEach(function (m) { (groups[m.meal] = groups[m.meal] || []).push(m); });

    $('#mealGroups').innerHTML = FIT.MEALS.filter(function (meal) {
      return groups[meal] && groups[meal].length;
    }).map(function (meal) {
      const items = groups[meal];
      const subtotal = items.reduce(function (a, x) { return a + x.kcal; }, 0);
      const rows = items.map(function (m) {
        return '<li>' +
          '<div class="record-item">' +
          '  <span class="record-icon">' + UI.icon('bowl', 17) + '</span>' +
          '  <div class="record-main">' +
          '    <div class="record-title">' + UI.escapeHtml(m.name) +
          (m.grams ? ' <span class="tag">' + m.grams + ' g</span>' : '') + '</div>' +
          '    <div class="record-meta">蛋白 ' + m.protein + ' g · 碳水 ' + m.carb + ' g · 脂肪 ' + m.fat + ' g</div>' +
          '  </div>' +
          '  <div class="record-actions">' +
          '    <span class="small num" style="margin-right:10px;white-space:nowrap">' + m.kcal + ' kcal</span>' +
          '    <button class="icon-btn" type="button" data-del="' + m.id + '" aria-label="删除这条饮食">' + UI.icon('trash', 15) + '</button>' +
          '  </div>' +
          '</div>' +
          '</li>';
      }).join('');

      return '<div class="day-head"><b>' + meal + '</b><span>' + subtotal + ' kcal · ' + items.length + ' 项</span></div>' +
        '<ul class="list">' + rows + '</ul>';
    }).join('');
  }

  $('#mealGroups').addEventListener('click', async function (e) {
    const btn = e.target.closest('[data-del]');
    if (!btn) return;
    const ok = await UI.confirm('删除后这条饮食记录就没了，确定吗？', { title: '删除饮食记录', okText: '删除', danger: true });
    if (!ok) return;
    Store.removeMeal(btn.dataset.del);
    UI.toast('已删除');
    renderAll();
  });

  /* ---------- 7 天图 ---------- */
  function renderChart() {
    const series = Store.caloriesSeries(7);
    Charts.bar($('#dietChart'), {
      points: series.map(function (p) {
        const d = Store.parseKey(p.date);
        return { label: (d.getMonth() + 1) + '/' + d.getDate(), value: p.value, dim: p.date !== today };
      }),
      goal: st.kcalGoal,
      unit: ' kcal',
      height: 250
    });
  }

  function renderAll() {
    renderSummary();
    renderMeals();
    renderChart();
  }

  /* ---------- 启动 ---------- */
  renderMealSeg();
  updatePreview();
  renderAll();
})();
