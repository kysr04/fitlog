/* =========================================================
   store.js —— 数据层
   所有数据存在浏览器 localStorage（不发网络请求）
   提供：初始化 / 读写 / 统计 / 示例数据 / 导入导出
   ========================================================= */

window.Store = (function () {
  'use strict';

  const KEY = 'fitlog.v1';
  const VERSION = 1;

  const DEFAULT_SETTINGS = {
    name: '训练者',
    height: 175,
    startWeight: 72.5,
    goalWeight: 68,
    kcalGoal: 2300,
    proteinGoal: 150,
    carbGoal: 260,
    fatGoal: 70,
    weeklyGoal: 4,
    theme: 'dark',
    demo: false
  };

  let state = null;

  /* ---------- 日期工具 ---------- */
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function dateKey(d) {
    const x = d || new Date();
    return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate());
  }
  function parseKey(k) {
    const p = String(k).split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }
  function addDays(k, n) {
    const d = parseKey(k);
    d.setDate(d.getDate() + n);
    return dateKey(d);
  }
  function today() { return dateKey(new Date()); }
  function weekday(k) { return parseKey(k).getDay(); }
  function fmtDate(k) {
    const d = parseKey(k);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }
  function fmtDateFull(k) {
    return fmtDate(k) + ' · ' + FIT.WEEKDAY[weekday(k)];
  }
  function weekStart(k) {
    const d = parseKey(k || today());
    const offset = (d.getDay() + 6) % 7; // 周一为一周开始
    d.setDate(d.getDate() - offset);
    return dateKey(d);
  }
  function diffDays(a, b) {
    return Math.round((parseKey(b) - parseKey(a)) / 86400000);
  }
  function lastNDates(n, endKey) {
    const end = endKey || today();
    const out = [];
    for (let i = n - 1; i >= 0; i--) out.push(addDays(end, -i));
    return out;
  }
  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ---------- 读写 ---------- */
  function blankState() {
    return {
      version: VERSION,
      settings: Object.assign({}, DEFAULT_SETTINGS),
      workouts: [],
      meals: [],
      body: []
    };
  }

  function normalize(s) {
    const base = blankState();
    if (!s || typeof s !== 'object') return base;
    return {
      version: VERSION,
      settings: Object.assign({}, DEFAULT_SETTINGS, s.settings || {}),
      workouts: Array.isArray(s.workouts) ? s.workouts : [],
      meals: Array.isArray(s.meals) ? s.meals : [],
      body: Array.isArray(s.body) ? s.body : []
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return normalize(JSON.parse(raw));
    } catch (e) {
      console.warn('[FitLog] 读取本地数据失败，将使用空数据', e);
      return null;
    }
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('[FitLog] 保存失败', e);
      if (window.UI) UI.toast('保存失败：浏览器存储可能已满或被禁用', 'error');
      return false;
    }
  }

  /* ---------- 示例数据（首次打开自动生成，可在「关于」里清空） ---------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

  const WEEK_PLAN = {
    1: 'chest', 2: 'back', 3: 'cardio', 4: 'legs',
    5: 'shoulders', 6: 'full', 0: 'core'
  };

  function seed(target) {
    const rng = mulberry32(20261027);
    const base = dateKey(new Date());
    const workoutDays = 35;

    for (let i = workoutDays; i >= 0; i--) {
      const key = addDays(base, -i);
      const wd = weekday(key);
      let type = WEEK_PLAN[wd];

      // 大约 15% 的日子休息；但最近 4 天保证有训练，让首页有连续打卡
      const forced = i <= 4 && i >= 1;
      if (!forced && rng() < 0.15) type = null;
      if (i === 0) type = null; // 今天还没练，留给用户自己记录

      if (type) {
        const pool = FIT.exercisesOf(type);
        const count = type === 'cardio' ? 2 : 3 + Math.round(rng());
        const used = [];
        const exercises = [];
        for (let k = 0; k < count; k++) {
          let ex = pick(rng, pool);
          let guard = 0;
          while (used.indexOf(ex.name) >= 0 && guard++ < 12) ex = pick(rng, pool);
          used.push(ex.name);
          const isCardio = type === 'cardio';
          const weight = isCardio ? 0 : Math.round((8 + rng() * 55) / 2.5) * 2.5;
          exercises.push({
            name: ex.name,
            weight: weight,
            sets: isCardio ? 1 : 3 + Math.round(rng() * 2),
            reps: isCardio ? 20 + Math.round(rng() * 15) : 8 + Math.round(rng() * 8)
          });
        }
        const minutes = type === 'cardio' ? 30 + Math.round(rng() * 15) : 45 + Math.round(rng() * 30);
        target.workouts.push({
          id: uid('w'),
          date: key,
          type: type,
          minutes: minutes,
          intensity: pick(rng, ['低', '中', '中', '中', '高']),
          note: rng() < 0.25 ? pick(rng, ['状态不错，最后一组有点顶。', '加班赶时间，压缩了组间休息。', '练完加了 10 分钟拉伸。', '']) : '',
          exercises: exercises
        });
      }
    }

    const breakfastPool = ['燕麦', '牛奶', '鸡蛋', '全麦面包', '豆浆', '无糖酸奶', '香蕉', '美式咖啡'];
    const lunchPool = ['米饭', '鸡胸肉', '瘦牛肉', '西兰花', '豆腐', '红薯', '意面（熟）', '虾仁', '玉米'];
    const dinnerPool = ['三文鱼', '鸡胸肉', '虾仁', '西兰花', '红薯', '豆腐', '米饭', '鸡腿肉'];
    const snackPool = ['乳清蛋白粉', '香蕉', '无糖酸奶', '混合坚果', '苹果', '黑巧克力'];

    for (let i = 35; i >= 0; i--) {
      const key = addDays(base, -i);
      const dayMeals = [
        { meal: '早餐', pool: breakfastPool, n: 2 + Math.round(rng()) },
        { meal: '午餐', pool: lunchPool, n: 2 + Math.round(rng()) },
        { meal: '晚餐', pool: dinnerPool, n: 2 + Math.round(rng()) },
        { meal: '加餐', pool: snackPool, n: rng() < 0.55 ? 1 : 0 }
      ];
      // 今天只记了早餐和午餐，留点空白给用户
      if (i === 0) { dayMeals[2].n = 0; dayMeals[3].n = 0; }

      dayMeals.forEach(function (g) {
        const used = [];
        for (let k = 0; k < g.n; k++) {
          let food = FIT.foodByName(pick(rng, g.pool));
          let guard = 0;
          while ((!food || used.indexOf(food.name) >= 0) && guard++ < 12) food = FIT.foodByName(pick(rng, g.pool));
          if (!food) continue;
          used.push(food.name);
          const grams = Math.round(food.serving * (0.75 + rng() * 0.55) / 5) * 5;
          const m = FIT.foodMacros(food, grams);
          target.meals.push({
            id: uid('m'),
            date: key,
            meal: g.meal,
            name: food.name,
            grams: grams,
            kcal: m.kcal,
            protein: m.protein,
            carb: m.carb,
            fat: m.fat
          });
        }
      });
    }

    // 体重记录：从 72.5 缓慢降到 70.4，带一点水分波动
    const start = 72.5;
    for (let i = 35; i >= 0; i -= 2) {
      const key = addDays(base, -i);
      const progress = (35 - i) / 35;
      const weight = Math.round((start - progress * 2.1 + (rng() - 0.5) * 0.5) * 10) / 10;
      const bodyfat = Math.round((19.6 - progress * 1.3 + (rng() - 0.5) * 0.3) * 10) / 10;
      target.body.push({
        id: uid('b'),
        date: key,
        weight: weight,
        bodyfat: bodyfat
      });
    }

    target.settings.demo = true;
    return target;
  }

  /* ---------- 初始化 ---------- */
  function init() {
    if (state) return state;
    state = load();
    if (!state) {
      state = seed(blankState());
      persist();
    }
    return state;
  }

  function get() { init(); return state; }
  function save() { init(); return persist(); }

  function settings() { return get().settings; }

  function updateSettings(patch) {
    const s = get();
    s.settings = Object.assign({}, s.settings, patch || {});
    save();
    return s.settings;
  }

  /* ---------- 训练 ---------- */
  function workouts() {
    return get().workouts.slice().sort(function (a, b) {
      return a.date === b.date ? 0 : (a.date < b.date ? 1 : -1);
    });
  }

  function addWorkout(w) {
    const s = get();
    const item = {
      id: uid('w'),
      date: w.date || today(),
      type: w.type || 'full',
      minutes: Math.max(0, Math.round(Number(w.minutes) || 0)),
      intensity: w.intensity || '中',
      note: (w.note || '').trim(),
      exercises: (w.exercises || []).filter(function (e) {
        return e && e.name && Number(e.sets) > 0 && Number(e.reps) > 0;
      }).map(function (e) {
        return {
          name: String(e.name).trim(),
          weight: Math.max(0, Number(e.weight) || 0),
          sets: Math.max(1, Math.round(Number(e.sets))),
          reps: Math.max(1, Math.round(Number(e.reps)))
        };
      })
    };
    s.workouts.push(item);
    s.settings.demo = false;
    save();
    return item;
  }

  function removeWorkout(id) {
    const s = get();
    s.workouts = s.workouts.filter(function (w) { return w.id !== id; });
    save();
  }

  function workoutKcal(w) {
    const factor = FIT.INTENSITY[w.intensity] || 1;
    const perMin = w.type === 'cardio' ? 8.5 : 7;
    return Math.round((w.minutes || 0) * perMin * factor);
  }

  function volume(w) {
    return (w.exercises || []).reduce(function (sum, e) {
      return sum + (Number(e.weight) || 0) * (Number(e.sets) || 0) * (Number(e.reps) || 0);
    }, 0);
  }

  /* ---------- 饮食 ---------- */
  function meals(date) {
    return get().meals.filter(function (m) { return m.date === date; })
      .sort(function (a, b) { return FIT.MEALS.indexOf(a.meal) - FIT.MEALS.indexOf(b.meal); });
  }

  function addMeal(m) {
    const s = get();
    const item = {
      id: uid('m'),
      date: m.date || today(),
      meal: m.meal || '早餐',
      name: String(m.name || '').trim(),
      grams: Math.max(0, Math.round(Number(m.grams) || 0)),
      kcal: Math.max(0, Math.round(Number(m.kcal) || 0)),
      protein: Math.max(0, Math.round((Number(m.protein) || 0) * 10) / 10),
      carb: Math.max(0, Math.round((Number(m.carb) || 0) * 10) / 10),
      fat: Math.max(0, Math.round((Number(m.fat) || 0) * 10) / 10)
    };
    s.meals.push(item);
    s.settings.demo = false;
    save();
    return item;
  }

  function removeMeal(id) {
    const s = get();
    s.meals = s.meals.filter(function (m) { return m.id !== id; });
    save();
  }

  /* ---------- 身体数据 ---------- */
  function bodyRecords() {
    return get().body.slice().sort(function (a, b) {
      return a.date === b.date ? 0 : (a.date < b.date ? 1 : -1);
    });
  }

  function latestBody() {
    const list = get().body.slice().sort(function (a, b) {
      return a.date === b.date ? 0 : (a.date < b.date ? 1 : -1);
    });
    return list[0] || null;
  }

  function addBody(b) {
    const s = get();
    const item = {
      id: uid('b'),
      date: b.date || today(),
      weight: Math.round((Number(b.weight) || 0) * 10) / 10,
      bodyfat: b.bodyfat === '' || b.bodyfat == null ? null : Math.round(Number(b.bodyfat) * 10) / 10
    };
    // 同一天覆盖旧记录
    s.body = s.body.filter(function (x) { return x.date !== item.date; });
    s.body.push(item);
    s.settings.demo = false;
    save();
    return item;
  }

  function removeBody(id) {
    const s = get();
    s.body = s.body.filter(function (b) { return b.id !== id; });
    save();
  }

  /* ---------- 统计 ---------- */
  function sum(list, key) {
    return list.reduce(function (a, x) { return a + (Number(x[key]) || 0); }, 0);
  }

  function dayTotals(date) {
    const ms = get().meals.filter(function (m) { return m.date === date; });
    const ws = get().workouts.filter(function (w) { return w.date === date; });
    return {
      kcal: Math.round(sum(ms, 'kcal')),
      protein: Math.round(sum(ms, 'protein') * 10) / 10,
      carb: Math.round(sum(ms, 'carb') * 10) / 10,
      fat: Math.round(sum(ms, 'fat') * 10) / 10,
      burned: ws.reduce(function (a, w) { return a + workoutKcal(w); }, 0),
      minutes: sum(ws, 'minutes'),
      sessions: ws.length,
      mealCount: ms.length
    };
  }

  function hasRecord(date) {
    const s = get();
    return s.workouts.some(function (w) { return w.date === date; }) ||
      s.meals.some(function (m) { return m.date === date; }) ||
      s.body.some(function (b) { return b.date === date; });
  }

  function streak() {
    // 连续打卡：当天有训练或身体记录就算（只记饮食不算训练打卡）
    const trained = function (date) {
      const s = get();
      return s.workouts.some(function (w) { return w.date === date; }) ||
        s.body.some(function (b) { return b.date === date; });
    };
    let n = 0;
    let cursor = today();
    if (!trained(cursor)) cursor = addDays(cursor, -1);
    while (trained(cursor)) {
      n++;
      cursor = addDays(cursor, -1);
    }
    return n;
  }

  function weekWorkouts(refDate) {
    const start = weekStart(refDate);
    const end = addDays(start, 6);
    return get().workouts.filter(function (w) { return w.date >= start && w.date <= end; });
  }

  function weekRange(refDate) {
    const start = weekStart(refDate);
    return { start: start, end: addDays(start, 6) };
  }

  function weeklySeries(n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const start = addDays(weekStart(today()), -7 * i);
      const end = addDays(start, 6);
      const ws = get().workouts.filter(function (w) { return w.date >= start && w.date <= end; });
      out.push({
        start: start,
        end: end,
        label: fmtDate(start).replace('月', '/').replace('日', ''),
        sessions: ws.length,
        volume: Math.round(ws.reduce(function (a, w) { return a + volume(w); }, 0)),
        minutes: ws.reduce(function (a, w) { return a + (w.minutes || 0); }, 0)
      });
    }
    return out;
  }

  function caloriesSeries(days) {
    const dates = lastNDates(days);
    return dates.map(function (d) {
      return { date: d, label: fmtDate(d).replace('月', '/').replace('日', ''), value: dayTotals(d).kcal };
    });
  }

  function weightSeries() {
    // 按日期从旧到新，方便直接画趋势图
    return get().body.slice().sort(function (a, b) {
      return a.date === b.date ? 0 : (a.date > b.date ? 1 : -1);
    }).map(function (b) {
      return { date: b.date, label: fmtDate(b.date).replace('月', '/').replace('日', ''), value: b.weight };
    });
  }

  function heatmapWeeks(weeks) {
    const start = addDays(weekStart(today()), -7 * (weeks - 1));
    const out = [];
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const key = addDays(start, w * 7 + d);
        const ws = get().workouts.filter(function (x) { return x.date === key; });
        const mins = ws.reduce(function (a, x) { return a + (x.minutes || 0); }, 0);
        let level = 0;
        if (key <= today()) {
          if (mins > 0 && mins < 45) level = 1;
          else if (mins >= 45 && mins < 65) level = 2;
          else if (mins >= 65 && mins < 85) level = 3;
          else if (mins >= 85) level = 4;
        }
        out.push({ date: key, level: level, minutes: mins, future: key > today() });
      }
    }
    return out;
  }

  function typeDistribution() {
    const map = {};
    get().workouts.forEach(function (w) {
      map[w.type] = (map[w.type] || 0) + 1;
    });
    return FIT.TYPES.filter(function (t) { return map[t.key]; }).map(function (t) {
      return { key: t.key, name: t.name, color: t.color, value: map[t.key] };
    });
  }

  function personalRecords(limit) {
    const map = {};
    get().workouts.forEach(function (w) {
      (w.exercises || []).forEach(function (e) {
        const wgt = Number(e.weight) || 0;
        if (!wgt) return;
        if (!map[e.name] || wgt > map[e.name].weight) {
          map[e.name] = { name: e.name, weight: wgt, sets: e.sets, reps: e.reps, date: w.date };
        }
      });
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return b.weight - a.weight; })
      .slice(0, limit || 6);
  }

  function bmi() {
    const b = latestBody();
    const h = Number(settings().height) || 0;
    if (!b || !h) return null;
    return Math.round(b.weight / Math.pow(h / 100, 2) * 10) / 10;
  }

  function monthSummary() {
    const start = addDays(today(), -29);
    const ws = get().workouts.filter(function (w) { return w.date >= start; });
    const mealsList = get().meals.filter(function (m) { return m.date >= start; });
    const days = new Set(mealsList.map(function (m) { return m.date; }));
    return {
      workouts: ws.length,
      volume: Math.round(ws.reduce(function (a, w) { return a + volume(w); }, 0)),
      minutes: ws.reduce(function (a, w) { return a + (w.minutes || 0); }, 0),
      kcalAvg: days.size ? Math.round(sum(mealsList, 'kcal') / days.size) : 0,
      days: days.size
    };
  }

  /* ---------- 导入导出 / 重置 ---------- */
  function exportJSON() {
    const s = get();
    return JSON.stringify({
      app: 'FitLog',
      version: VERSION,
      exportedAt: new Date().toISOString(),
      data: s
    }, null, 2);
  }

  function importJSON(text) {
    const parsed = JSON.parse(text);
    const data = parsed && parsed.data ? parsed.data : parsed;
    if (!data || !Array.isArray(data.workouts) || !Array.isArray(data.meals)) {
      throw new Error('文件格式不对：缺少 workouts / meals 数组');
    }
    state = normalize(data);
    persist();
    return state;
  }

  function clearAll(withSeed) {
    const theme = state ? state.settings.theme : 'dark';
    state = blankState();
    state.settings.theme = theme; // 主题偏好保留，清数据不等于重置界面
    if (withSeed) seed(state);
    persist();
    return state;
  }

  function resetSettings() {
    const s = get();
    s.settings = Object.assign({}, DEFAULT_SETTINGS, { theme: s.settings.theme });
    persist();
    return s.settings;
  }

  return {
    KEY: KEY,
    init: init,
    get: get,
    save: save,
    settings: settings,
    updateSettings: updateSettings,
    workouts: workouts,
    addWorkout: addWorkout,
    removeWorkout: removeWorkout,
    workoutKcal: workoutKcal,
    volume: volume,
    meals: meals,
    addMeal: addMeal,
    removeMeal: removeMeal,
    bodyRecords: bodyRecords,
    latestBody: latestBody,
    addBody: addBody,
    removeBody: removeBody,
    dayTotals: dayTotals,
    hasRecord: hasRecord,
    streak: streak,
    weekWorkouts: weekWorkouts,
    weekRange: weekRange,
    weeklySeries: weeklySeries,
    caloriesSeries: caloriesSeries,
    weightSeries: weightSeries,
    heatmapWeeks: heatmapWeeks,
    typeDistribution: typeDistribution,
    personalRecords: personalRecords,
    bmi: bmi,
    monthSummary: monthSummary,
    exportJSON: exportJSON,
    importJSON: importJSON,
    clearAll: clearAll,
    resetSettings: resetSettings,
    // 日期工具
    today: today,
    dateKey: dateKey,
    addDays: addDays,
    parseKey: parseKey,
    weekday: weekday,
    fmtDate: fmtDate,
    fmtDateFull: fmtDateFull,
    weekStart: weekStart,
    diffDays: diffDays,
    lastNDates: lastNDates
  };
})();
