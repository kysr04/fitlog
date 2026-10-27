/* =========================================================
   page-about.js —— 关于页：目标设置 / 数据导入导出 / 清空
   ========================================================= */
(function () {
  'use strict';

  const $ = UI.qs;

  const FIELDS = {
    sName: 'name',
    sHeight: 'height',
    sStartWeight: 'startWeight',
    sGoalWeight: 'goalWeight',
    sKcalGoal: 'kcalGoal',
    sProteinGoal: 'proteinGoal',
    sCarbGoal: 'carbGoal',
    sFatGoal: 'fatGoal',
    sWeeklyGoal: 'weeklyGoal'
  };

  function fillForm() {
    const st = Store.settings();
    Object.keys(FIELDS).forEach(function (id) {
      const input = $('#' + id);
      if (input) input.value = st[FIELDS[id]];
    });
  }

  /* ---------- 保存设置 ---------- */
  $('#settingsForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = $('#sName').value.trim() || '训练者';
    const height = Number($('#sHeight').value);
    const startWeight = Number($('#sStartWeight').value);
    const goalWeight = Number($('#sGoalWeight').value);
    const kcalGoal = Number($('#sKcalGoal').value);
    const proteinGoal = Number($('#sProteinGoal').value);
    const carbGoal = Number($('#sCarbGoal').value);
    const fatGoal = Number($('#sFatGoal').value);
    const weeklyGoal = Number($('#sWeeklyGoal').value);

    const checks = [
      [height >= 120 && height <= 230, '身高请填 120 ~ 230 cm'],
      [startWeight >= 20 && startWeight <= 300, '起始体重请填 20 ~ 300 kg'],
      [goalWeight >= 20 && goalWeight <= 300, '目标体重请填 20 ~ 300 kg'],
      [kcalGoal >= 800 && kcalGoal <= 6000, '热量目标请填 800 ~ 6000 kcal'],
      [proteinGoal >= 20 && proteinGoal <= 400, '蛋白质目标请填 20 ~ 400 g'],
      [carbGoal >= 20 && carbGoal <= 800, '碳水目标请填 20 ~ 800 g'],
      [fatGoal >= 10 && fatGoal <= 300, '脂肪目标请填 10 ~ 300 g'],
      [weeklyGoal >= 1 && weeklyGoal <= 14, '每周训练目标请填 1 ~ 14 次']
    ];
    for (let i = 0; i < checks.length; i++) {
      if (!checks[i][0]) { UI.toast(checks[i][1], 'error'); return; }
    }

    Store.updateSettings({
      name: name,
      height: height,
      startWeight: startWeight,
      goalWeight: goalWeight,
      kcalGoal: kcalGoal,
      proteinGoal: proteinGoal,
      carbGoal: carbGoal,
      fatGoal: fatGoal,
      weeklyGoal: weeklyGoal
    });

    UI.toast('设置已保存');
    renderInfo();
  });

  $('#resetSettings').addEventListener('click', async function () {
    const ok = await UI.confirm('会把昵称、身高、体重和各项营养目标恢复成默认值（主题不变）。', {
      title: '恢复默认设置', okText: '恢复'
    });
    if (!ok) return;
    Store.resetSettings();
    fillForm();
    renderInfo();
    UI.toast('已恢复默认设置');
  });

  /* ---------- 存储信息 ---------- */
  function renderInfo() {
    const g = Store.get();
    const bytes = new Blob([JSON.stringify(g)]).size;
    const size = bytes > 1024 * 1024
      ? (bytes / 1024 / 1024).toFixed(2) + ' MB'
      : (bytes / 1024).toFixed(1) + ' KB';
    const demo = Store.settings().demo ? '<span class="tag tag-brand">示例数据</span>' : '<span class="tag tag-good">已有个人记录</span>';

    $('#storageInfo').innerHTML =
      '<div class="row between"><span>训练记录</span><b>' + g.workouts.length + ' 条</b></div>' +
      '<div class="row between"><span>饮食记录</span><b>' + g.meals.length + ' 条</b></div>' +
      '<div class="row between"><span>体重记录</span><b>' + g.body.length + ' 条</b></div>' +
      '<div class="row between"><span>占用空间</span><b>' + size + '</b></div>' +
      '<div class="row between"><span>数据状态</span>' + demo + '</div>';
  }

  /* ---------- 导出 ---------- */
  $('#exportBtn').addEventListener('click', function () {
    const text = Store.exportJSON();
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fitlog-backup-' + Store.today() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    UI.toast('备份已导出，保存好这个 JSON 文件');
  });

  /* ---------- 导入 ---------- */
  $('#importBtn').addEventListener('click', function () {
    $('#importFile').click();
  });

  $('#importFile').addEventListener('change', function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        Store.importJSON(String(reader.result));
        UI.toast('导入成功，正在刷新…');
        setTimeout(function () { location.reload(); }, 600);
      } catch (err) {
        UI.toast('导入失败：' + err.message, 'error');
      } finally {
        e.target.value = '';
      }
    };
    reader.onerror = function () {
      UI.toast('文件读取失败，换一个文件试试', 'error');
    };
    reader.readAsText(file, 'utf-8');
  });

  /* ---------- 示例数据 / 清空 ---------- */
  $('#seedBtn').addEventListener('click', async function () {
    const ok = await UI.confirm('会用一份新的示例数据替换当前全部记录（现有记录会被清掉）。建议先导出备份。', {
      title: '重新载入示例数据', okText: '载入示例', danger: true
    });
    if (!ok) return;
    Store.clearAll(true);
    UI.toast('示例数据已载入');
    setTimeout(function () { location.reload(); }, 500);
  });

  $('#clearBtn').addEventListener('click', async function () {
    const ok = await UI.confirm('会删除全部训练、饮食和体重记录，且无法恢复。确定要清空吗？', {
      title: '清空全部数据', okText: '全部清空', danger: true
    });
    if (!ok) return;
    Store.clearAll(false);
    UI.toast('数据已清空');
    setTimeout(function () { location.reload(); }, 500);
  });

  fillForm();
  renderInfo();
})();
