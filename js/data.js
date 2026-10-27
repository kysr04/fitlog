/* =========================================================
   data.js —— 静态资料库（不依赖网络，全部内联）
   1. 训练部位 / 配色
   2. 动作库（按部位）
   3. 训练模板（一键填充）
   4. 食物库（每 100g 营养，含常用份量）
   5. 常量与文案
   ========================================================= */

window.FIT = (function () {
  'use strict';

  /* ---------- 1. 训练部位 ---------- */
  const TYPES = [
    { key: 'chest', name: '胸', color: '#ff8a5c' },
    { key: 'back', name: '背', color: '#5eead4' },
    { key: 'legs', name: '腿', color: '#a78bfa' },
    { key: 'shoulders', name: '肩', color: '#fbbf24' },
    { key: 'arms', name: '手臂', color: '#f472b6' },
    { key: 'core', name: '核心', color: '#38bdf8' },
    { key: 'cardio', name: '有氧', color: '#fb7185' },
    { key: 'full', name: '全身', color: '#c3f53c' }
  ];

  /* ---------- 2. 动作库 ---------- */
  const EXERCISES = [
    // 胸
    { name: '杠铃卧推', type: 'chest' },
    { name: '哑铃卧推', type: 'chest' },
    { name: '上斜哑铃卧推', type: 'chest' },
    { name: '双杠臂屈伸', type: 'chest' },
    { name: '器械夹胸', type: 'chest' },
    { name: '俯卧撑', type: 'chest' },
    // 背
    { name: '引体向上', type: 'back' },
    { name: '高位下拉', type: 'back' },
    { name: '杠铃划船', type: 'back' },
    { name: '坐姿划船', type: 'back' },
    { name: '硬拉', type: 'back' },
    { name: '直臂下压', type: 'back' },
    // 腿
    { name: '杠铃深蹲', type: 'legs' },
    { name: '腿举', type: 'legs' },
    { name: '罗马尼亚硬拉', type: 'legs' },
    { name: '保加利亚分腿蹲', type: 'legs' },
    { name: '腿弯举', type: 'legs' },
    { name: '腿屈伸', type: 'legs' },
    { name: '站姿提踵', type: 'legs' },
    // 肩
    { name: '杠铃肩上推举', type: 'shoulders' },
    { name: '哑铃侧平举', type: 'shoulders' },
    { name: '俯身哑铃飞鸟', type: 'shoulders' },
    { name: '绳索面拉', type: 'shoulders' },
    { name: '阿诺德推举', type: 'shoulders' },
    // 手臂
    { name: '杠铃弯举', type: 'arms' },
    { name: '哑铃交替弯举', type: 'arms' },
    { name: '锤式弯举', type: 'arms' },
    { name: '绳索三头下压', type: 'arms' },
    { name: '窄距卧推', type: 'arms' },
    { name: '仰卧臂屈伸', type: 'arms' },
    // 核心
    { name: '平板支撑', type: 'core' },
    { name: '卷腹', type: 'core' },
    { name: '悬垂举腿', type: 'core' },
    { name: '俄罗斯转体', type: 'core' },
    { name: '死虫式', type: 'core' },
    // 有氧
    { name: '跑步机', type: 'cardio' },
    { name: '椭圆机', type: 'cardio' },
    { name: '动感单车', type: 'cardio' },
    { name: '划船机', type: 'cardio' },
    { name: '跳绳', type: 'cardio' },
    { name: '爬楼机', type: 'cardio' },
    // 全身
    { name: '壶铃摆动', type: 'full' },
    { name: '波比跳', type: 'full' },
    { name: '农夫走', type: 'full' },
    { name: '药球砸地', type: 'full' }
  ];

  /* ---------- 3. 训练模板 ---------- */
  const TEMPLATES = [
    {
      id: 'push',
      name: '推日 · 胸肩三头',
      type: 'chest',
      minutes: 65,
      exercises: [
        { name: '杠铃卧推', weight: 60, sets: 4, reps: 8 },
        { name: '上斜哑铃卧推', weight: 20, sets: 3, reps: 10 },
        { name: '哑铃侧平举', weight: 8, sets: 3, reps: 15 },
        { name: '绳索三头下压', weight: 25, sets: 3, reps: 12 }
      ]
    },
    {
      id: 'pull',
      name: '拉日 · 背二头',
      type: 'back',
      minutes: 65,
      exercises: [
        { name: '引体向上', weight: 0, sets: 4, reps: 8 },
        { name: '杠铃划船', weight: 50, sets: 4, reps: 10 },
        { name: '高位下拉', weight: 45, sets: 3, reps: 12 },
        { name: '哑铃交替弯举', weight: 12, sets: 3, reps: 12 }
      ]
    },
    {
      id: 'legs',
      name: '腿日 · 下肢力量',
      type: 'legs',
      minutes: 70,
      exercises: [
        { name: '杠铃深蹲', weight: 80, sets: 4, reps: 6 },
        { name: '罗马尼亚硬拉', weight: 70, sets: 3, reps: 10 },
        { name: '腿举', weight: 120, sets: 3, reps: 12 },
        { name: '腿弯举', weight: 35, sets: 3, reps: 12 }
      ]
    },
    {
      id: 'cardio',
      name: '有氧日 · 减脂',
      type: 'cardio',
      minutes: 40,
      exercises: [
        { name: '跑步机', weight: 0, sets: 1, reps: 30 },
        { name: '平板支撑', weight: 0, sets: 3, reps: 45 }
      ]
    }
  ];

  /* ---------- 4. 食物库（每 100g / 100ml） ---------- */
  const FOODS = [
    { name: '鸡胸肉', kcal: 133, protein: 24, carb: 0, fat: 3, serving: 150 },
    { name: '鸡蛋', kcal: 143, protein: 13, carb: 1.1, fat: 9.5, serving: 100 },
    { name: '米饭', kcal: 116, protein: 2.6, carb: 25.9, fat: 0.3, serving: 200 },
    { name: '全麦面包', kcal: 246, protein: 9, carb: 45, fat: 3.5, serving: 80 },
    { name: '牛奶', kcal: 61, protein: 3.2, carb: 4.8, fat: 3.3, serving: 250 },
    { name: '无糖酸奶', kcal: 57, protein: 3.5, carb: 4.5, fat: 3, serving: 200 },
    { name: '香蕉', kcal: 93, protein: 1.4, carb: 22, fat: 0.2, serving: 120 },
    { name: '燕麦', kcal: 377, protein: 13, carb: 61, fat: 6.7, serving: 60 },
    { name: '乳清蛋白粉', kcal: 380, protein: 75, carb: 8, fat: 5, serving: 30 },
    { name: '瘦牛肉', kcal: 106, protein: 20, carb: 1.2, fat: 2.3, serving: 150 },
    { name: '三文鱼', kcal: 142, protein: 20, carb: 0, fat: 6, serving: 150 },
    { name: '虾仁', kcal: 93, protein: 18.6, carb: 1.5, fat: 1.6, serving: 150 },
    { name: '豆腐', kcal: 82, protein: 8.1, carb: 4.2, fat: 3.7, serving: 200 },
    { name: '西兰花', kcal: 34, protein: 2.8, carb: 7, fat: 0.4, serving: 150 },
    { name: '红薯', kcal: 86, protein: 1.6, carb: 20, fat: 0.2, serving: 200 },
    { name: '玉米', kcal: 112, protein: 4, carb: 22.8, fat: 1.2, serving: 150 },
    { name: '意面（熟）', kcal: 158, protein: 5.8, carb: 31, fat: 0.9, serving: 200 },
    { name: '豆浆', kcal: 31, protein: 3, carb: 1.2, fat: 1.6, serving: 300 },
    { name: '牛油果', kcal: 160, protein: 2, carb: 8.5, fat: 15, serving: 100 },
    { name: '混合坚果', kcal: 607, protein: 20, carb: 21, fat: 54, serving: 30 },
    { name: '鸡腿肉', kcal: 181, protein: 18, carb: 0, fat: 12, serving: 150 },
    { name: '猪肉水饺', kcal: 240, protein: 9, carb: 26, fat: 11, serving: 200 },
    { name: '美式咖啡', kcal: 2, protein: 0.1, carb: 0, fat: 0, serving: 300 },
    { name: '可乐', kcal: 43, protein: 0, carb: 10.6, fat: 0, serving: 330 },
    { name: '汉堡', kcal: 295, protein: 12, carb: 30, fat: 14, serving: 200 },
    { name: '薯条', kcal: 312, protein: 3.4, carb: 41, fat: 15, serving: 100 },
    { name: '黑巧克力', kcal: 546, protein: 5, carb: 60, fat: 31, serving: 30 },
    { name: '苹果', kcal: 52, protein: 0.3, carb: 14, fat: 0.2, serving: 180 }
  ];

  /* ---------- 5. 常量 ---------- */
  const MEALS = ['早餐', '午餐', '晚餐', '加餐'];
  const INTENSITY = { 低: 0.8, 中: 1, 高: 1.25 };
  const WEEKDAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  const TIPS = [
    '训练前 60 分钟补一份碳水，深蹲会明显更有劲。',
    '蛋白质分 3～4 次摄入，比一顿猛吃更有效。',
    '每周训练量涨 5%～10% 就够，暴涨容易受伤。',
    '睡眠不足 6 小时，第二天建议把强度降一档。',
    '练完 30 分钟内补 20～40g 蛋白质，恢复更快。',
    '体重看周均值，不要被单天的水分波动带跑。',
    '有氧放力量训练之后，别让它抢了你的力气。'
  ];

  /* ---------- 6. 工具函数 ---------- */
  function typeMeta(key) {
    return TYPES.find(function (t) { return t.key === key; }) || TYPES[TYPES.length - 1];
  }

  function exercisesOf(type) {
    return EXERCISES.filter(function (e) { return e.type === type; });
  }

  function exerciseType(name) {
    const hit = EXERCISES.find(function (e) { return e.name === name; });
    return hit ? hit.type : 'full';
  }

  function foodByName(name) {
    return FOODS.find(function (f) { return f.name === name; }) || null;
  }

  function foodMacros(food, grams) {
    const k = (Number(grams) || 0) / 100;
    return {
      kcal: Math.round(food.kcal * k),
      protein: Math.round(food.protein * k * 10) / 10,
      carb: Math.round(food.carb * k * 10) / 10,
      fat: Math.round(food.fat * k * 10) / 10
    };
  }

  return {
    TYPES: TYPES,
    EXERCISES: EXERCISES,
    TEMPLATES: TEMPLATES,
    FOODS: FOODS,
    MEALS: MEALS,
    INTENSITY: INTENSITY,
    WEEKDAY: WEEKDAY,
    TIPS: TIPS,
    typeMeta: typeMeta,
    exercisesOf: exercisesOf,
    exerciseType: exerciseType,
    foodByName: foodByName,
    foodMacros: foodMacros
  };
})();
