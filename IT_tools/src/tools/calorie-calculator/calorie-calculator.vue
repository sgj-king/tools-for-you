<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NInputNumber, NGrid, NGi, NSwitch, NIcon, NSelect, NSlider } from 'naive-ui';
import { Copy, Refresh } from '@vicons/tabler';

// ===================== i18n =====================
const labels = {
  zh: {
    title: '卡路里计算器',
    subtitle: '计算每日所需卡路里、基础代谢率(BMR)和每日总能量消耗(TDEE)',
    gender: '性别',
    male: '男性',
    female: '女性',
    age: '年龄',
    weight: '体重',
    height: '身高',
    activityLevel: '活动水平',
    sedentary: '久坐不动',
    sedentaryDesc: '几乎不运动，办公室工作',
    light: '轻度活动',
    lightDesc: '每周运动1-3天',
    moderate: '中度活动',
    moderateDesc: '每周运动3-5天',
    active: '高度活动',
    activeDesc: '每周运动6-7天',
    veryActive: '极高活动',
    veryActiveDesc: '高强度运动/体力工作',
    result: '计算结果',
    bmr: '基础代谢率 (BMR)',
    tdee: '每日总消耗 (TDEE)',
    yourGoal: '你的目标',
    lose: '减脂',
    maintain: '维持',
    gain: '增肌',
    dailyCalorie: '每日卡路里',
    weeklyChange: '每周体重变化',
    macroSplit: '三大营养素分配',
    protein: '蛋白质',
    carbs: '碳水化合物',
    fat: '脂肪',
    grams: '克',
    whatIsBMR: '什么是 BMR？',
    bmrDesc: 'BMR（基础代谢率）是身体在完全静息状态下维持基本生命功能（呼吸、心跳、体温调节等）所需的最低热量。即使一整天不活动，身体也会消耗这些热量。',
    whatIsTDEE: '什么是 TDEE？',
    tdeeDesc: 'TDEE（每日总能量消耗）是在 BMR 基础上，考虑日常活动和运动后的总热量消耗。它是制定饮食计划的重要参考值。',
    formula: '计算公式',
    formulaDesc: '使用 Mifflin-St Jeor 公式，是目前公认最准确的 BMR 计算公式',
    maleFormula: '男性: BMR = 10×体重(kg) + 6.25×身高(cm) - 5×年龄 - 161 + 5',
    femaleFormula: '女性: BMR = 10×体重(kg) + 6.25×身高(cm) - 5×年龄 - 161',
    usage: '使用说明',
    step1: '选择性别',
    step2: '输入年龄、体重和身高',
    step3: '选择活动水平',
    step4: '查看计算结果和营养建议',
    notice: '注意',
    noticeContent: '此计算器使用 Mifflin-St Jeor 公式估算，仅供参考。实际热量需求受多种因素影响（肌肉量、代谢率、健康状况等），建议咨询专业营养师。',
    copied: '已复制！',
    reset: '重置',
    inputAge: '输入年龄',
    inputWeight: '输入体重',
    inputHeight: '输入身高',
    kg: '公斤',
    cm: '厘米',
    yearsOld: '岁',
    kcal: '千卡',
    loseNote: '建议适度减少摄入，每周减0.5kg为健康速度',
    gainNote: '建议适度增加摄入，配合力量训练效果更佳',
    maintainNote: '保持当前摄入即可维持体重',
    proteinCal: '1克蛋白质 = 4千卡',
    carbsCal: '1克碳水 = 4千卡',
    fatCal: '1克脂肪 = 9千卡',
    loseRatio: '减脂推荐比例',
    gainRatio: '增肌推荐比例',
    maintainRatio: '维持推荐比例',
    targetCalorie: '目标卡路里',
    calorieDeficit: '热量缺口',
    calorieSurplus: '热量盈余',
    perDay: '/天',
  },
  en: {
    title: 'Calorie Calculator',
    subtitle: 'Calculate daily calorie needs, BMR (Basal Metabolic Rate) and TDEE (Total Daily Energy Expenditure)',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    age: 'Age',
    weight: 'Weight',
    height: 'Height',
    activityLevel: 'Activity Level',
    sedentary: 'Sedentary',
    sedentaryDesc: 'Little or no exercise, desk job',
    light: 'Lightly Active',
    lightDesc: 'Exercise 1-3 days/week',
    moderate: 'Moderately Active',
    moderateDesc: 'Exercise 3-5 days/week',
    active: 'Very Active',
    activeDesc: 'Exercise 6-7 days/week',
    veryActive: 'Extra Active',
    veryActiveDesc: 'Hard exercise/physical job',
    result: 'Results',
    bmr: 'Basal Metabolic Rate (BMR)',
    tdee: 'Total Daily Energy Expenditure (TDEE)',
    yourGoal: 'Your Goal',
    lose: 'Lose Fat',
    maintain: 'Maintain',
    gain: 'Gain Muscle',
    dailyCalorie: 'Daily Calories',
    weeklyChange: 'Weekly Weight Change',
    macroSplit: 'Macronutrient Split',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    grams: 'g',
    whatIsBMR: 'What is BMR?',
    bmrDesc: 'BMR (Basal Metabolic Rate) is the minimum calories your body needs at complete rest to maintain basic life functions (breathing, heartbeat, temperature regulation, etc.). Even without any activity, your body burns these calories.',
    whatIsTDEE: 'What is TDEE?',
    tdeeDesc: 'TDEE (Total Daily Energy Expenditure) is your total calorie burn factoring in BMR plus daily activities and exercise. It is a key reference for creating diet plans.',
    formula: 'Formula',
    formulaDesc: 'Uses the Mifflin-St Jeor equation, widely regarded as the most accurate BMR formula',
    maleFormula: 'Male: BMR = 10×weight(kg) + 6.25×height(cm) - 5×age + 5',
    femaleFormula: 'Female: BMR = 10×weight(kg) + 6.25×height(cm) - 5×age - 161',
    usage: 'How to Use',
    step1: 'Select gender',
    step2: 'Enter age, weight and height',
    step3: 'Choose activity level',
    step4: 'View results and nutrition advice',
    notice: 'Notice',
    noticeContent: 'This calculator uses the Mifflin-St Jeor formula for estimation and is for reference only. Actual calorie needs are affected by many factors (muscle mass, metabolism, health conditions, etc.). Consult a professional nutritionist for personalized advice.',
    copied: 'Copied!',
    reset: 'Reset',
    inputAge: 'Enter age',
    inputWeight: 'Enter weight',
    inputHeight: 'Enter height',
    kg: 'kg',
    cm: 'cm',
    yearsOld: 'years',
    kcal: 'kcal',
    loseNote: 'Moderate deficit recommended. 0.5kg/week is a healthy rate.',
    gainNote: 'Moderate surplus recommended. Combine with strength training for best results.',
    maintainNote: 'Maintain current intake to sustain weight.',
    proteinCal: '1g protein = 4 kcal',
    carbsCal: '1g carbs = 4 kcal',
    fatCal: '1g fat = 9 kcal',
    loseRatio: 'Fat Loss Ratio',
    gainRatio: 'Muscle Gain Ratio',
    maintainRatio: 'Maintenance Ratio',
    targetCalorie: 'Target Calories',
    calorieDeficit: 'Calorie Deficit',
    calorieSurplus: 'Calorie Surplus',
    perDay: '/day',
  },
};

