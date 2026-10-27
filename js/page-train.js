/* =========================================================
   page-train.js —— 训练页：记录表单 / 模板 / 历史 / 周容量
   ========================================================= */
(function () {
  'use strict';

  const $ = UI.qs;
  const today = Store.today();
  const dateInput = $('#wDate');
  const minutesInput = $('#wMinutes');
  const intensitySelect = $('#wIntensity');
  const noteInput = $('#wNote');
  const rowsBox = $('#exerciseRows');
  const form = $('#workoutForm');

  let currentType = 'chest';

  /* ---------- 初始化日期 ---------- */
  dateInput.value = today;
  dateInput.max = today;

  /* ---------- 部位选择 ---------- */
  function renderTypeChips() {
    $('#typeChips').innerHTML = FIT.TYPES.map(function (t) {
      return '<button type="button" class="chip' + (t.key === currentType ? ' is-active' : '') +
        '" data-type="' + t.key + '">' +
        '<i class="chip-dot" style="background:' + t.color + '"></i>' + t.name + '</button>';
    }).join('');
    renderExerciseOptions();
  }

  function renderExerciseOptions() {
    const list = currentType === 'full' || currentType === 'cardio'
      ? FIT.EXERCISES
      : FIT.exercisesOf(currentType);
    $('#exerciseOptions').innerHTML = list.map(function (e) {
      return '<option value="' + UI.escapeHtml(e.name) + '"></option>';
    }).join('');
  }

  $('#typeChips').addEventListener('click', function (e) {
    const btn = e.target.closest('[data-type]');
    if (!btn) return;
    currentType = btn.dataset.type;
    renderTypeChips();
    updateSummary();
  });

  /* ---------- 动作行 ---------- */
  function addRow(data) {
    const row = document.createElement('div');
    row.className = 'exercise-row';
    row.innerHTML =
      '<div class="field">' +
      '  <label>动作</label>' +
      '  <input class="input ex-name" list="exerciseOptions" type="text" placeholder="输入或选择动作">' +
      '</div>' +
      '<div class="field">' +
      '  <label>重量 kg</label>' +
      '  <input class="input ex-weight" type="number" min="0" step="0.5" placeholder="自重填 0">' +
      '</div>' +
      '<div class="field">' +
      '  <label>组数</label>' +
      '  <input class="input ex-sets" type="number" min="1" max="30" step="1" value="4">' +
      '</div>' +
      '<div class="field">' +
      '  <label>次数</label>' +
      '  <input class="input ex-reps" type="number" min="1" max="200" step="1" value="10">' +
      '</div>' +
      '<button class="icon-btn remove-row" type="button" aria-label="删除这个动作">' + UI.icon('trash', 16) + '</button>';

    if (data) {
      row.querySelector('.ex-name').value = data.name || '';
      row.querySelector('.ex-weight').value = data.weight != null ? data.weight : '';
      row.querySelector('.ex-sets').value = data.sets || 4;
      row.querySelector('.ex-reps').value = data.reps || 10;
    }

    row.querySelector('.remove-row').addEventListener('click', function () {
      row.remove();
      updateSummary();
    });
    row.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('input', updateSummary);
    });

    rowsBox.appendChild(row);
    updateSummary();
    return row;
  }

  function collectRows() {
    const rows = [];
    const invalid = [];
    UI.qsa('.exercise-row', rowsBox).forEach(function (row) {
      const name = row.querySelector('.ex-name').value.trim();
      const weight = Number(row.querySelector('.ex-weight').value) || 0;
      const sets = Number(row.querySelector('.ex-sets').value) || 0;
      const reps = Number(row.querySelector('.ex-reps').value) || 0;
      if (!name) return;
      if (sets < 1 || reps < 1) { invalid.push(name); return; }
      rows.push({ name: name, weight: Math.max(0, weight), sets: Math.round(sets), reps: Math.round(reps) });
    });
    return { rows: rows, invalid: invalid };
  }

  function estimateKcal(minutes, intensity) {
    const factor = FIT.INTENSITY[intensity] || 1;
    return Math.round((Number(minutes) || 0) * 7 * factor);
  }

  function updateSummary() {
    const res = collectRows();
    const volume = res.rows.reduce(function (a, e) { return a + e.weight * e.sets * e.reps; }, 0);
    const minutes = Number(minutesInput.value) || 0;
    const parts = [];
    parts.push(res.rows.length + ' 个动作');
    if (volume > 0) parts.push('训练容量 ' + UI.fmt(Math.round(volume)) + ' kg');
    if (minutes > 0) parts.push('约 ' + estimateKcal(minutes, intensitySelect.value) + ' kcal');
    let text = parts.join(' · ');
    if (res.invalid.length) text += ' · 有 ' + res.invalid.length + ' 个动作缺组数/次数';
    $('#formSummary').textContent = res.rows.length ? text : '还没有动作，点「＋ 加一个动作」或直接用模板';
  }

  minutesInput.addEventListener('input', updateSummary);
  intensitySelect.addEventListener('change', updateSummary);

  /* ---------- 模板 ---------- */
  function renderTemplates() {
    $('#templateChips').innerHTML = FIT.TEMPLATES.map(function (t) {
      return '<button class="chip" type="button" data-tpl="' + t.id + '">' + UI.escapeHtml(t.name) + '</button>';
    }).join('');
  }

  function applyTemplate(id) {
    const tpl = FIT.TEMPLATES.find(function (t) { return t.id === id; });
    if (!tpl) return;
    currentType = tpl.type;
    renderTypeChips();
    minutesInput.value = tpl.minutes;
    rowsBox.innerHTML = '';
    tpl.exercises.forEach(function (e) { addRow(e); });
    updateSummary();
    UI.toast('已填入「' + tpl.name + '」，可以按实际改');
  }

  $('#templateChips').addEventListener('click', function (e) {
    const btn = e.target.closest('[data-tpl]');
    if (btn) applyTemplate(btn.dataset.tpl);
  });

  $('#loadTemplateBtn').addEventListener('click', function () {
    const html = '<div class="stack">' + FIT.TEMPLATES.map(function (t) {
      return '<button class="btn btn-block" type="button" data-tpl="' + t.id + '" style="justify-content:space-between">' +
        '<span>' + UI.escapeHtml(t.name) + '</span><span class="tiny muted">' + t.minutes + ' 分钟</span></button>';
    }).join('') + '</div>';
    UI.modal({ title: '选择训练模板', html: html, okText: '关闭' });
    const wraps = document.querySelectorAll('.modal');
    const wrap = wraps[wraps.length - 1];
    if (!wrap) return;
    wrap.addEventListener('click', function (ev) {
      const b = ev.target.closest('[data-tpl]');
      if (!b) return;
      applyTemplate(b.dataset.tpl);
      const okBtn = wrap.querySelector('[data-act="ok"]');
      if (okBtn) okBtn.click();
    });
  });

  /* ---------- 提交 ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!dateInput.value) { UI.toast('请先选择日期', 'error'); dateInput.focus(); return; }
    if (dateInput.value > today) { UI.toast('日期不能选未来，先把今天过完', 'error'); return; }

    const minutes = Number(minutesInput.value);
    if (!minutes || minutes < 1) {
      UI.toast('请填写训练时长（分钟）', 'error'); minutesInput.focus(); return;
    }
    if (minutes > 300) { UI.toast('单次训练超过 300 分钟，确认一下是不是填错了', 'error'); return; }

    const res = collectRows();
    if (!res.rows.length) {
      UI.toast('至少填一个动作（动作名 + 组数 + 次数）', 'error');
      return;
    }

    Store.addWorkout({
      date: dateInput.value,
      type: currentType,
      minutes: minutes,
      intensity: intensitySelect.value,
      note: noteInput.value,
      exercises: res.rows
    });

    if (res.invalid.length) {
      UI.toast('已保存，但有 ' + res.invalid.length + ' 个动作缺组数/次数被跳过', 'warn');
    } else {
      UI.toast('训练已保存，容量 ' + UI.fmt(Math.round(res.rows.reduce(function (a, x) {
        return a + x.weight * x.sets * x.reps;
      }, 0))) + ' kg');
    }

    resetForm();
    renderAll();
  });

  function resetForm() {
    dateInput.value = today;
    minutesInput.value = '';
    noteInput.value = '';
    intensitySelect.value = '中';
    rowsBox.innerHTML = '';
    addRow();
    updateSummary();
  }

  $('#resetFormBtn').addEventListener('click', function () {
    resetForm();
    UI.toast('表单已清空');
  });

  /* ---------- 历史 ---------- */
  function renderHistory() {
    const all = Store.workouts();
    $('#historyCount').textContent = all.length ? '共 ' + all.length + ' 条记录' : '';

    if (!all.length) {
      $('#historyList').innerHTML = UI.empty('还没有训练记录', '保存第一条后，这里会按日期倒序排好。',
        '<a class="btn btn-primary btn-sm" href="#workoutForm">去记一笔</a>');
      return;
    }

    const groups = {};
    all.slice(0, 20).forEach(function (w) {
      (groups[w.date] = groups[w.date] || []).push(w);
    });

    $('#historyList').innerHTML = Object.keys(groups).map(function (date) {
      const list = groups[date];
      const items = list.map(function (w) {
        const meta = FIT.typeMeta(w.type);
        const vol = Math.round(Store.volume(w));
        return '<li>' +
          '<div class="record-item">' +
          '  <span class="record-icon" style="color:' + meta.color + ';background:color-mix(in srgb, ' + meta.color + ' 14%, transparent)">' +
          meta.name + '</span>' +
          '  <div class="record-main">' +
          '    <div class="record-title">' + meta.name + '训练 ' +
          '      <span class="tag">' + w.minutes + ' 分钟</span>' +
          '      <span class="tag">' + w.intensity + '强度</span>' +
          '    </div>' +
          '    <div class="record-meta">' + w.exercises.length + ' 个动作 · 容量 ' + UI.fmt(vol) +
          ' kg · 约 ' + Store.workoutKcal(w) + ' kcal</div>' +
          (w.exercises.length ? '<div class="detail-box">' + w.exercises.map(function (e) {
            return '<span>' + UI.escapeHtml(e.name) + ' · ' + (e.weight ? e.weight + ' kg × ' : '自重 × ') +
              e.sets + ' 组 × ' + e.reps + ' 次</span>';
          }).join('') + '</div>' : '') +
          (w.note ? '<p class="tiny muted mt-2">备注：' + UI.escapeHtml(w.note) + '</p>' : '') +
          '  </div>' +
          '  <div class="record-actions">' +
          '    <button class="icon-btn" type="button" data-del="' + w.id + '" aria-label="删除这条训练">' + UI.icon('trash', 16) + '</button>' +
          '  </div>' +
          '</div>' +
          '</li>';
      }).join('');
      return '<div class="day-head"><b>' + Store.fmtDateFull(date) + '</b><span>' + list.length + ' 次训练</span></div>' +
        '<ul class="list">' + items + '</ul>';
    }).join('');
  }

  $('#historyList').addEventListener('click', async function (e) {
    const btn = e.target.closest('[data-del]');
    if (!btn) return;
    const ok = await UI.confirm('删除后这条训练记录就没了，确定删除吗？', { title: '删除训练记录', okText: '删除', danger: true });
    if (!ok) return;
    Store.removeWorkout(btn.dataset.del);
    UI.toast('已删除');
    renderAll();
  });

  /* ---------- 图 + 顶部标签 ---------- */
  function renderTags() {
    const st = Store.settings();
    const count = Store.weekWorkouts(today).length;
    $('#weekTag').textContent = '本周 ' + count + ' / ' + st.weeklyGoal + ' 次';
    $('#streakTag').textContent = '连续 ' + Store.streak() + ' 天';
  }

  function renderWeekChart() {
    const series = Store.weeklySeries(6);
    Charts.bar($('#weekVolumeChart'), {
      points: series.map(function (w) { return { label: w.label, value: w.volume }; }),
      unit: ' kg',
      height: 210,
      showValue: false,
      maxBarWidth: 34
    });
  }

  function renderAll() {
    renderTags();
    renderHistory();
    renderWeekChart();
    updateSummary();
  }

  /* ---------- 启动 ---------- */
  renderTemplates();
  renderTypeChips();
  addRow();
  updateSummary();
  renderAll();
})();