// Language
const lang = ref<'zh' | 'en'>('zh');
const t = (key: keyof typeof labels.zh) => computed(() => labels[lang.value][key]);

// Input state
const gender = ref<'male' | 'female'>('male');
const age = ref<number | null>(null);
const weight = ref<number | null>(null);
const height = ref<number | null>(null);
const activityLevel = ref<'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive'>('moderate');

// Activity multipliers
const activityMultipliers: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

// Goal adjustments (calorie difference from TDEE)
const goalAdjustments: Record<string, number> = {
  lose: -500, // ~0.5kg/week deficit
  maintain: 0,
  gain: 400, // moderate surplus for lean gain
};

// Macro ratios for each goal
const macroRatios: Record<string, { protein: number; carbs: number; fat: number; label: string }> = {
  lose: { protein: 0.40, carbs: 0.30, fat: 0.30, label: 'loseRatio' },
  maintain: { protein: 0.30, carbs: 0.40, fat: 0.30, label: 'maintainRatio' },
  gain: { protein: 0.30, carbs: 0.45, fat: 0.25, label: 'gainRatio' },
};

// Activity level options
const activityOptions = computed(() => [
  { value: 'sedentary', label: t('sedentary').value, desc: t('sedentaryDesc').value, multiplier: 1.2 },
  { value: 'light', label: t('light').value, desc: t('lightDesc').value, multiplier: 1.375 },
  { value: 'moderate', label: t('moderate').value, desc: t('moderateDesc').value, multiplier: 1.55 },
  { value: 'active', label: t('active').value, desc: t('activeDesc').value, multiplier: 1.725 },
  { value: 'veryActive', label: t('veryActive').value, desc: t('veryActiveDesc').value, multiplier: 1.9 },
]);

// Calculate BMR using Mifflin-St Jeor
const bmr = computed(() => {
  if (!age.value || !weight.value || !height.value) return null;
  if (gender.value === 'male') {
    return 10 * weight.value + 6.25 * height.value - 5 * age.value + 5;
  }
  return 10 * weight.value + 6.25 * height.value - 5 * age.value - 161;
});

// Calculate TDEE
const tdee = computed(() => {
  if (!bmr.value) return null;
  return bmr.value * activityMultipliers[activityLevel.value];
});

// Goal calories
const goalCalories = computed(() => {
  if (!tdee.value) return { lose: null, maintain: null, gain: null };
  return {
    lose: Math.round(tdee.value - 500),
    maintain: Math.round(tdee.value),
    gain: Math.round(tdee.value + 400),
  };
});

// Macro calculation for a given calorie target
function calcMacros(calories: number, goal: string) {
  const ratio = macroRatios[goal];
  return {
    protein: Math.round((calories * ratio.protein) / 4),
    carbs: Math.round((calories * ratio.carbs) / 4),
    fat: Math.round((calories * ratio.fat) / 9),
    proteinPct: ratio.protein * 100,
    carbsPct: ratio.carbs * 100,
    fatPct: ratio.fat * 100,
  };
}

// Selected goal
const selectedGoal = ref<'lose' | 'maintain' | 'gain'>('maintain');

// Active result
const activeResult = computed(() => {
  if (!tdee.value || !goalCalories.value.lose) return null;
  const target = goalCalories.value[selectedGoal.value];
  const macros = calcMacros(target, selectedGoal.value);
  const diff = target - Math.round(tdee.value);
  return {
    bmr: Math.round(bmr.value!),
    tdee: Math.round(tdee.value),
    target,
    diff,
    macros,
    weeklyChange: selectedGoal.value === 'lose' ? '-0.5' : selectedGoal.value === 'gain' ? '+0.3' : '0',
  };
});

// Goal cards data
const goalCards = computed(() => {
  if (!tdee.value || !goalCalories.value.lose) return null;
  return [
    {
      key: 'lose' as const,
      icon: '📉',
      color: '#f97316',
      gradient: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.08))',
      border: 'rgba(249,115,22,0.3)',
      calories: goalCalories.value.lose,
      note: t('loseNote').value,
    },
    {
      key: 'maintain' as const,
      icon: '⚖️',
      color: '#22c55e',
      gradient: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.08))',
      border: 'rgba(34,197,94,0.3)',
      calories: goalCalories.value.maintain,
      note: t('maintainNote').value,
    },
    {
      key: 'gain' as const,
      icon: '💪',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.08))',
      border: 'rgba(59,130,246,0.3)',
      calories: goalCalories.value.gain,
      note: t('gainNote').value,
    },
  ];
});

// Reset
function resetForm() {
  gender.value = 'male';
  age.value = null;
  weight.value = null;
  height.value = null;
  activityLevel.value = 'moderate';
  selectedGoal.value = 'maintain';
}

// Copy
const justCopied = ref(false);
function copyResult() {
  if (!activeResult.value) return;
  const r = activeResult.value;
  const goalName = t(selectedGoal.value).value;
  const text = lang.value === 'zh'
    ? `${goalName}: ${r.target}千卡/天 | BMR: ${r.bmr}千卡 | TDEE: ${r.tdee}千卡 | 蛋白质: ${r.macros.protein}g | 碳水: ${r.macros.carbs}g | 脂肪: ${r.macros.fat}g`
    : `${goalName}: ${r.target}kcal/day | BMR: ${r.bmr}kcal | TDEE: ${r.tdee}kcal | Protein: ${r.macros.protein}g | Carbs: ${r.macros.carbs}g | Fat: ${r.macros.fat}g`;
  navigator.clipboard.writeText(text);
  justCopied.value = true;
  setTimeout(() => { justCopied.value = false; }, 1500);
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 900px">
      <!-- Language Switcher -->
      <div flex justify-end mb-2>
        <n-switch :value="lang === 'en'" @update:value="lang = $event ? 'en' : 'zh'" size="small">
          <template #checked>EN</template>
          <template #unchecked>中</template>
        </n-switch>
      </div>

      <n-grid :cols="24" :x-gap="16" responsive="screen" item-responsive>
        <!-- Left: Input -->
        <n-gi span="24 m:10">
          <c-card mb-4>
            <div text-lg font-bold mb-4>🔥 {{ t('title').value }}</div>

            <!-- Gender Toggle -->
            <div mb-4>
              <div mb-1 text-sm op-70>{{ t('gender').value }}</div>
              <n-button-group style="width: 100%">
                <n-button
                  :type="gender === 'male' ? 'primary' : 'default'"
                  style="flex: 1"
                  @click="gender = 'male'"
                >
                  🧑 {{ t('male').value }}
                </n-button>
                <n-button
                  :type="gender === 'female' ? 'primary' : 'default'"
                  style="flex: 1"
                  @click="gender = 'female'"
                >
                  👩 {{ t('female').value }}
                </n-button>
              </n-button-group>
            </div>

            <!-- Age -->
            <div mb-4>
              <div mb-1 text-sm op-70>{{ t('age').value }}</div>
              <n-input-number
                v-model:value="age"
                :min="10"
                :max="120"
                :step="1"
                size="large"
                :placeholder="t('inputAge').value"
                style="width: 100%"
              >
                <template #suffix>{{ t('yearsOld').value }}</template>
              </n-input-number>
            </div>

            <!-- Weight -->
            <div mb-4>
              <div mb-1 text-sm op-70>{{ t('weight').value }}</div>
              <n-input-number
                v-model:value="weight"
                :min="20"
                :max="300"
                :step="0.5"
                size="large"
                :placeholder="t('inputWeight').value + ' (kg)'"
                style="width: 100%"
              >
                <template #suffix>{{ t('kg').value }}</template>
              </n-input-number>
            </div>

            <!-- Height -->
            <div mb-4>
              <div mb-1 text-sm op-70>{{ t('height').value }}</div>
              <n-input-number
                v-model:value="height"
                :min="100"
                :max="250"
                :step="1"
                size="large"
                :placeholder="t('inputHeight').value + ' (cm)'"
                style="width: 100%"
              >
                <template #suffix>{{ t('cm').value }}</template>
              </n-input-number>
            </div>

            <!-- Activity Level -->
            <div mb-4>
              <div mb-1 text-sm op-70>{{ t('activityLevel').value }}</div>
              <div flex flex-col gap-2>
                <div
                  v-for="opt in activityOptions"
                  :key="opt.value"
                  p-3 rounded-lg cursor-pointer transition-all
                  :style="{
                    background: activityLevel === opt.value
                      ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.08))'
                      : 'rgba(255,255,255,0.03)',
                    border: activityLevel === opt.value
                      ? '1px solid rgba(59,130,246,0.35)'
                      : '1px solid rgba(255,255,255,0.06)',
                  }"
                  @click="activityLevel = opt.value as any"
                >
                  <div flex justify-between items-center>
                    <span text-sm font-bold :style="{ color: activityLevel === opt.value ? '#60a5fa' : 'inherit' }">
                      {{ opt.label }}
                    </span>
                    <span text-xs op-40 font-mono>×{{ opt.multiplier }}</span>
                  </div>
                  <div text-xs op-40 mt-1>{{ opt.desc }}</div>
                </div>
              </div>
            </div>

            <!-- Reset Button -->
            <div flex justify-center mt-4>
              <n-button quaternary round @click="resetForm">
                <template #icon><n-icon><Refresh /></n-icon></template>
                {{ t('reset').value }}
              </n-button>
            </div>
          </c-card>
        </n-gi>

        <!-- Right: Results -->
        <n-gi span="24 m:14">
          <!-- Result Card -->
          <c-card v-if="activeResult && goalCards" mb-4>
            <div text-lg font-bold mb-4>📊 {{ t('result').value }}</div>

            <!-- BMR & TDEE Big Numbers -->
            <n-grid :cols="2" :x-gap="12" mb-4>
              <n-gi>
                <div p-4 rounded-xl text-center style="background: linear-gradient(135deg, rgba(168,85,247,0.12), rgba(139,92,246,0.06)); border: 1px solid rgba(168,85,247,0.2);">
                  <div text-xs op-50 mb-1>{{ t('bmr').value }}</div>
                  <div text-3xl font-bold text-purple-400>{{ activeResult.bmr }}</div>
                  <div text-xs op-40>{{ t('kcal').value }}{{ t('perDay').value }}</div>
                </div>
              </n-gi>
              <n-gi>
                <div p-4 rounded-xl text-center style="background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(37,99,235,0.06)); border: 1px solid rgba(59,130,246,0.2);">
                  <div text-xs op-50 mb-1>{{ t('tdee').value }}</div>
                  <div text-3xl font-bold text-blue-400>{{ activeResult.tdee }}</div>
                  <div text-xs op-40>{{ t('kcal').value }}{{ t('perDay').value }}</div>
                </div>
              </n-gi>
            </n-grid>

            <!-- Goal Cards -->
            <div text-sm font-bold mb-3>🎯 {{ t('yourGoal').value }}</div>
            <n-grid :cols="3" :x-gap="10" mb-4>
              <n-gi v-for="card in goalCards" :key="card.key">
                <div
                  p-3 rounded-xl cursor-pointer transition-all text-center
                  :style="{
                    background: selectedGoal === card.key ? card.gradient : 'rgba(255,255,255,0.03)',
                    border: selectedGoal === card.key ? `1px solid ${card.border}` : '1px solid rgba(255,255,255,0.06)',
                    transform: selectedGoal === card.key ? 'scale(1.03)' : 'scale(1)',
                  }"
                  @click="selectedGoal = card.key"
                >
                  <div text-2xl mb-1>{{ card.icon }}</div>
                  <div text-xs font-bold mb-1 :style="{ color: selectedGoal === card.key ? card.color : 'inherit' }">
                    {{ t(card.key).value }}
                  </div>
                  <div text-lg font-bold :style="{ color: card.color }">{{ card.calories }}</div>
                  <div text-xs op-40>{{ t('kcal').value }}</div>
                </div>
              </n-gi>
            </n-grid>

            <!-- Selected Goal Details -->
            <div p-4 rounded-xl mb-4 :style="{
              background: goalCards.find(c => c.key === selectedGoal)?.gradient,
              border: `1px solid ${goalCards.find(c => c.key === selectedGoal)?.border}`,
            }">
              <!-- Target Calorie & Diff -->
              <div flex justify-between items-center mb-3>
                <div>
                  <div text-sm op-70>{{ t('targetCalorie').value }}</div>
                  <div text-2xl font-bold>{{ activeResult.target }} <span text-sm op-50>{{ t('kcal').value }}</span></div>
                </div>
                <div text-right>
                  <div v-if="activeResult.diff < 0" text-sm op-70>{{ t('calorieDeficit').value }}</div>
                  <div v-else-if="activeResult.diff > 0" text-sm op-70>{{ t('calorieSurplus').value }}</div>
                  <div v-else text-sm op-70>{{ t('maintain').value }}</div>
                  <div v-if="activeResult.diff !== 0" text-xl font-bold :style="{
                    color: activeResult.diff < 0 ? '#f97316' : '#3b82f6',
                  }">
                    {{ activeResult.diff > 0 ? '+' : '' }}{{ activeResult.diff }} <span text-sm op-50>{{ t('kcal').value }}</span>
                  </div>
                  <div v-else text-xl font-bold text-green-400>— 0</div>
                </div>
              </div>

              <!-- Weekly Change -->
              <div text-xs op-50 mb-4>
                📅 {{ t('weeklyChange').value }}: <span font-bold :style="{
                  color: activeResult.weeklyChange.startsWith('-') ? '#f97316' : activeResult.weeklyChange.startsWith('+') ? '#3b82f6' : '#22c55e',
                }">{{ activeResult.weeklyChange }} kg</span>
              </div>

              <!-- Macro Split -->
              <div text-sm font-bold mb-3>🥗 {{ t('macroSplit').value }}</div>

              <!-- Macro Bar Visual -->
              <div h-3 rounded-full overflow-hidden mb-3 style="background: rgba(255,255,255,0.05);">
                <div flex h-full>
                  <div :style="{ width: activeResult.macros.proteinPct + '%', background: 'linear-gradient(90deg, #ef4444, #f97316)' }" />
                  <div :style="{ width: activeResult.macros.carbsPct + '%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }" />
                  <div :style="{ width: activeResult.macros.fatPct + '%', background: 'linear-gradient(90deg, #a855f7, #c084fc)' }" />
                </div>
              </div>

              <!-- Macro Details -->
              <n-grid :cols="3" :x-gap="10">
                <n-gi>
                  <div p-3 rounded-lg text-center style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);">
                    <div text-xs text-red-400 mb-1>{{ t('protein').value }}</div>
                    <div text-xl font-bold>{{ activeResult.macros.protein }}<span text-xs op-50 ml-1>{{ t('grams').value }}</span></div>
                    <div text-xs op-40>{{ activeResult.macros.proteinPct }}%</div>
                  </div>
                </n-gi>
                <n-gi>
                  <div p-3 rounded-lg text-center style="background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.15);">
                    <div text-xs text-blue-400 mb-1>{{ t('carbs').value }}</div>
                    <div text-xl font-bold>{{ activeResult.macros.carbs }}<span text-xs op-50 ml-1>{{ t('grams').value }}</span></div>
                    <div text-xs op-40>{{ activeResult.macros.carbsPct }}%</div>
                  </div>
                </n-gi>
                <n-gi>
                  <div p-3 rounded-lg text-center style="background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.15);">
                    <div text-xs text-purple-400 mb-1>{{ t('fat').value }}</div>
                    <div text-xl font-bold>{{ activeResult.macros.fat }}<span text-xs op-50 ml-1>{{ t('grams').value }}</span></div>
                    <div text-xs style="opacity:0.4">{{ activeResult.macros.fatPct }}%</div>
                  </div>
                </n-gi>
              </n-grid>
            </div>

            <!-- Copy Button -->
            <div flex justify-center>
              <n-button size="small" round quaternary @click="copyResult">
                <template #icon><n-icon><Copy /></n-icon></template>
                {{ justCopied ? t('copied').value : t('dailyCalorie').value }}
              </n-button>
            </div>
          </c-card>

          <!-- Empty State -->
          <c-card v-else mb-4>
            <div text-center py-8>
              <div text-4xl mb-3>🔥</div>
              <div text-sm op-50>{{ lang === 'zh' ? '输入个人信息开始计算' : 'Enter your info to calculate' }}</div>
            </div>
          </c-card>

          <!-- Info Cards -->
          <n-grid :cols="24" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
            <n-gi span="24 m:12">
              <c-card>
                <div p-3 rounded-lg style="background: rgba(255,255,255,0.05);">
                  <div text-sm op-70 mb-2>{{ t('whatIsBMR').value }}</div>
                  <div text-xs leading-relaxed op-60>{{ t('bmrDesc').value }}</div>
                </div>
              </c-card>
            </n-gi>
            <n-gi span="24 m:12">
              <c-card>
                <div p-3 rounded-lg style="background: rgba(255,255,255,0.05);">
                  <div text-sm op-70 mb-2>{{ t('whatIsTDEE').value }}</div>
                  <div text-xs leading-relaxed op-60>{{ t('tdeeDesc').value }}</div>
                </div>
              </c-card>
            </n-gi>
          </n-grid>

          <!-- Formula -->
          <c-card mb-4>
            <div p-3 rounded-lg style="background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.15);">
              <div text-sm text-blue-400 mb-2>📐 {{ t('formula').value }}</div>
              <div text-xs op-60 mb-2>{{ t('formulaDesc').value }}</div>
              <div text-sm font-mono op-80 mb-1>{{ t('maleFormula').value }}</div>
              <div text-sm font-mono op-80>{{ t('femaleFormula').value }}</div>
            </div>
          </c-card>

          <!-- Macro Reference -->
          <c-card mb-4>
            <div text-sm font-bold mb-3>🔬 {{ t('macroSplit').value }}</div>
            <div flex flex-col gap-2>
              <div v-for="item in [
                { key: 'loseRatio', goal: 'lose', p: '40/30/30', color: '#f97316', icon: '📉' },
                { key: 'maintainRatio', goal: 'maintain', p: '30/40/30', color: '#22c55e', icon: '⚖️' },
                { key: 'gainRatio', goal: 'gain', p: '30/45/25', color: '#3b82f6', icon: '💪' },
              ]" :key="item.goal" flex justify-between items-center p-3 rounded-lg style="background: rgba(255,255,255,0.03);">
                <span text-sm font-bold :style="{ color: item.color }">{{ item.icon }} {{ t(item.key as any).value }}</span>
                <span text-sm font-mono op-70>{{ item.p }}</span>
                <span text-xs op-40>{{ lang === 'zh' ? '蛋白质/碳水/脂肪' : 'Protein/Carbs/Fat' }}</span>
              </div>
            </div>
            <div mt-3 flex flex-col gap-1>
              <div text-xs op-40>🥩 {{ t('proteinCal').value }}</div>
              <div text-xs op-40>🍚 {{ t('carbsCal').value }}</div>
              <div text-xs op-40>🥑 {{ t('fatCal').value }}</div>
            </div>
          </c-card>

          <!-- Notice -->
          <c-card>
            <div p-3 rounded-lg style="background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);">
              <div text-sm text-amber-400 mb-1>⚠️ {{ t('notice').value }}</div>
              <div text-xs op-70>{{ t('noticeContent').value }}</div>
            </div>
          </c-card>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>

<style scoped>
</style>
